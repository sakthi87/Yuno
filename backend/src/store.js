import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

let driver = 'sqlite'
let sqliteDb = null
let pgPool = null
let dbLocation = ''

export function getDbLocation() {
  return dbLocation
}

export function getDriver() {
  return driver
}

export async function initStore() {
  if (config.dbDriver === 'postgres') {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL is required when DB_DRIVER=postgres')
    }
    driver = 'postgres'
    pgPool = new Pool({ connectionString: config.databaseUrl })
    await pgPool.query('SELECT 1')
    dbLocation = maskUrl(config.databaseUrl)
    return
  }

  driver = 'sqlite'
  const dataDir = path.dirname(config.dbPath)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  sqliteDb = new Database(config.dbPath)
  sqliteDb.pragma('journal_mode = WAL')
  sqliteDb.pragma('foreign_keys = ON')
  dbLocation = config.dbPath
}

function maskUrl(url) {
  return url.replace(/:([^:@/]+)@/, ':***@')
}

export async function closeStore() {
  if (pgPool) {
    await pgPool.end()
    pgPool = null
  }
  if (sqliteDb) {
    sqliteDb.close()
    sqliteDb = null
  }
}

export async function exec(sql) {
  if (driver === 'postgres') {
    await pgPool.query(sql)
    return
  }
  sqliteDb.exec(sql)
}

function toDriverSql(sql, params) {
  if (driver === 'postgres') {
    let index = 0
    const pgSql = sql.replace(/\?/g, () => `$${++index}`)
    return { sql: pgSql, params }
  }
  return { sql, params }
}

export async function queryAll(sql, params = []) {
  const { sql: driverSql, params: driverParams } = toDriverSql(sql, params)
  if (driver === 'postgres') {
    const result = await pgPool.query(driverSql, driverParams)
    return result.rows
  }
  if (driverParams.length === 0) return sqliteDb.prepare(driverSql).all()
  return sqliteDb.prepare(driverSql).all(...driverParams)
}

export async function queryOne(sql, params = []) {
  const { sql: driverSql, params: driverParams } = toDriverSql(sql, params)
  if (driver === 'postgres') {
    const result = await pgPool.query(driverSql, driverParams)
    return result.rows[0] || null
  }
  if (driverParams.length === 0) return sqliteDb.prepare(driverSql).get()
  return sqliteDb.prepare(driverSql).get(...driverParams)
}

export async function run(sql, params = []) {
  const { sql: driverSql, params: driverParams } = toDriverSql(sql, params)
  if (driver === 'postgres') {
    await pgPool.query(driverSql, driverParams)
    return
  }
  if (driverParams.length === 0) {
    sqliteDb.prepare(driverSql).run()
    return
  }
  sqliteDb.prepare(driverSql).run(...driverParams)
}

export async function initSchema() {
  if (driver === 'postgres') {
    return
  }

  await exec(`
    CREATE TABLE IF NOT EXISTS universes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cloud TEXT NOT NULL,
      environment TEXT NOT NULL,
      region TEXT,
      yb_version TEXT,
      owner TEXT,
      status TEXT,
      health_json TEXT,
      issues_json TEXT,
      node_names_json TEXT,
      source TEXT,
      collected_at TEXT
    );

    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      universe_id TEXT NOT NULL REFERENCES universes(id),
      name TEXT NOT NULL,
      private_ip TEXT,
      public_ip TEXT,
      az TEXT,
      role TEXT,
      status TEXT,
      vm_json TEXT,
      components_json TEXT,
      source TEXT,
      collected_at TEXT,
      last_heartbeat TEXT
    );

    CREATE TABLE IF NOT EXISTS universe_metrics (
      universe_id TEXT PRIMARY KEY REFERENCES universes(id),
      metrics_json TEXT NOT NULL,
      source TEXT,
      collected_at TEXT
    );

    CREATE TABLE IF NOT EXISTS infrastructure (
      id TEXT PRIMARY KEY,
      universe_id TEXT,
      payload_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS drift_items (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vulnerabilities (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS patch_jobs (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      sort_time TEXT
    );

    CREATE TABLE IF NOT EXISTS platform_health (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payload_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS consumer_usage (
      id TEXT PRIMARY KEY,
      universe_id TEXT NOT NULL REFERENCES universes(id),
      database_name TEXT NOT NULL,
      consumer TEXT,
      owner TEXT,
      raw_usage_pct REAL NOT NULL DEFAULT 0,
      usage_json TEXT NOT NULL DEFAULT '{}',
      trend_pct REAL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(universe_id, database_name)
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      node_id TEXT,
      universe_id TEXT,
      hostname TEXT,
      status TEXT,
      version TEXT,
      last_heartbeat TEXT,
      host_metrics_json TEXT DEFAULT '{}',
      source TEXT,
      enrolled_at TEXT
    );
  `)

  // Additive columns for provenance (SQLite)
  await ensureColumn('universes', 'source', 'TEXT')
  await ensureColumn('universes', 'collected_at', 'TEXT')
  await ensureColumn('nodes', 'source', 'TEXT')
  await ensureColumn('nodes', 'collected_at', 'TEXT')
  await ensureColumn('nodes', 'last_heartbeat', 'TEXT')
  await ensureColumn('universe_metrics', 'source', 'TEXT')
  await ensureColumn('universe_metrics', 'collected_at', 'TEXT')
}

async function ensureColumn(table, column, type) {
  try {
    const cols = await queryAll(`PRAGMA table_info(${table})`)
    if (cols.some((c) => c.name === column)) return
    await exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
  } catch {
    /* ignore if unsupported */
  }
}

export async function clearAllData() {
  const tables = [
    'consumer_usage', 'nodes', 'universe_metrics', 'infrastructure', 'alerts', 'drift_items',
    'vulnerabilities', 'patch_jobs', 'certificates', 'audit_log', 'platform_health',
    'app_config', 'universes'
  ]
  for (const table of tables) {
    await exec(`DELETE FROM ${table}`)
  }
}

export async function countUniverses() {
  const row = await queryOne('SELECT COUNT(*) AS c FROM universes')
  return Number(row?.c || 0)
}

export async function upsertConfig(key, value) {
  const json = JSON.stringify(value)
  if (driver === 'postgres') {
    await run(
      `INSERT INTO app_config (key, value_json) VALUES (?, ?)
       ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json`,
      [key, json]
    )
    return
  }
  await run('INSERT OR REPLACE INTO app_config (key, value_json) VALUES (?, ?)', [key, json])
}

export async function upsertSetting(key, value) {
  const json = JSON.stringify(value)
  if (driver === 'postgres') {
    await run(
      `INSERT INTO platform_settings (key, value_json) VALUES (?, ?)
       ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW()`,
      [key, json]
    )
    return
  }
  await run(
    `INSERT OR REPLACE INTO platform_settings (key, value_json, updated_at) VALUES (?, ?, datetime('now'))`,
    [key, json]
  )
}

export async function getSettings() {
  const rows = await queryAll('SELECT key, value_json FROM platform_settings ORDER BY key')
  const settings = {}
  for (const row of rows) {
    settings[row.key] = JSON.parse(row.value_json)
  }
  return settings
}
