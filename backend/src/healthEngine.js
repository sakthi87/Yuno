/**
 * Deterministic health + insight engines for Wave 1/2.
 */
import { queryAll, upsertConfig } from './store.js'
import { buildFinancePayload } from './financeEngine.js'
import { mergeFinancePolicy } from './financePolicy.js'

const METRIC_THRESHOLDS = {
  avgReadLatencyMs: { warn: 5, crit: 15 },
  avgWriteLatencyMs: { warn: 10, crit: 30 },
  cpuAvgPct: { warn: 75, crit: 90 },
  memoryAvgPct: { warn: 80, crit: 92 },
  diskUsedPct: { warn: 75, crit: 90 },
  replicationLagMs: { warn: 100, crit: 500 },
  tabletsUnhealthy: { warn: 1, crit: 5 },
  underReplicated: { warn: 1, crit: 10 },
  leaderlessTablets: { warn: 1, crit: 1 }
}

function worst(...statuses) {
  if (statuses.includes('CRITICAL')) return 'CRITICAL'
  if (statuses.includes('WARNING')) return 'WARNING'
  return 'HEALTHY'
}

function metricStatus(key, value) {
  const t = METRIC_THRESHOLDS[key]
  if (!t || value == null) return 'HEALTHY'
  if (value >= t.crit) return 'CRITICAL'
  if (value >= t.warn) return 'WARNING'
  return 'HEALTHY'
}

function parseJson(text, fallback) {
  try {
    return JSON.parse(text || 'null') ?? fallback
  } catch {
    return fallback
  }
}

export async function loadEstateSnapshot() {
  const universes = (await queryAll('SELECT * FROM universes ORDER BY name')).map((row) => ({
    id: row.id,
    name: row.name,
    cloud: row.cloud,
    environment: row.environment,
    region: row.region,
    ybVersion: row.yb_version,
    owner: row.owner,
    status: row.status,
    health: parseJson(row.health_json, {}),
    issues: parseJson(row.issues_json, []),
    nodes: parseJson(row.node_names_json, []),
    source: row.source || null,
    collectedAt: row.collected_at || null
  }))

  const nodeRows = await queryAll('SELECT * FROM nodes')
  const nodesByUniverse = {}
  for (const row of nodeRows) {
    const node = {
      id: row.id,
      name: row.name,
      privateIp: row.private_ip,
      publicIp: row.public_ip,
      az: row.az,
      role: row.role,
      status: row.status,
      vm: parseJson(row.vm_json, {}),
      components: parseJson(row.components_json, []),
      source: row.source || null,
      collectedAt: row.collected_at || null,
      lastHeartbeat: row.last_heartbeat || null
    }
    if (!nodesByUniverse[row.universe_id]) nodesByUniverse[row.universe_id] = []
    nodesByUniverse[row.universe_id].push(node)
  }

  const universeMetrics = {}
  for (const row of await queryAll('SELECT * FROM universe_metrics')) {
    const metrics = parseJson(row.metrics_json, {})
    universeMetrics[row.universe_id] = {
      ...metrics,
      source: row.source || metrics.source || null,
      collectedAt: row.collected_at || metrics.collectedAt || null
    }
  }

  const certificates = (await queryAll('SELECT payload_json FROM certificates')).map((r) =>
    parseJson(r.payload_json, {})
  )
  const vulnerabilities = (await queryAll('SELECT payload_json FROM vulnerabilities')).map((r) =>
    parseJson(r.payload_json, {})
  )
  const alerts = (await queryAll('SELECT payload_json FROM alerts')).map((r) =>
    parseJson(r.payload_json, {})
  )
  let agentRows = []
  try {
    agentRows = await queryAll('SELECT * FROM agents ORDER BY last_heartbeat DESC')
  } catch {
    agentRows = []
  }

  return {
    universes,
    nodesByUniverse,
    universeMetrics,
    certificates,
    vulnerabilities,
    alerts,
    agents: agentRows
  }
}

