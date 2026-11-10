/**
 * Platform data layer — loads from API (SQLite backend) or falls back to mock demoData.
 */
import { apiFetch, getSessionToken } from './authService'
import * as mock from './demoData'
import {
  buildFinancePayload,
  computeUniverseAllocation as engineComputeAllocation,
  enrichUniverseCost as engineEnrichUniverseCost,
  summarizeFinance as engineSummarizeFinance
} from './financeEngine'
import { DEFAULT_FINANCE_POLICY } from './financePolicy'

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export let STATUS = mock.STATUS
export let CLOUDS = mock.CLOUDS
export let ENVIRONMENTS = mock.ENVIRONMENTS
export let GLOBAL_OVERVIEW = mock.GLOBAL_OVERVIEW
export let GLOBAL_KPIS = mock.GLOBAL_KPIS
export let UNIVERSES = mock.UNIVERSES
export let UNIVERSE_METRICS = mock.UNIVERSE_METRICS
export let VM_AGENT_DEFINITIONS = mock.VM_AGENT_DEFINITIONS
export let INFRASTRUCTURE = mock.INFRASTRUCTURE
export let CERTIFICATES = mock.CERTIFICATES
export let ALERTS = mock.ALERTS
export let DRIFT_ITEMS = mock.DRIFT_ITEMS
export let VULNERABILITIES = mock.VULNERABILITIES
export let PATCH_JOBS = mock.PATCH_JOBS
export let VULN_STATUS = mock.VULN_STATUS
export let PATCH_STATUS = mock.PATCH_STATUS
export let AUDIT_LOG = mock.AUDIT_LOG
export let PLATFORM_HEALTH = mock.PLATFORM_HEALTH
export let CRITICAL_ISSUES = mock.CRITICAL_ISSUES
export let INSIGHTS = []
export let AGENT_FLEET = []
export let AGENT_SUMMARY = { total: 0, connected: 0 }
export let SETUP_STATE = { step: 'welcome', completed: false }
export let INTEGRATIONS = {}
export let UNIVERSE_OUTCOMES = {}
export let PLATFORM_LINKS = {}
export let PROVISION_STEPS = mock.PROVISION_STEPS
export let YB_VERSIONS = mock.YB_VERSIONS
export let VM_SIZES = mock.VM_SIZES
export let REGIONS = mock.REGIONS
export let FINANCE_POLICY = DEFAULT_FINANCE_POLICY
export let UNIVERSE_COSTS = mock.UNIVERSE_COSTS
export let CONSUMER_COSTS = mock.CONSUMER_COSTS
export let FINANCE_KPIS = mock.FINANCE_KPIS

const METRIC_THRESHOLDS = {
  avgReadLatencyMs: { warn: 5, crit: 15 },
  avgWriteLatencyMs: { warn: 10, crit: 30 },
  activeConnections: { warn: 600, crit: 850 },
  tabletsUnhealthy: { warn: 1, crit: 5 },
  underReplicated: { warn: 1, crit: 10 },
  leaderlessTablets: { warn: 1, crit: 1 },
  cpuAvgPct: { warn: 75, crit: 90 },
  memoryAvgPct: { warn: 80, crit: 92 },
  diskUsedPct: { warn: 75, crit: 90 },
  replicationLagMs: { warn: 100, crit: 500 }
}

const EMPTY_METRICS = {
  readOpsPerSec: 0,
  writeOpsPerSec: 0,
  avgReadLatencyMs: 0,
  avgWriteLatencyMs: 0,
  activeConnections: 0,
  tabletsTotal: 0,
  tabletsUnhealthy: 0,
  underReplicated: 0,
  leaderlessTablets: 0,
  cpuAvgPct: 0,
  memoryAvgPct: 0,
  diskUsedPct: 0,
  replicationLagMs: 0
}

let NODES = { ...mock.NODES }
let dataSource = 'mock'

export function getDataSource() {
  return dataSource
}

