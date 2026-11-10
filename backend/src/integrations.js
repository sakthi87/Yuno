import { Router } from 'express'
import crypto from 'crypto'
import { requireAdminToken } from './middleware/auth.js'
import { requireSession, requireRole } from './sessionAuth.js'
import { getSettings, upsertSetting, run, queryAll, queryOne } from './store.js'
import { getYbaIntegration, testYbaConnection, syncFromYba } from './ybaSync.js'
import { stampProvenance } from './provenance.js'
import { recomputePlatformState } from './healthEngine.js'
import { config } from './config.js'

const router = Router()

function adminOrSession(req, res, next) {
  // Prefer session; allow ADMIN_API_TOKEN for automation
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (config.adminApiToken && token === config.adminApiToken) {
    req.user = { role: 'admin', sub: 'admin-token' }
    return next()
  }
  return requireSession(req, res, () => requireRole('admin', 'dba')(req, res, next))
}

router.use(adminOrSession)

router.get('/integrations', async (_req, res) => {
  const settings = await getSettings()
  const integrations = settings.integrations || {}
  res.json({
    yba: integrations.yba || { mode: 'mock', enabled: false },
    prometheus: integrations.prometheus || { mode: 'push', enabled: false },
    nessus: integrations.nessus || { mode: 'push', enabled: false },
    tanium: integrations.tanium || { mode: 'push', enabled: false },
    usage: integrations.usage || { mode: 'push', enabled: false },
    notifications: integrations.notifications || { enabled: false }
  })
})

router.put('/integrations/:id', async (req, res) => {
  const id = req.params.id
  const allowed = ['yba', 'prometheus', 'nessus', 'tanium', 'usage', 'notifications']
  if (!allowed.includes(id)) return res.status(400).json({ error: 'Unknown integration' })
  const settings = await getSettings()
  const integrations = { ...(settings.integrations || {}) }
  integrations[id] = {
    ...(integrations[id] || {}),
    ...req.body,
    updatedAt: new Date().toISOString()
  }
  await upsertSetting('integrations', integrations)
  res.json({ ok: true, id, integration: integrations[id] })
})

router.post('/integrations/yba/test', async (req, res) => {
  const settings = await getSettings()
  const integration = { ...(settings.integrations?.yba || {}), ...(req.body || {}) }
  const result = await testYbaConnection(integration)
  res.status(result.ok ? 200 : 400).json(result)
})

