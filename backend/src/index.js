import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config, getConfigSummary } from './config.js'
import {
  initStore,
  getDbLocation,
  getDriver,
  initSchema,
  countUniverses,
  upsertSetting,
  getSettings,
  queryAll
} from './store.js'
import { seedDatabase, ensureFinanceDemoData } from './seed.js'
import {
  buildBootstrapPayload,
  ensureEmptyDefaults,
  queryUniverses,
  queryVulnerabilities,
  queryPatchJobs,
  queryInfrastructure,
  getOverviewConfig
} from './bootstrap.js'
import ingestRouter from './ingest.js'
import adminRouter from './admin.js'
import integrationsRouter from './integrations.js'
import { requireAdminToken, securityHeaders } from './middleware/auth.js'
import {
  authenticateDemoUser,
  createSessionToken,
  requireSession,
  requireRole,
  extractBearer,
  verifySessionToken
} from './sessionAuth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use(securityHeaders)

function optionalSession(req, _res, next) {
  const token = extractBearer(req)
  const session = verifySessionToken(token)
  if (session) req.user = session
  next()
}

async function ensureReady() {
  await initStore()
  if (getDriver() === 'sqlite') {
    await initSchema()
  }

  const count = await countUniverses()
  if (count === 0) {
    if (config.autoSeed) {
      console.log('Empty database — running demo seed (AUTO_SEED=true)...')
      await seedDatabase()
    } else {
      console.log('Empty database — initializing production defaults (AUTO_SEED=false)...')
      await ensureEmptyDefaults(config.companyName)
      await upsertSetting('auth', {
        ldapEnabled: false,
        ssoEnabled: false,
        provider: null,
        configuredVia: 'install'
      })
      await upsertSetting('install', {
        companyName: config.companyName,
        collectorUrl: config.collectorUrl || null,
        awaitingAgents: true
      })
    }
  }

  await ensureFinanceDemoData()
}

function resolveStaticDir() {
  if (config.staticDir && fs.existsSync(config.staticDir)) return config.staticDir
  const candidates = [
    path.join(__dirname, '../../frontend/dist'),
    path.join(config.installRoot, 'ui'),
    path.join(__dirname, '../../yuno-install/ui/dist')
  ]
  return candidates.find((dir) => fs.existsSync(path.join(dir, 'index.html'))) || ''
}

app.get('/api/v1/health', async (_req, res) => {
  try {
    await countUniverses()
    res.json({
      status: 'ok',
      database: getDbLocation(),
      driver: getDriver(),
      companyName: config.companyName,
      authRequired: !config.authDisabled,
      demoMode: config.demoMode,
      config: getConfigSummary()
    })
  } catch (err) {
    res.status(503).json({ status: 'degraded', error: err.message })
  }
})

app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  const user = authenticateDemoUser(username, password)
  if (!user) return res.status(401).json({ error: 'Invalid username or password' })
  const token = createSessionToken(user)
  res.json({
    ok: true,
    token,
    user: { username: user.username, role: user.role, name: user.name }
  })
})

app.get('/api/v1/auth/me', optionalSession, (req, res) => {
  if (config.authDisabled) {
    return res.json({ authenticated: true, authDisabled: true, user: { username: 'local', role: 'admin', name: 'Local' } })
  }
  if (!req.user) return res.status(401).json({ authenticated: false, error: 'Login required' })
  res.json({
    authenticated: true,
    user: { username: req.user.sub, role: req.user.role, name: req.user.name }
  })
})

app.get('/api/v1/agents/install.sh', (_req, res) => {
  const scriptPath = path.join(__dirname, '../../agent/install.sh')
  if (!fs.existsSync(scriptPath)) {
    return res.status(404).type('text/plain').send('# install.sh not found\n')
  }
  res.type('text/plain').send(fs.readFileSync(scriptPath, 'utf8'))
})

app.get('/api/v1/bootstrap', requireSession, async (_req, res) => {
  res.json(await buildBootstrapPayload())
})

app.get('/api/v1/finance', requireSession, async (_req, res) => {
  const payload = await buildBootstrapPayload()
  res.json({
    financePolicy: payload.financePolicy,
    universeCosts: payload.universeCosts,
    consumerCosts: payload.consumerCosts,
    financeKpis: payload.financeKpis
  })
})

app.get('/api/v1/overview/kpis', requireSession, async (_req, res) => {
  res.json(await getOverviewConfig('globalKpis', {
    totalUniverses: 0,
    totalNodes: 0,
    healthy: 0,
    warning: 0,
    critical: 0,
    agentsConnected: 0,
    certsExpiring30d: 0
  }))
})

app.get('/api/v1/overview/matrix', requireSession, async (_req, res) => {
  res.json(await getOverviewConfig('globalOverview', []))
})

app.get('/api/v1/overview/issues', requireSession, async (_req, res) => {
  res.json(await getOverviewConfig('criticalIssues', []))
})