export function evaluateUniverseHealth(universe, nodes, metrics, certificates, vulnerabilities) {
  const nodeStatuses = (nodes || []).map((n) => n.status || 'HEALTHY')
  const infra = worst(...(nodeStatuses.length ? nodeStatuses : ['HEALTHY']))

  const perfKeys = ['avgReadLatencyMs', 'avgWriteLatencyMs', 'replicationLagMs']
  const capKeys = ['cpuAvgPct', 'memoryAvgPct', 'diskUsedPct']
  const ybKeys = ['tabletsUnhealthy', 'underReplicated', 'leaderlessTablets']

  const performance = worst(...perfKeys.map((k) => metricStatus(k, metrics?.[k])))
  const capacity = worst(...capKeys.map((k) => metricStatus(k, metrics?.[k])))
  const yugabytedb = worst(...ybKeys.map((k) => metricStatus(k, metrics?.[k])), performance)

  const uniCerts = (certificates || []).filter(
    (c) => c.universe === universe.name || c.universeId === universe.id
  )
  const certStatus = uniCerts.some((c) => (c.daysRemaining ?? 999) < 15 || c.status === 'CRITICAL')
    ? 'CRITICAL'
    : uniCerts.some((c) => (c.daysRemaining ?? 999) < 30 || c.status === 'WARNING')
      ? 'WARNING'
      : 'HEALTHY'

  const uniVulns = (vulnerabilities || []).filter(
    (v) =>
      (v.universeId === universe.id || v.universe === universe.name) &&
      v.status !== 'REMEDIATED' &&
      v.severity === 'CRITICAL'
  )
  const security = uniVulns.length ? 'CRITICAL' : certStatus === 'CRITICAL' ? 'WARNING' : 'HEALTHY'

  const monitoring = metrics?.collectedAt
    ? Date.now() - new Date(metrics.collectedAt).getTime() > 15 * 60 * 1000
      ? 'WARNING'
      : 'HEALTHY'
    : 'WARNING'

  const health = {
    infrastructure: infra,
    yugabytedb,
    yba: universe.health?.yba || 'HEALTHY',
    security,
    certificates: certStatus,
    monitoring,
    backup: universe.health?.backup || 'HEALTHY',
    compliance: security === 'CRITICAL' ? 'WARNING' : 'HEALTHY',
    performance,
    capacity
  }

  const overall = worst(...Object.values(health))
  const issues = []
  if (certStatus !== 'HEALTHY') {
    const worstCert = uniCerts.sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999))[0]
    issues.push({
      severity: certStatus,
      message: worstCert
        ? `Certificate ${worstCert.type || 'TLS'} expires in ${worstCert.daysRemaining} days`
        : 'Certificate risk detected'
    })
  }
  if (uniVulns.length) {
    issues.push({
      severity: 'CRITICAL',
      message: `${uniVulns.length} open critical CVE(s)`
    })
  }
  for (const key of [...perfKeys, ...capKeys, ...ybKeys]) {
    const s = metricStatus(key, metrics?.[key])
    if (s !== 'HEALTHY') {
      issues.push({
        severity: s,
        message: `${key}=${metrics[key]} (${s.toLowerCase()})`
      })
    }
  }

  return { health, status: overall, issues, outcomes: {
    uptime: worst(infra, yugabytedb),
    performance,
    capacity,
    security: worst(security, certStatus),
    cost: 'HEALTHY'
  } }
}