router.post('/integrations/yba/sync', async (req, res) => {
  try {
    const settings = await getSettings()
    const integration = { ...(settings.integrations?.yba || {}), ...(req.body || {}), enabled: true }
    await upsertSetting('integrations', { ...(settings.integrations || {}), yba: integration })
    const result = await syncFromYba(integration)
    const setup = { ...(settings.setup || {}), ybaConnected: true, step: 'agents', updatedAt: new Date().toISOString() }
    await upsertSetting('setup', setup)
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/setup', async (_req, res) => {
  const settings = await getSettings()
  res.json(settings.setup || { step: 'welcome', completed: false })
})

router.put('/setup', async (req, res) => {
  const settings = await getSettings()
  const setup = { ...(settings.setup || {}), ...req.body, updatedAt: new Date().toISOString() }
  await upsertSetting('setup', setup)
  res.json({ ok: true, setup })
})

router.post('/agents/enroll-token', async (req, res) => {
  const token = `enroll-${crypto.randomBytes(16).toString('hex')}`
  const settings = await getSettings()
  const enrollment = {
    token,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    universeId: req.body?.universeId || null
  }
  await upsertSetting('agentEnrollment', enrollment)
  const base = req.body?.publicUrl || config.collectorUrl || `http://localhost:${config.port}`
  res.status(201).json({
    ok: true,
    token,
    expiresAt: enrollment.expiresAt,
    installCommand: `curl -fsSL ${base}/api/v1/agents/install.sh | bash -s -- --url ${base} --token ${token}`
  })
})

router.get('/agents', async (_req, res) => {
  try {
    const rows = await queryAll('SELECT * FROM agents ORDER BY last_heartbeat DESC')
    const now = Date.now()
    const items = rows.map((r) => ({
      id: r.id,
      nodeId: r.node_id,
      universeId: r.universe_id,
      hostname: r.hostname,
      status: r.status,
      version: r.version,
      lastHeartbeat: r.last_heartbeat,
      hostMetrics: JSON.parse(r.host_metrics_json || '{}'),
      source: r.source,
      secondsAgo: r.last_heartbeat ? Math.round((now - new Date(r.last_heartbeat).getTime()) / 1000) : null,
      connected: r.last_heartbeat ? now - new Date(r.last_heartbeat).getTime() < 120000 : false
    }))
    res.json({
      items,
      summary: {
        total: items.length,
        connected: items.filter((i) => i.connected).length,
        degraded: items.filter((i) => !i.connected).length
      }
    })
  } catch (err) {
    res.json({ items: [], summary: { total: 0, connected: 0, degraded: 0 }, error: err.message })
  }
})

router.post('/agents/auto-enroll-commands', async (_req, res) => {
  const nodes = await queryAll('SELECT id, universe_id, name FROM nodes ORDER BY name')
  const settings = await getSettings()
  let enrollment = settings.agentEnrollment
  if (!enrollment?.token) {
    const token = `enroll-${crypto.randomBytes(16).toString('hex')}`
    enrollment = {
      token,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
    await upsertSetting('agentEnrollment', enrollment)
  }
  const base = config.collectorUrl || `http://localhost:${config.port}`
  res.json({
    token: enrollment.token,
    commands: nodes.map((n) => ({
      nodeId: n.id,
      universeId: n.universe_id,
      command: `curl -fsSL ${base}/api/v1/agents/install.sh | bash -s -- --url ${base} --token ${enrollment.token} --node-id ${n.id} --universe-id ${n.universe_id} --hostname ${n.name}`
    }))
  })
})

router.post('/platform/recompute', async (_req, res) => {
  const settings = await getSettings()
  const result = await recomputePlatformState(settings.finance)
  res.json({
    ok: true,
    globalKpis: result.globalKpis,
    insightCount: result.insights.length,
    agentsConnected: result.agentsConnected
  })
})

router.post('/integrations/prometheus/sync', async (req, res) => {
  // Pull mode stub: accept optional metrics batch or generate from mock if mode=mock
  const settings = await getSettings()
  const integration = { ...(settings.integrations?.prometheus || {}), ...(req.body || {}) }
  const provenance = stampProvenance('prometheus')
  if (integration.mode === 'mock' || !integration.url) {
    const universes = await queryAll('SELECT id FROM universes')
    for (const u of universes) {
      const existing = await queryOne('SELECT metrics_json FROM universe_metrics WHERE universe_id = ?', [u.id])
      const metrics = existing ? JSON.parse(existing.metrics_json) : {
        readOpsPerSec: 1000,
        writeOpsPerSec: 500,
        avgReadLatencyMs: 2,
        avgWriteLatencyMs: 4,
        cpuAvgPct: 40,
        memoryAvgPct: 50,
        diskUsedPct: 45,
        replicationLagMs: 20
      }
      await run(
        `INSERT INTO universe_metrics (universe_id, metrics_json, source, collected_at) VALUES (?, ?, ?, ?)
         ON CONFLICT (universe_id) DO UPDATE SET metrics_json = EXCLUDED.metrics_json, source = EXCLUDED.source, collected_at = EXCLUDED.collected_at`,
        [u.id, JSON.stringify({ ...metrics, ...provenance }), provenance.source, provenance.collectedAt]
      )
    }
  }
  await recomputePlatformState(settings.finance)
  const integrations = { ...(settings.integrations || {}), prometheus: { ...integration, lastSync: { at: provenance.collectedAt, ok: true } } }
  await upsertSetting('integrations', integrations)
  res.json({ ok: true, source: provenance.source, syncedAt: provenance.collectedAt })
})

router.post('/integrations/nessus/sync', async (req, res) => {
  const settings = await getSettings()
  const integration = { ...(settings.integrations?.nessus || {}), ...(req.body || {}) }
  const provenance = stampProvenance('nessus')
  if (integration.mode === 'mock' || Array.isArray(req.body?.items)) {
    const items = req.body?.items || [
      {
        id: 'vuln-nessus-mock-1',
        cveId: 'CVE-2024-NESSUS',
        severity: 'CRITICAL',
        status: 'OPEN',
        title: 'Mock Nessus finding',
        universeId: (await queryOne('SELECT id FROM universes LIMIT 1'))?.id,
        ...provenance
      }
    ]
    for (const item of items) {
      await run(
        `INSERT INTO vulnerabilities (id, payload_json) VALUES (?, ?)
         ON CONFLICT (id) DO UPDATE SET payload_json = EXCLUDED.payload_json`,
        [item.id, JSON.stringify({ ...item, ...provenance })]
      )
    }
  }
  await recomputePlatformState(settings.finance)
  await upsertSetting('integrations', {
    ...(settings.integrations || {}),
    nessus: { ...integration, enabled: true, lastSync: { at: provenance.collectedAt, ok: true } }
  })
  res.json({ ok: true, source: provenance.source, syncedAt: provenance.collectedAt })
})

router.post('/integrations/tanium/sync', async (req, res) => {
  const settings = await getSettings()
  const integration = { ...(settings.integrations?.tanium || {}), ...(req.body || {}) }
  const provenance = stampProvenance('tanium')
  const items = req.body?.items || [
    {
      id: 'patch-tanium-mock-1',
      name: 'Mock OS patch roll',
      status: 'SCHEDULED',
      universeId: (await queryOne('SELECT id FROM universes LIMIT 1'))?.id,
      ...provenance
    }
  ]
  for (const item of items) {
    await run(
      `INSERT INTO patch_jobs (id, payload_json) VALUES (?, ?)
       ON CONFLICT (id) DO UPDATE SET payload_json = EXCLUDED.payload_json`,
      [item.id, JSON.stringify({ ...item, ...provenance })]
    )
  }
  await upsertSetting('integrations', {
    ...(settings.integrations || {}),
    tanium: { ...integration, enabled: true, lastSync: { at: provenance.collectedAt, ok: true } }
  })
  res.json({ ok: true, source: provenance.source, syncedAt: provenance.collectedAt, count: items.length })
})

router.post('/drift/reconcile', async (_req, res) => {
  const settings = await getSettings()
  const rows = await queryAll('SELECT payload_json FROM drift_items')
  const open = rows
    .map((r) => JSON.parse(r.payload_json))
    .filter((d) => d.status !== 'RESOLVED')
  for (const d of open.slice(0, 3)) {
    const updated = {
      ...d,
      status: 'RESOLVED',
      reconciledAt: new Date().toISOString(),
      source: 'drift-reconciler'
    }
    await run(
      `INSERT INTO drift_items (id, payload_json) VALUES (?, ?)
       ON CONFLICT (id) DO UPDATE SET payload_json = EXCLUDED.payload_json`,
      [updated.id, JSON.stringify(updated)]
    )
  }
  await recomputePlatformState(settings.finance)
  res.json({ ok: true, reconciled: Math.min(3, open.length), remaining: Math.max(0, open.length - 3) })
})

router.post('/notifications/test', async (req, res) => {
  const settings = await getSettings()
  const notifications = {
    ...(settings.integrations?.notifications || {}),
    ...(req.body || {}),
    lastTestAt: new Date().toISOString(),
    lastTestStatus: 'ok',
    message: 'Notification channel configured (delivery simulated in demo)'
  }
  await upsertSetting('integrations', {
    ...(settings.integrations || {}),
    notifications
  })
  res.json({ ok: true, notifications })
})

export default router
