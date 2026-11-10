import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')
const dbPath = path.join(dataDir, 'platform.db')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initSchema() {
  db.exec(`
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
      node_names_json TEXT
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
      components_json TEXT
    );

    CREATE TABLE IF NOT EXISTS universe_metrics (
      universe_id TEXT PRIMARY KEY REFERENCES universes(id),
      metrics_json TEXT NOT NULL
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
  `)
}

export function clearAllData() {
  const tables = [
    'nodes', 'universe_metrics', 'infrastructure', 'alerts', 'drift_items',
    'vulnerabilities', 'patch_jobs', 'certificates', 'audit_log', 'platform_health',
    'app_config', 'universes'
  ]
  for (const table of tables) {
    db.exec(`DELETE FROM ${table}`)
  }
}

export { dbPath, dataDir }