function getEffectiveConsumerCosts() {
  if (CONSUMER_COSTS?.length && CONSUMER_COSTS.some((c) => c.rawUsagePct != null)) {
    return CONSUMER_COSTS
  }
  return mock.CONSUMER_COSTS
}

function buildNodesByUniverse() {
  const nodesByUniverse = {}
  for (const u of UNIVERSES) {
    nodesByUniverse[u.id] = NODES[u.id] || mock.getNodesForUniverse(u.id)
  }
  return nodesByUniverse
}

function applyFinancePayload(finance) {
  FINANCE_POLICY = finance.financePolicy
  UNIVERSE_COSTS = finance.universeCosts
  CONSUMER_COSTS = finance.consumerCosts
  FINANCE_KPIS = finance.financeKpis
}

function computeLocalFinance(policy = FINANCE_POLICY) {
  return buildFinancePayload({
    universes: UNIVERSES,
    nodesByUniverse: buildNodesByUniverse(),
    universeMetrics: UNIVERSE_METRICS,
    consumerRows: mock.CONSUMER_COSTS,
    policy
  })
}

function hydrateFromBootstrap(payload) {
  STATUS = payload.status || mock.STATUS
  CLOUDS = payload.clouds
  ENVIRONMENTS = payload.environments
  GLOBAL_OVERVIEW = payload.globalOverview
  GLOBAL_KPIS = payload.globalKpis
  CRITICAL_ISSUES = payload.criticalIssues
  INSIGHTS = payload.insights || []
  UNIVERSE_OUTCOMES = payload.universeOutcomes || {}
  UNIVERSES = payload.universes
  NODES = payload.nodesByUniverse || {}
  UNIVERSE_METRICS = payload.universeMetrics
  INFRASTRUCTURE = payload.infrastructure
  ALERTS = payload.alerts
  DRIFT_ITEMS = payload.driftItems
  VULNERABILITIES = payload.vulnerabilities
  PATCH_JOBS = payload.patchJobs
  CERTIFICATES = payload.certificates
  AUDIT_LOG = payload.auditLog
  PLATFORM_HEALTH = payload.platformHealth
  AGENT_FLEET = payload.agentFleet || []
  AGENT_SUMMARY = payload.agentSummary || { total: 0, connected: 0 }
  SETUP_STATE = payload.setup || { step: 'welcome', completed: false }
  INTEGRATIONS = payload.integrations || {}
  PLATFORM_LINKS = payload.links || {}
  VM_AGENT_DEFINITIONS = payload.vmAgentDefinitions
  PROVISION_STEPS = payload.provisionSteps
  YB_VERSIONS = payload.ybVersions
  VM_SIZES = payload.vmSizes
  REGIONS = payload.regions
  FINANCE_POLICY = payload.financePolicy || DEFAULT_FINANCE_POLICY
  UNIVERSE_COSTS = payload.universeCosts || []
  CONSUMER_COSTS = payload.consumerCosts || []
  FINANCE_KPIS = payload.financeKpis || {}
  VULN_STATUS = payload.vulnStatus
  PATCH_STATUS = payload.patchStatus
}

function hydrateFromMock() {
  STATUS = mock.STATUS
  CLOUDS = mock.CLOUDS
  ENVIRONMENTS = mock.ENVIRONMENTS
  GLOBAL_OVERVIEW = mock.GLOBAL_OVERVIEW
  GLOBAL_KPIS = mock.GLOBAL_KPIS
  CRITICAL_ISSUES = mock.CRITICAL_ISSUES
  UNIVERSES = mock.UNIVERSES
  NODES = { ...mock.NODES }
  UNIVERSE_METRICS = mock.UNIVERSE_METRICS
  INFRASTRUCTURE = mock.INFRASTRUCTURE
  ALERTS = mock.ALERTS
  DRIFT_ITEMS = mock.DRIFT_ITEMS
  VULNERABILITIES = mock.VULNERABILITIES
  PATCH_JOBS = mock.PATCH_JOBS
  CERTIFICATES = mock.CERTIFICATES
  AUDIT_LOG = mock.AUDIT_LOG
  PLATFORM_HEALTH = mock.PLATFORM_HEALTH
  VM_AGENT_DEFINITIONS = mock.VM_AGENT_DEFINITIONS
  PROVISION_STEPS = mock.PROVISION_STEPS
  YB_VERSIONS = mock.YB_VERSIONS
  VM_SIZES = mock.VM_SIZES
  REGIONS = mock.REGIONS
  VULN_STATUS = mock.VULN_STATUS
  PATCH_STATUS = mock.PATCH_STATUS
  applyFinancePayload(computeLocalFinance())
}

