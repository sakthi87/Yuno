import { Router } from 'express'
import { requireAgentToken } from './middleware/auth.js'
import { run, queryOne } from './store.js'

const router = Router()
router.use((req, res, next) => {
  Promise.resolve(requireAgentToken(req, res, next)).catch(next)
})

async function writeAudit(action, resourceType, resourceId, actor = 'agent') {
  const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const entry = {
    id,
    time: new Date().toISOString(),
    actor,
    action,
    resourceType,
    resourceId,
    detail: `${action} ${resourceType} ${resourceId}`
  }
  await run(
    'INSERT INTO audit_log (id, payload_json, sort_time) VALUES (?, ?, ?)',
    [id, JSON.stringify(entry), entry.time]
  )
}

router.post('/heartbeat', async (req, res) => {
  const { universeId, node, agent } = req.body || {}
  if (!universeId || !node?.id) {
    return res.status(400).json({ error: 'universeId and node.id are required' })
  }

  const existingUniverse = await queryOne('SELECT id FROM universes WHERE id = ?', [universeId])
  if (!existingUniverse) {
    return res.status(404).json({ error: `Unknown universe: ${universeId}` })
  }

  const collectedAt = new Date().toISOString()
  await run(
    `INSERT INTO nodes (id, universe_id, name, private_ip, public_ip, az, role, status, vm_json, components_json, source, collected_at, last_heartbeat)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       universe_id = EXCLUDED.universe_id,
       name = EXCLUDED.name,
       private_ip = EXCLUDED.private_ip,
       public_ip = EXCLUDED.public_ip,
       az = EXCLUDED.az,
       role = EXCLUDED.role,
       status = EXCLUDED.status,
       vm_json = EXCLUDED.vm_json,
       components_json = EXCLUDED.components_json,
       source = EXCLUDED.source,
       collected_at = EXCLUDED.collected_at,
       last_heartbeat = EXCLUDED.last_heartbeat`,
    [
      node.id,
      universeId,
      node.name || node.id,
      node.privateIp || null,
      node.publicIp || null,
      node.az || null,
      node.role || 'FOLLOWER',
      node.status || 'HEALTHY',
      JSON.stringify(node.vm || {}),
      JSON.stringify(node.components || []),
      'agent',
      collectedAt,
      collectedAt
    ]
  )

  const agentId = agent?.id || `agent-${node.id}`
  await run(
    `INSERT INTO agents (id, node_id, universe_id, hostname, status, version, last_heartbeat, host_metrics_json, source, enrolled_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       node_id = EXCLUDED.node_id,
       universe_id = EXCLUDED.universe_id,
       hostname = EXCLUDED.hostname,
       status = EXCLUDED.status,
       version = EXCLUDED.version,
       last_heartbeat = EXCLUDED.last_heartbeat,
       host_metrics_json = EXCLUDED.host_metrics_json,
       source = EXCLUDED.source`,
    [
      agentId,
      node.id,
      universeId,
      agent?.hostname || node.name || node.id,
      'CONNECTED',
      agent?.version || '1.0.0',
      collectedAt,
      JSON.stringify(agent?.hostMetrics || node.hostMetrics || {}),
      'agent',
      collectedAt
    ]
  )

  if (node.infrastructure) {
    const infra = { ...node.infrastructure, id: node.infrastructure.id || node.id, universeId, source: 'agent', collectedAt }
    await run(
      `INSERT INTO infrastructure (id, universe_id, payload_json) VALUES (?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET universe_id = EXCLUDED.universe_id, payload_json = EXCLUDED.payload_json`,
      [infra.id, universeId, JSON.stringify(infra)]
    )
  }

  if (Array.isArray(node.certificates)) {
    for (const cert of node.certificates) {
      if (!cert?.id) continue
      const payload = { ...cert, source: 'agent', collectedAt }
      await run(
        `INSERT INTO certificates (id, payload_json) VALUES (?, ?)
         ON CONFLICT (id) DO UPDATE SET payload_json = EXCLUDED.payload_json`,
        [cert.id, JSON.stringify(payload)]
      )
    }
  }

  await writeAudit('HEARTBEAT', 'NODE', node.id)
  res.json({ ok: true, nodeId: node.id, agentId, receivedAt: collectedAt, source: 'agent' })
})

