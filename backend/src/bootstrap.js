import { queryAll, queryOne, upsertConfig, upsertSetting } from './store.js'
import { buildFinancePayload } from './financeEngine.js'
import { DEFAULT_FINANCE_POLICY, mergeFinancePolicy } from './financePolicy.js'

const EMPTY_KPIS = {
  totalUniverses: 0,
  totalNodes: 0,
  healthy: 0,
  warning: 0,
  critical: 0,
  agentsConnected: 0,
  certsExpiring30d: 0
}

const DEFAULT_CLOUDS = ['AWS', 'Azure']
const DEFAULT_ENVIRONMENTS = ['DEV', 'IT', 'UAT', 'PROD']
const DEFAULT_STATUS = {
  HEALTHY: 'HEALTHY',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL'
}

async function getConfig(key, fallback) {
  const row = await queryOne('SELECT value_json FROM app_config WHERE key = ?', [key])
  if (!row) return fallback
  return JSON.parse(row.value_json)
}

function parseUniverse(row) {
  return {
    id: row.id,
    name: row.name,
    cloud: row.cloud,
    environment: row.environment,
    region: row.region,
    ybVersion: row.yb_version,
    owner: row.owner,
    status: row.status,
    health: JSON.parse(row.health_json || '{}'),
    issues: JSON.parse(row.issues_json || '[]'),
    nodes: JSON.parse(row.node_names_json || '[]'),
    source: row.source || null,
    collectedAt: row.collected_at || null
  }
}

function parseNode(row) {
  return {
    id: row.id,
    name: row.name,
    privateIp: row.private_ip,
    publicIp: row.public_ip,
    az: row.az,
    role: row.role,
    status: row.status,
    vm: JSON.parse(row.vm_json || '{}'),
    components: JSON.parse(row.components_json || '[]'),
    source: row.source || null,
    collectedAt: row.collected_at || null,
    lastHeartbeat: row.last_heartbeat || null
  }
}

async function parsePayloadRows(table) {
  const rows = await queryAll(`SELECT payload_json FROM ${table}`)
  return rows.map((r) => JSON.parse(r.payload_json))
}

async function getFinancePolicy() {
  const row = await queryOne('SELECT value_json FROM platform_settings WHERE key = ?', ['finance'])
  if (!row) return mergeFinancePolicy(DEFAULT_FINANCE_POLICY)
  return mergeFinancePolicy(JSON.parse(row.value_json))
}

async function queryConsumerUsage() {
  const rows = await queryAll('SELECT * FROM consumer_usage ORDER BY universe_id, database_name')
  return rows.map((row) => ({
    id: row.id,
    universeId: row.universe_id,
    database: row.database_name,
    consumer: row.consumer || row.database_name,
    owner: row.owner || '',
    rawUsagePct: Number(row.raw_usage_pct || 0),
    usage: JSON.parse(row.usage_json || '{}'),
    trendPct: row.trend_pct != null ? Number(row.trend_pct) : null,
    updatedAt: row.updated_at
  }))
}