export function buildInsights(estate, financeKpis = {}) {
  const insights = []
  const { universes, nodesByUniverse, universeMetrics, certificates, vulnerabilities } = estate

  for (const u of universes) {
    const nodes = nodesByUniverse[u.id] || []
    const metrics = universeMetrics[u.id] || {}
    const evaluated = evaluateUniverseHealth(u, nodes, metrics, certificates, vulnerabilities)

    if (evaluated.outcomes.capacity !== 'HEALTHY' && evaluated.outcomes.performance !== 'HEALTHY') {
      insights.push({
        id: `ins-cap-perf-${u.id}`,
        severity: 'CRITICAL',
        universeId: u.id,
        universeName: u.name,
        title: `${u.name} needs attention`,
        why: 'Elevated resource utilization and latency/replication signals on this universe.',
        impact: 'Capacity and performance risk for dependent applications.',
        whatToDo: 'Review node disk/CPU, tablet health, and replication lag; open universe detail.',
        evidence: evaluated.issues.slice(0, 4)
      })
    } else if (evaluated.outcomes.capacity !== 'HEALTHY') {
      insights.push({
        id: `ins-cap-${u.id}`,
        severity: evaluated.outcomes.capacity,
        universeId: u.id,
        universeName: u.name,
        title: `${u.name} capacity pressure`,
        why: evaluated.issues.find((i) => /disk|cpu|memory/i.test(i.message))?.message || 'Capacity thresholds exceeded.',
        impact: 'Risk of throttling or outage if growth continues.',
        whatToDo: 'Plan scale-out or free disk; check hottest nodes.',
        evidence: evaluated.issues.slice(0, 3)
      })
    }

    const cert = certificates
      .filter((c) => c.universe === u.name || c.universeId === u.id)
      .sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999))[0]
    if (cert && (cert.daysRemaining ?? 999) < 15) {
      insights.push({
        id: `ins-cert-${u.id}`,
        severity: 'CRITICAL',
        universeId: u.id,
        universeName: u.name,
        title: `${u.name} certificate expiring soon`,
        why: `${cert.type || 'TLS'} on ${cert.location || 'node'} expires in ${cert.daysRemaining} days.`,
        impact: 'Client and admin connectivity can fail when the cert expires.',
        whatToDo: 'Renew and roll the certificate before expiry; verify YBA TLS inventory.',
        evidence: [{ severity: 'CRITICAL', message: cert.id || cert.type }]
      })
    }

    const vulns = vulnerabilities.filter(
      (v) =>
        (v.universeId === u.id || v.universe === u.name) &&
        v.severity === 'CRITICAL' &&
        v.status !== 'REMEDIATED'
    )
    if (vulns.length) {
      insights.push({
        id: `ins-vuln-${u.id}`,
        severity: 'CRITICAL',
        universeId: u.id,
        universeName: u.name,
        title: `${u.name} has open critical vulnerabilities`,
        why: `${vulns.length} CRITICAL CVE(s) still open (e.g. ${vulns[0].cveId || vulns[0].id}).`,
        impact: 'Security and compliance exposure on database hosts.',
        whatToDo: 'Schedule patch job; track in Patching tab until remediated.',
        evidence: vulns.slice(0, 3).map((v) => ({ severity: 'CRITICAL', message: v.cveId || v.id }))
      })
    }

    const offline = nodes.filter((n) => n.status === 'CRITICAL' || (n.lastHeartbeat && Date.now() - new Date(n.lastHeartbeat).getTime() > 5 * 60 * 1000))
    if (offline.length) {
      insights.push({
        id: `ins-agent-${u.id}`,
        severity: 'WARNING',
        universeId: u.id,
        universeName: u.name,
        title: `${u.name} agent/node health gap`,
        why: `${offline.length} node(s) critical or missing recent heartbeat.`,
        impact: 'Incomplete observability; remediation may be delayed.',
        whatToDo: 'Check agent process and network path to the control plane.',
        evidence: offline.slice(0, 3).map((n) => ({ severity: 'WARNING', message: n.name || n.id }))
      })
    }
  }

  if ((financeKpis.avgUtilization ?? 100) < 40 && (financeKpis.idlePool ?? 0) > 0) {
    insights.push({
      id: 'ins-finops-idle',
      severity: 'WARNING',
      universeId: null,
      universeName: null,
      title: 'High idle / reserved spend',
      why: `Average utilization ${Number(financeKpis.avgUtilization).toFixed(1)}% with idle pool ~$${Number(financeKpis.idlePool).toLocaleString()}.`,
      impact: 'Paying for unused capacity across the estate.',
      whatToDo: 'Review chargeback and right-size DEV/UAT or reclaim idle pools.',
      evidence: []
    })
  }

  const rank = { CRITICAL: 0, WARNING: 1, HEALTHY: 2 }
  return insights.sort((a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9)).slice(0, 25)
}