router.post('/universes', async (req, res) => {
  const u = req.body
  if (!u?.id || !u?.name || !u?.cloud || !u?.environment) {
    return res.status(400).json({ error: 'id, name, cloud, environment are required' })
  }

  await run(
    `INSERT INTO universes (id, name, cloud, environment, region, yb_version, owner, status, health_json, issues_json, node_names_json, source, collected_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       cloud = EXCLUDED.cloud,
       environment = EXCLUDED.environment,
       region = EXCLUDED.region,
       yb_version = EXCLUDED.yb_version,
       owner = EXCLUDED.owner,
       status = EXCLUDED.status,
       health_json = EXCLUDED.health_json,
       issues_json = EXCLUDED.issues_json,
       node_names_json = EXCLUDED.node_names_json,
       source = EXCLUDED.source,
       collected_at = EXCLUDED.collected_at`,
    [
      u.id, u.name, u.cloud, u.environment, u.region || null, u.ybVersion || null,
      u.owner || null, u.status || 'HEALTHY',
      JSON.stringify(u.health || {}),
      JSON.stringify(u.issues || []),
      JSON.stringify(u.nodes || []),
      u.source || 'ingest',
      u.collectedAt || new Date().toISOString()
    ]
  )

  await writeAudit('UPSERT', 'UNIVERSE', u.id)
  res.status(201).json({ ok: true, id: u.id })
})

router.post('/nodes', async (req, res) => {
  const { universeId, node } = req.body || {}
  if (!universeId || !node?.id) {
    return res.status(400).json({ error: 'universeId and node.id are required' })
  }

  await run(
    `INSERT INTO nodes (id, universe_id, name, private_ip, public_ip, az, role, status, vm_json, components_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       universe_id = EXCLUDED.universe_id,
       name = EXCLUDED.name,
       private_ip = EXCLUDED.private_ip,
       public_ip = EXCLUDED.public_ip,
       az = EXCLUDED.az,
       role = EXCLUDED.role,
       status = EXCLUDED.status,
       vm_json = EXCLUDED.vm_json,
       components_json = EXCLUDED.components_json`,
    [
      node.id, universeId, node.name || node.id, node.privateIp || null, node.publicIp || null,
      node.az || null, node.role || 'FOLLOWER', node.status || 'HEALTHY',
      JSON.stringify(node.vm || {}), JSON.stringify(node.components || [])
    ]
  )

  await writeAudit('UPSERT', 'NODE', node.id)
  res.status(201).json({ ok: true, id: node.id })
})

router.post('/metrics', async (req, res) => {
  const { universeId, metrics } = req.body || {}
  if (!universeId || !metrics) {
    return res.status(400).json({ error: 'universeId and metrics are required' })
  }

  const collectedAt = new Date().toISOString()
  const payload = { ...metrics, source: metrics.source || 'ingest', collectedAt }
  await run(
    `INSERT INTO universe_metrics (universe_id, metrics_json, source, collected_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (universe_id) DO UPDATE SET metrics_json = EXCLUDED.metrics_json, source = EXCLUDED.source, collected_at = EXCLUDED.collected_at`,
    [universeId, JSON.stringify(payload), payload.source, collectedAt]
  )

  await writeAudit('UPSERT', 'UNIVERSE_METRICS', universeId)
  res.status(201).json({ ok: true, universeId, source: payload.source, collectedAt })
})

/**
 * Phase 3 — database-level consumer usage for finance chargeback (Model B).
 * Accepts a single consumer or { universeId, consumers: [...] } batch.
 */