app.get('/api/v1/universes', requireSession, async (req, res) => {
  const { cloud, environment } = req.query
  res.json({ items: await queryUniverses(cloud, environment) })
})

app.get('/api/v1/vms', requireSession, async (req, res) => {
  const { cloud, environment, agentStatus } = req.query
  const items = await queryInfrastructure(cloud, environment, agentStatus)
  const all = await queryInfrastructure()
  const connected = all.filter((v) => v.agentStatus === 'CONNECTED').length
  res.json({
    items,
    summary: { total: all.length, connected, disconnected: all.length - connected }
  })
})

app.get('/api/v1/alerts', requireSession, async (_req, res) => {
  const rows = await queryAll('SELECT payload_json FROM alerts')
  res.json(rows.map((r) => JSON.parse(r.payload_json)))
})

app.get('/api/v1/drift', requireSession, async (_req, res) => {
  const rows = await queryAll('SELECT payload_json FROM drift_items')
  res.json(rows.map((r) => JSON.parse(r.payload_json)))
})

app.get('/api/v1/vulnerabilities', requireSession, async (req, res) => {
  const { cloud, environment, severity, status } = req.query
  const items = await queryVulnerabilities(cloud, environment, severity, status)
  const all = await queryVulnerabilities()
  const open = all.filter((v) => v.status === 'OPEN' || v.status === 'SCHEDULED').length
  const inProgress = all.filter((v) => v.status === 'IN_PROGRESS').length
  const remediated = all.filter((v) => v.status === 'REMEDIATED').length
  const critical = all.filter((v) => v.severity === 'CRITICAL' && v.status !== 'REMEDIATED').length
  res.json({
    items,
    summary: { total: all.length, open, inProgress, remediated, critical }
  })
})

app.get('/api/v1/patch-jobs', requireSession, async (req, res) => {
  const { cloud, environment, status } = req.query
  const items = await queryPatchJobs(cloud, environment, status)
  const all = await queryPatchJobs()
  res.json({
    items,
    summary: {
      total: all.length,
      scheduled: all.filter((p) => p.status === 'SCHEDULED').length,
      inProgress: all.filter((p) => p.status === 'IN_PROGRESS').length,
      completed: all.filter((p) => p.status === 'COMPLETED').length,
      failed: all.filter((p) => p.status === 'FAILED').length
    }
  })
})

app.get('/api/v1/certificates', requireSession, async (_req, res) => {
  const rows = await queryAll('SELECT payload_json FROM certificates')
  res.json(rows.map((r) => JSON.parse(r.payload_json)))
})

app.get('/api/v1/audit', requireSession, requireRole('admin', 'dba', 'security'), async (_req, res) => {
  const rows = await queryAll('SELECT payload_json FROM audit_log ORDER BY sort_time DESC')
  res.json(rows.map((r) => JSON.parse(r.payload_json)))
})

app.get('/api/v1/platform/health', requireSession, async (_req, res) => {
  const rows = await queryAll('SELECT payload_json FROM platform_health')
  res.json(rows.map((r) => JSON.parse(r.payload_json)))
})

app.use('/api/v1/ingest', ingestRouter)
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1', integrationsRouter)

app.get('/api/v1/settings', requireSession, async (_req, res) => {
  res.json(await getSettings())
})

app.put('/api/v1/settings/:key', requireAdminToken, async (req, res) => {
  const { key } = req.params
  if (key === 'auth') {
    return res.status(400).json({
      error: 'Use PUT /api/v1/admin/settings/auth for LDAP/SSO configuration'
    })
  }
  if (!['auth', 'ldap', 'sso', 'notifications'].includes(key)) {
    return res.status(400).json({ error: 'Setting key not allowed via API yet' })
  }
  await upsertSetting(key, req.body)
  res.json({ ok: true, key, value: req.body })
})

app.post('/api/v1/admin/reseed', requireAdminToken, async (_req, res) => {
  if (config.autoSeed !== true && process.env.ALLOW_RESEED !== 'true') {
    return res.status(403).json({ error: 'Reseed disabled in production. Set ALLOW_RESEED=true to override.' })
  }
  await seedDatabase()
  res.json({ ok: true, message: 'Database reseeded from demo data' })
})

const staticDir = resolveStaticDir()
if (staticDir) {
  app.use(express.static(staticDir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(staticDir, 'index.html'))
  })
}

await ensureReady()

app.listen(config.port, config.host, () => {
  console.log(`Yugabyte Platform API listening on http://${config.host}:${config.port}`)
  console.log(`  Bootstrap: http://${config.host}:${config.port}/api/v1/bootstrap`)
  console.log(`  Database:  ${getDriver()} @ ${getDbLocation()}`)
  if (staticDir) console.log(`  UI:        ${staticDir}`)
})