export async function recomputePlatformState(financePolicy) {
  const estate = await loadEstateSnapshot()
  const { run } = await import('./store.js')

  for (const u of estate.universes) {
    const nodes = estate.nodesByUniverse[u.id] || []
    const metrics = estate.universeMetrics[u.id] || {}
    const evaluated = evaluateUniverseHealth(
      u,
      nodes,
      metrics,
      estate.certificates,
      estate.vulnerabilities
    )
    await run(
      `UPDATE universes SET status = ?, health_json = ?, issues_json = ? WHERE id = ?`,
      [evaluated.status, JSON.stringify(evaluated.health), JSON.stringify(evaluated.issues), u.id]
    )
    u.status = evaluated.status
    u.health = evaluated.health
    u.issues = evaluated.issues
    u.outcomes = evaluated.outcomes
  }

  const statusCount = { HEALTHY: 0, WARNING: 0, CRITICAL: 0 }
  for (const u of estate.universes) {
    statusCount[u.status] = (statusCount[u.status] || 0) + 1
  }
  const totalNodes = Object.values(estate.nodesByUniverse).reduce((s, n) => s + n.length, 0)
  const certsExpiring30d = estate.certificates.filter((c) => (c.daysRemaining ?? 999) <= 30).length
  const agentsConnected = estate.agents.filter((a) => {
    if (!a.last_heartbeat) return false
    return Date.now() - new Date(a.last_heartbeat).getTime() < 2 * 60 * 1000
  }).length

  const globalKpis = {
    totalUniverses: estate.universes.length,
    totalNodes,
    healthy: statusCount.HEALTHY || 0,
    warning: statusCount.WARNING || 0,
    critical: statusCount.CRITICAL || 0,
    agentsConnected,
    certsExpiring30d,
    source: 'computed',
    collectedAt: new Date().toISOString()
  }

  const clouds = [...new Set(estate.universes.map((u) => u.cloud))]
  const envs = [...new Set(estate.universes.map((u) => u.environment))]
  const globalOverview = []
  for (const cloud of clouds) {
    for (const env of envs) {
      const subset = estate.universes.filter((u) => u.cloud === cloud && u.environment === env)
      if (!subset.length) continue
      const nodes = subset.reduce((s, u) => s + (estate.nodesByUniverse[u.id]?.length || 0), 0)
      globalOverview.push({
        cloud,
        env,
        universes: subset.length,
        nodes,
        healthy: subset.filter((u) => u.status === 'HEALTHY').length,
        warning: subset.filter((u) => u.status === 'WARNING').length,
        critical: subset.filter((u) => u.status === 'CRITICAL').length
      })
    }
  }

  const finance = buildFinancePayload({
    universes: estate.universes,
    nodesByUniverse: estate.nodesByUniverse,
    universeMetrics: estate.universeMetrics,
    consumerRows: await loadConsumerRows(),
    policy: mergeFinancePolicy(financePolicy)
  })

  // Attach cost outcome hint
  for (const u of estate.universes) {
    const cost = finance.universeCosts.find((c) => c.universeId === u.id)
    if (cost && cost.utilizationPct != null && cost.utilizationPct < 35) {
      u.outcomes = { ...(u.outcomes || {}), cost: 'WARNING' }
    }
  }

  const insights = buildInsights(estate, finance.financeKpis)
  const criticalIssues = insights
    .filter((i) => i.severity === 'CRITICAL' || i.severity === 'WARNING')
    .slice(0, 12)
    .map((i) => ({
      severity: i.severity,
      universe: i.universeName,
      universeId: i.universeId,
      message: i.title,
      cloud: estate.universes.find((u) => u.id === i.universeId)?.cloud,
      env: estate.universes.find((u) => u.id === i.universeId)?.environment
    }))

  await upsertConfig('globalKpis', globalKpis)
  await upsertConfig('globalOverview', globalOverview)
  await upsertConfig('criticalIssues', criticalIssues)
  await upsertConfig('insights', insights)
  await upsertConfig('universeOutcomes', Object.fromEntries(
    estate.universes.map((u) => [u.id, u.outcomes || {}])
  ))

  return {
    globalKpis,
    globalOverview,
    criticalIssues,
    insights,
    finance,
    agentsConnected,
    universes: estate.universes
  }
}

async function loadConsumerRows() {
  try {
    const rows = await queryAll('SELECT * FROM consumer_usage ORDER BY universe_id, database_name')
    return rows.map((row) => ({
      id: row.id,
      universeId: row.universe_id,
      database: row.database_name,
      consumer: row.consumer,
      owner: row.owner,
      rawUsagePct: Number(row.raw_usage_pct || 0),
      usage: parseJson(row.usage_json, {}),
      trendPct: row.trend_pct != null ? Number(row.trend_pct) : null
    }))
  } catch {
    return []
  }
}
