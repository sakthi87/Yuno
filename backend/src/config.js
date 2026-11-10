import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnvFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

const candidatePaths = [
  process.env.YUNO_CONFIG_PATH,
  '/etc/yuno/yuno.env',
  path.join(__dirname, '../../packaging/mac/config/yuno.env'),
  path.join(__dirname, '../../yuno-install/config/yuno.env'),
  path.join(process.cwd(), 'config/yuno.env')
].filter(Boolean)

for (const filePath of candidatePaths) {
  loadEnvFile(filePath)
  if (filePath) {
    const secretsPath = path.join(path.dirname(filePath), 'secrets.env')
    loadEnvFile(secretsPath)
  }
}

export const config = {
  companyName: process.env.YUNO_COMPANY_NAME || 'Yugabyte Platform',
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || '0.0.0.0',
  dbDriver: (process.env.DB_DRIVER || 'sqlite').toLowerCase(),
  databaseUrl: process.env.DATABASE_URL || '',
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'platform.db'),
  autoSeed: process.env.AUTO_SEED === 'true',
  staticDir: process.env.STATIC_DIR || '',
  collectorUrl: process.env.COLLECTOR_URL || '',
  installRoot: process.env.YUNO_INSTALL_ROOT || '/opt/yuno',
  configPath: candidatePaths.find((p) => p && fs.existsSync(p)) || candidatePaths[0] || '',
  agentApiToken: process.env.AGENT_API_TOKEN || '',
  adminApiToken: process.env.ADMIN_API_TOKEN || '',
  tlsEnabled: process.env.TLS_ENABLED === 'true',
  tlsCertPath: process.env.TLS_CERT_PATH || '',
  tlsKeyPath: process.env.TLS_KEY_PATH || '',
  sessionSecret: process.env.SESSION_SECRET || '',
  authDisabled: process.env.AUTH_DISABLED === 'true',
  demoMode: process.env.DEMO_MODE === 'true' || process.env.AUTO_SEED === 'true',
  offlineInstall: process.env.OFFLINE_INSTALL === 'true'
}

export function getConfigSummary() {
  return {
    companyName: config.companyName,
    dbDriver: config.dbDriver,
    database: config.dbDriver === 'postgres' ? maskDatabaseUrl(config.databaseUrl) : config.dbPath,
    autoSeed: config.autoSeed,
    staticDir: config.staticDir || null,
    configPath: config.configPath || null
  }
}

function maskDatabaseUrl(url) {
  if (!url) return ''
  return url.replace(/:([^:@/]+)@/, ':***@')
}