router.post('/consumer-usage', async (req, res) => {
  const body = req.body || {}
  const universeId = body.universeId
  if (!universeId) {
    return res.status(400).json({ error: 'universeId is required' })
  }

  const existingUniverse = await queryOne('SELECT id FROM universes WHERE id = ?', [universeId])
  if (!existingUniverse) {
    return res.status(404).json({ error: `Unknown universe: ${universeId}` })
  }

  const items = Array.isArray(body.consumers)
    ? body.consumers
    : body.database
      ? [body]
      : []

  if (!items.length) {
    return res.status(400).json({
      error: 'Provide database + rawUsagePct, or consumers[] array'
    })
  }

  const ids = []
  for (const item of items) {
    if (!item.database) {
      return res.status(400).json({ error: 'Each consumer requires database name' })
    }
    const id = item.id || `${universeId}:${item.database}`
    await run(
      `INSERT INTO consumer_usage (id, universe_id, database_name, consumer, owner, raw_usage_pct, usage_json, trend_pct, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (universe_id, database_name) DO UPDATE SET
         consumer = EXCLUDED.consumer,
         owner = EXCLUDED.owner,
         raw_usage_pct = EXCLUDED.raw_usage_pct,
         usage_json = EXCLUDED.usage_json,
         trend_pct = EXCLUDED.trend_pct,
         updated_at = EXCLUDED.updated_at`,
      [
        id,
        universeId,
        item.database,
        item.consumer || item.database,
        item.owner || null,
        Number(item.rawUsagePct ?? item.raw_usage_pct ?? 0),
        JSON.stringify(item.usage || {}),
        item.trendPct ?? item.trend_pct ?? null,
        new Date().toISOString()
      ]
    )
    ids.push(id)
  }

  await writeAudit('UPSERT', 'CONSUMER_USAGE', `${universeId}:${ids.length}`)
  res.status(201).json({ ok: true, universeId, count: ids.length, ids })
})

router.delete('/consumer-usage/:universeId/:database', async (req, res) => {
  const { universeId, database } = req.params
  await run('DELETE FROM consumer_usage WHERE universe_id = ? AND database_name = ?', [universeId, database])
  await writeAudit('DELETE', 'CONSUMER_USAGE', `${universeId}:${database}`)
  res.json({ ok: true, universeId, database })
})

router.post('/infrastructure', async (req, res) => {
  const vm = req.body
  if (!vm?.id) return res.status(400).json({ error: 'id is required' })

  await run(
    `INSERT INTO infrastructure (id, universe_id, payload_json) VALUES (?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET universe_id = EXCLUDED.universe_id, payload_json = EXCLUDED.payload_json`,
    [vm.id, vm.universeId || null, JSON.stringify(vm)]
  )

  await writeAudit('UPSERT', 'VM', vm.id)
  res.status(201).json({ ok: true, id: vm.id })
})

async function upsertPayloadTable(table, item, idKey = 'id') {
  if (!item?.[idKey]) throw new Error(`${idKey} is required`)
  const payload = {
    ...item,
    source: item.source || 'ingest',
    collectedAt: item.collectedAt || new Date().toISOString()
  }
  await run(
    `INSERT INTO ${table} (id, payload_json) VALUES (?, ?)
     ON CONFLICT (id) DO UPDATE SET payload_json = EXCLUDED.payload_json`,
    [payload[idKey], JSON.stringify(payload)]
  )
  return payload[idKey]
}

router.post('/alerts', async (req, res) => {
  try {
    const id = await upsertPayloadTable('alerts', req.body)
    await writeAudit('UPSERT', 'ALERT', id)
    res.status(201).json({ ok: true, id })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/drift', async (req, res) => {
  try {
    const id = await upsertPayloadTable('drift_items', req.body)
    await writeAudit('UPSERT', 'DRIFT', id)
    res.status(201).json({ ok: true, id })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/vulnerabilities', async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [req.body]
  const ids = []
  for (const item of items) {
    ids.push(await upsertPayloadTable('vulnerabilities', item))
  }
  await writeAudit('BULK_UPSERT', 'VULNERABILITY', ids.join(','))
  res.status(201).json({ ok: true, count: ids.length, ids })
})

router.post('/patch-jobs', async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [req.body]
  const ids = []
  for (const item of items) {
    ids.push(await upsertPayloadTable('patch_jobs', item))
  }
  await writeAudit('BULK_UPSERT', 'PATCH_JOB', ids.join(','))
  res.status(201).json({ ok: true, count: ids.length, ids })
})

router.post('/certificates', async (req, res) => {
  try {
    const id = await upsertPayloadTable('certificates', req.body)
    await writeAudit('UPSERT', 'CERTIFICATE', id)
    res.status(201).json({ ok: true, id })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/alerts/:id', async (req, res) => {
  await run('DELETE FROM alerts WHERE id = ?', [req.params.id])
  await writeAudit('DELETE', 'ALERT', req.params.id)
  res.json({ ok: true, id: req.params.id })
})

export default router