export async function buildBootstrapPayload() {
  const universes = (await queryAll('SELECT * FROM universes ORDER BY name')).map(parseUniverse)

  const nodeRows = await queryAll('SELECT * FROM nodes')
  const nodesByUniverse = {}
  for (const row of nodeRows) {
    const node = parseNode(row)
    if (!nodesByUniverse[row.universe_id]) nodesByUniverse[row.universe_id] = []
    nodesByUniverse[row.universe_id].push(node)
  }

  const universeMetrics = {}
  for (const row of await queryAll('SELECT * FROM universe_metrics')) {
    universeMetrics[row.universe_id] = JSON.parse(row.metrics_json)
  }

  const infrastructure = (await queryAll('SELECT payload_json FROM infrastructure'))
    .map((r) => JSON.parse(r.payload_json))

  const financePolicy = await getFinancePolicy()
  const consumerRows = await queryConsumerUsage()
  const finance = buildFinancePayload({
    universes,
    nodesByUniverse,
    universeMetrics,
    consumerRows,
    policy: financePolicy
  })

  let agents = []
  try {
    agents = await queryAll('SELECT * FROM agents ORDER BY last_heartbeat DESC')
  } catch {
    agents = []
  }
  const now = Date.now()
  const agentFleet = agents.map((a) => ({
    id: a.id,
    nodeId: a.node_id,
    universeId: a.universe_id,
    hostname: a.hostname,
    status: a.status,
    version: a.version,
    lastHeartbeat: a.last_heartbeat,
    hostMetrics: JSON.parse(a.host_metrics_json || '{}'),
    source: a.source,
    secondsAgo: a.last_heartbeat ? Math.round((now - new Date(a.last_heartbeat).getTime()) / 1000) : null,
    connected: a.last_heartbeat ? now - new Date(a.last_heartbeat).getTime() < 120000 : false
  }))

  const settingsRow = await queryOne('SELECT value_json FROM platform_settings WHERE key = ?', ['setup'])
  const integrationsRow = await queryOne('SELECT value_json FROM platform_settings WHERE key = ?', ['integrations'])

  return {
    companyName: await getConfig('companyName', null),
    clouds: await getConfig('clouds', DEFAULT_CLOUDS),
    environments: await getConfig('environments', DEFAULT_ENVIRONMENTS),
    globalOverview: await getConfig('globalOverview', []),
    globalKpis: await getConfig('globalKpis', EMPTY_KPIS),
    criticalIssues: await getConfig('criticalIssues', []),
    insights: await getConfig('insights', []),
    universeOutcomes: await getConfig('universeOutcomes', {}),
    universes,
    nodesByUniverse,
    universeMetrics,
    infrastructure,
    alerts: await parsePayloadRows('alerts'),
    driftItems: await parsePayloadRows('drift_items'),
    vulnerabilities: await parsePayloadRows('vulnerabilities'),
    patchJobs: await parsePayloadRows('patch_jobs'),
    certificates: await parsePayloadRows('certificates'),
    auditLog: (await queryAll('SELECT payload_json FROM audit_log ORDER BY sort_time DESC'))
      .map((r) => JSON.parse(r.payload_json)),
    platformHealth: (await queryAll('SELECT payload_json FROM platform_health'))
      .map((r) => JSON.parse(r.payload_json)),
    agentFleet,
    agentSummary: {
      total: agentFleet.length,
      connected: agentFleet.filter((a) => a.connected).length
    },
    setup: settingsRow ? JSON.parse(settingsRow.value_json) : { step: 'welcome', completed: false },
    integrations: integrationsRow ? JSON.parse(integrationsRow.value_json) : {},
    vmAgentDefinitions: await getConfig('vmAgentDefinitions', []),
    provisionSteps: await getConfig('provisionSteps', []),
    ybVersions: await getConfig('ybVersions', []),
    vmSizes: await getConfig('vmSizes', []),
    regions: await getConfig('regions', []),
    vulnStatus: await getConfig('vulnStatus', {}),
    patchStatus: await getConfig('patchStatus', {}),
    status: await getConfig('status', DEFAULT_STATUS),
    financePolicy: finance.financePolicy,
    universeCosts: finance.universeCosts,
    consumerCosts: finance.consumerCosts,
    financeKpis: finance.financeKpis,
    links: {
      ybaUrlTemplate: (await getConfig('ybaUrlTemplate', null)) || null,
      grafanaUrlTemplate: (await getConfig('grafanaUrlTemplate', null)) || null
    }
  }
}

export async function ensureEmptyDefaults(companyName) {
  await upsertConfig('companyName', companyName)
  await upsertConfig('clouds', DEFAULT_CLOUDS)
  await upsertConfig('environments', DEFAULT_ENVIRONMENTS)
  await upsertConfig('globalOverview', [])
  await upsertConfig('globalKpis', EMPTY_KPIS)
  await upsertConfig('criticalIssues', [])
  await upsertConfig('status', DEFAULT_STATUS)
  await upsertConfig('vulnStatus', {
    OPEN: 'OPEN',
    SCHEDULED: 'SCHEDULED',
    IN_PROGRESS: 'IN_PROGRESS',
    REMEDIATED: 'REMEDIATED'
  })
  await upsertConfig('patchStatus', {
    SCHEDULED: 'SCHEDULED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
  })
  await upsertSetting('finance', {
    ...DEFAULT_FINANCE_POLICY,
    configuredVia: 'install',
    updatedAt: new Date().toISOString()
  })
}

export async function queryUniverses(cloud, environment) {
  let sql = 'SELECT * FROM universes WHERE 1=1'
  const params = []
  if (cloud) {
    sql += ' AND cloud = ?'
    params.push(cloud)
  }
  if (environment) {
    sql += ' AND environment = ?'
    params.push(environment)
  }
  sql += ' ORDER BY name'
  return (await queryAll(sql, params)).map(parseUniverse)
}

function filterPayloadRows(rows, filters) {
  return rows.filter((item) => {
    if (filters.cloud && item.cloud !== filters.cloud) return false
    if (filters.environment && item.environment !== filters.environment) return false
    if (filters.severity && item.severity !== filters.severity) return false
    if (filters.status && item.status !== filters.status) return false
    if (filters.agentStatus && item.agentStatus !== filters.agentStatus) return false
    return true
  })
}

export async function queryVulnerabilities(cloud, environment, severity, status) {
  const rows = await parsePayloadRows('vulnerabilities')
  return filterPayloadRows(rows, { cloud, environment, severity, status })
}

export async function queryPatchJobs(cloud, environment, status) {
  const rows = await parsePayloadRows('patch_jobs')
  return filterPayloadRows(rows, { cloud, environment, status })
}

export async function queryInfrastructure(cloud, environment, agentStatus) {
  const rows = (await queryAll('SELECT payload_json FROM infrastructure'))
    .map((r) => JSON.parse(r.payload_json))
  return filterPayloadRows(rows, { cloud, environment, agentStatus })
}

export async function getOverviewConfig(key, fallback) {
  return getConfig(key, fallback)
}