export async function initPlatformData() {
  if (USE_MOCK) {
    hydrateFromMock()
    dataSource = 'mock'
    return { source: 'mock' }
  }

  try {
    const payload = await apiFetch('/bootstrap')
    hydrateFromBootstrap(payload)
    dataSource = 'api'
    return { source: 'api' }
  } catch (err) {
    if (err.code === 'AUTH_REQUIRED' || !getSessionToken()) {
      throw err
    }
    throw new Error(`Failed to load platform data: ${err.message}`)
  }
}

export function getSetupState() {
  return SETUP_STATE
}

/** Re-fetch bootstrap (e.g. after finance policy save in Settings). */
export async function reloadPlatformData() {
  return initPlatformData()
}

/** Apply updated finance policy locally (mock) or re-fetch (API). */
export async function applyFinancePolicy(policy) {
  FINANCE_POLICY = policy
  if (USE_MOCK || dataSource === 'mock') {
    applyFinancePayload(computeLocalFinance(policy))
    return { source: 'mock' }
  }
  return reloadPlatformData()
}

export function getVmAgentLabel(type) {
  return mock.getVmAgentLabel(type)
}

export function getUniverseById(id) {
  return UNIVERSES.find((u) => u.id === id)
}

export function getNodesForUniverse(universeId) {
  if (NODES[universeId]) return NODES[universeId]
  return mock.getNodesForUniverse(universeId)
}

export function getNodeById(universeId, nodeId) {
  return getNodesForUniverse(universeId).find((n) => n.id === nodeId || n.name === nodeId)
}

export function filterUniverses(cloud, env) {
  return UNIVERSES.filter((u) => {
    if (cloud && u.cloud !== cloud) return false
    if (env && u.environment !== env) return false
    return true
  })
}

export function getUniverseFilterLabel(cloud, env) {
  return mock.getUniverseFilterLabel(cloud, env)
}

export function getUniverseMetrics(universeId) {
  return UNIVERSE_METRICS[universeId] || EMPTY_METRICS
}

export function getMetricStatus(key, value) {
  const t = METRIC_THRESHOLDS[key]
  if (!t || value == null) return STATUS.HEALTHY
  if (value >= t.crit) return STATUS.CRITICAL
  if (value >= t.warn) return STATUS.WARNING
  return STATUS.HEALTHY
}

export function getUniverseMetricsOverallStatus(universeId) {
  const m = getUniverseMetrics(universeId)
  const keys = Object.keys(METRIC_THRESHOLDS)
  let worst = STATUS.HEALTHY
  for (const key of keys) {
    const s = getMetricStatus(key, m[key])
    if (s === STATUS.CRITICAL) return STATUS.CRITICAL
    if (s === STATUS.WARNING) worst = STATUS.WARNING
  }
  return worst
}

export function summarizeUniverseMetrics(universes) {
  let healthy = 0
  let warning = 0
  let critical = 0
  for (const u of universes) {
    const s = getUniverseMetricsOverallStatus(u.id)
    if (s === STATUS.CRITICAL) critical += 1
    else if (s === STATUS.WARNING) warning += 1
    else healthy += 1
  }
  return { healthy, warning, critical }
}

export function filterVulnerabilities(cloud, env, severity, status) {
  return VULNERABILITIES.filter((v) => {
    if (cloud && v.cloud !== cloud) return false
    if (env && v.environment !== env) return false
    if (severity && v.severity !== severity) return false
    if (status && v.status !== status) return false
    return true
  })
}

export function filterPatchJobs(cloud, env, status) {
  return PATCH_JOBS.filter((p) => {
    if (cloud && p.cloud !== cloud) return false
    if (env && p.environment !== env) return false
    if (status && p.status !== status) return false
    return true
  })
}

export function summarizeVulnerabilities(items) {
  const open = items.filter((v) => v.status === VULN_STATUS.OPEN || v.status === VULN_STATUS.SCHEDULED).length
  const inProgress = items.filter((v) => v.status === VULN_STATUS.IN_PROGRESS).length
  const remediated = items.filter((v) => v.status === VULN_STATUS.REMEDIATED).length
  const critical = items.filter((v) => v.severity === STATUS.CRITICAL && v.status !== VULN_STATUS.REMEDIATED).length
  return { open, inProgress, remediated, critical, total: VULNERABILITIES.length }
}

export function summarizePatchJobs(items) {
  const scheduled = items.filter((p) => p.status === PATCH_STATUS.SCHEDULED).length
  const inProgress = items.filter((p) => p.status === PATCH_STATUS.IN_PROGRESS).length
  const completed = items.filter((p) => p.status === PATCH_STATUS.COMPLETED).length
  const failed = items.filter((p) => p.status === PATCH_STATUS.FAILED).length
  return { scheduled, inProgress, completed, failed, total: PATCH_JOBS.length }
}

export function getVmAgentsFromNode(node) {
  return mock.getVmAgentsFromNode(node)
}

export function getVmAgentsSummary(node) {
  return mock.getVmAgentsSummary(node)
}

export function filterUniverseCosts(cloud, env) {
  return UNIVERSE_COSTS.filter((c) => {
    if (cloud && c.cloud !== cloud) return false
    if (env && c.environment !== env) return false
    return true
  })
}

export function filterConsumerCosts(cloud, env, universeId) {
  return getConsumerAllocations(cloud, env, universeId)
}

export function summarizeFinance(universeCosts) {
  return engineSummarizeFinance(universeCosts)
}

export function getConsumersForUniverse(universeId) {
  const u = UNIVERSE_COSTS.find((c) => c.universeId === universeId)
  if (!u) return []
  return computeUniverseAllocation(u)?.consumers || []
}

export function computeUniverseAllocation(universeCost) {
  return engineComputeAllocation(universeCost, getEffectiveConsumerCosts())
}

export function enrichUniverseCost(universeCost) {
  if (universeCost.activePool != null) return universeCost
  return engineEnrichUniverseCost(universeCost, getEffectiveConsumerCosts())
}

export function getConsumerAllocations(cloud, env, universeId) {
  const universes = filterUniverseCosts(cloud, env)
  const rows = []
  const consumers = getEffectiveConsumerCosts()
  for (const u of universes) {
    if (universeId && u.universeId !== universeId) continue
    rows.push(...engineComputeAllocation(u, consumers).consumers)
  }
  return rows
}

export function getIdleAllocations(cloud, env, universeId) {
  const universes = filterUniverseCosts(cloud, env)
  const consumers = getEffectiveConsumerCosts()
  const idleRows = []
  for (const u of universes) {
    if (universeId && u.universeId !== universeId) continue
    const allocation = engineComputeAllocation(u, consumers)
    if (allocation.idlePool > 0) {
      idleRows.push({
        id: `idle-${u.universeId}`,
        universeId: u.universeId,
        universeName: u.universeName,
        label: 'Universe idle / reserved capacity',
        idlePct: allocation.idlePct,
        idlePool: allocation.idlePool,
        totalMonthly: u.totalMonthly
      })
    }
  }
  return idleRows
}
