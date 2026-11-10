export const STATUS = {
  HEALTHY: 'HEALTHY',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  UNKNOWN: 'UNKNOWN',
  PROVISIONING: 'PROVISIONING'
}

export const CLOUDS = ['AWS', 'Azure']
export const ENVIRONMENTS = ['DEV', 'IT', 'UAT', 'PROD']

export const GLOBAL_OVERVIEW = [
  { cloud: 'AWS', env: 'DEV', universes: 4, nodes: 12, healthy: 11, warning: 1, critical: 0 },
  { cloud: 'AWS', env: 'IT', universes: 3, nodes: 9, healthy: 9, warning: 0, critical: 0 },
  { cloud: 'AWS', env: 'UAT', universes: 5, nodes: 15, healthy: 14, warning: 1, critical: 0 },
  { cloud: 'AWS', env: 'PROD', universes: 8, nodes: 24, healthy: 23, warning: 0, critical: 1 },
  { cloud: 'Azure', env: 'DEV', universes: 3, nodes: 9, healthy: 9, warning: 0, critical: 0 },
  { cloud: 'Azure', env: 'IT', universes: 4, nodes: 12, healthy: 11, warning: 1, critical: 0 },
  { cloud: 'Azure', env: 'UAT', universes: 4, nodes: 12, healthy: 12, warning: 0, critical: 0 },
  { cloud: 'Azure', env: 'PROD', universes: 7, nodes: 21, healthy: 20, warning: 1, critical: 0 }
]

export const GLOBAL_KPIS = {
  totalUniverses: 38,
  totalNodes: 114,
  healthy: 109,
  warning: 4,
  critical: 1,
  agentsConnected: 112,
  certsExpiring30d: 6
}

export const UNIVERSES = [
  {
    id: 'uni-payments-prod',
    name: 'payments-prod',
    cloud: 'AWS',
    environment: 'PROD',
    region: 'us-east-1',
    ybVersion: '2.25.1.0',
    owner: 'DBA Team',
    status: STATUS.WARNING,
    health: {
      infrastructure: STATUS.HEALTHY,
      yugabytedb: STATUS.HEALTHY,
      yba: STATUS.HEALTHY,
      security: STATUS.WARNING,
      certificates: STATUS.CRITICAL,
      monitoring: STATUS.HEALTHY,
      backup: STATUS.HEALTHY,
      compliance: STATUS.HEALTHY
    },
    issues: [
      { severity: STATUS.CRITICAL, message: 'Certificate expires in 9 days (node-03 YB TLS)' },
      { severity: STATUS.WARNING, message: 'Security agent version outdated on node-02' }
    ],
    nodes: ['node-01', 'node-02', 'node-03']
  },
  {
    id: 'uni-customer-prod-01',
    name: 'customer-prod-01',
    cloud: 'AWS',
    environment: 'PROD',
    region: 'us-east-1',
    ybVersion: '2.25.1.0',
    owner: 'Customer Platform',
    status: STATUS.HEALTHY,
    health: {
      infrastructure: STATUS.HEALTHY,
      yugabytedb: STATUS.HEALTHY,
      yba: STATUS.HEALTHY,
      security: STATUS.HEALTHY,
      certificates: STATUS.HEALTHY,
      monitoring: STATUS.HEALTHY,
      backup: STATUS.HEALTHY,
      compliance: STATUS.HEALTHY
    },
    issues: [],
    nodes: ['node-01', 'node-02', 'node-03']
  },
  {
    id: 'uni-customer-prod-02',
    name: 'customer-prod-02',
    cloud: 'AWS',
    environment: 'PROD',
    region: 'us-west-2',
    ybVersion: '2.25.1.0',
    owner: 'Customer Platform',
    status: STATUS.HEALTHY,
    health: {
      infrastructure: STATUS.HEALTHY,
      yugabytedb: STATUS.HEALTHY,
      yba: STATUS.HEALTHY,
      security: STATUS.HEALTHY,
      certificates: STATUS.HEALTHY,
      monitoring: STATUS.HEALTHY,
      backup: STATUS.HEALTHY,
      compliance: STATUS.HEALTHY
    },
    issues: [],
    nodes: ['node-01', 'node-02', 'node-03']
  },
  {
    id: 'uni-analytics-prod',
    name: 'analytics-prod',
    cloud: 'AWS',
    environment: 'PROD',
    region: 'us-east-1',
    ybVersion: '2.23.6.0',
    owner: 'Analytics Team',
    status: STATUS.CRITICAL,
    health: {
      infrastructure: STATUS.HEALTHY,
      yugabytedb: STATUS.WARNING,
      yba: STATUS.HEALTHY,
      security: STATUS.CRITICAL,
      certificates: STATUS.HEALTHY,
      monitoring: STATUS.HEALTHY,
      backup: STATUS.WARNING,
      compliance: STATUS.WARNING
    },
    issues: [
      { severity: STATUS.CRITICAL, message: 'Security agent unavailable on node-01' },
      { severity: STATUS.WARNING, message: 'Backup has not completed in 26 hours' }
    ],
    nodes: ['node-01', 'node-02', 'node-03']
  },
  {
    id: 'uni-payments-uat',
    name: 'payments-uat',
    cloud: 'Azure',
    environment: 'UAT',
    region: 'eastus',
    ybVersion: '2.25.0.0',
    owner: 'Payments Team',
    status: STATUS.HEALTHY,
    health: {
      infrastructure: STATUS.HEALTHY,
      yugabytedb: STATUS.HEALTHY,
      yba: STATUS.HEALTHY,
      security: STATUS.HEALTHY,
      certificates: STATUS.HEALTHY,
      monitoring: STATUS.HEALTHY,
      backup: STATUS.HEALTHY,
      compliance: STATUS.HEALTHY
    },
    issues: [],
    nodes: ['node-01', 'node-02', 'node-03']
  },
  {
    id: 'uni-dev-sandbox',
    name: 'dev-sandbox',
    cloud: 'AWS',
    environment: 'DEV',
    region: 'us-east-1',
    ybVersion: '2.25.2.0-b1',
    owner: 'Dev Team',
    status: STATUS.HEALTHY,
    health: {
      infrastructure: STATUS.HEALTHY,
      yugabytedb: STATUS.HEALTHY,
      yba: STATUS.HEALTHY,
      security: STATUS.HEALTHY,
      certificates: STATUS.HEALTHY,
      monitoring: STATUS.HEALTHY,
      backup: STATUS.HEALTHY,
      compliance: STATUS.HEALTHY
    },
    issues: [],
    nodes: ['node-01', 'node-02', 'node-03']
  },
  {
    id: 'uni-it-shared',
    name: 'it-shared',
    cloud: 'Azure',
    environment: 'IT',
    region: 'westus2',
    ybVersion: '2.24.2.0',
    owner: 'Platform Team',
    status: STATUS.WARNING,
    health: {
      infrastructure: STATUS.HEALTHY,
      yugabytedb: STATUS.HEALTHY,
      yba: STATUS.WARNING,
      security: STATUS.HEALTHY,
      certificates: STATUS.WARNING,
      monitoring: STATUS.HEALTHY,
      backup: STATUS.HEALTHY,
      compliance: STATUS.HEALTHY
    },
    issues: [
      { severity: STATUS.WARNING, message: 'YBA connectivity intermittent' },
      { severity: STATUS.WARNING, message: 'Certificate expires in 28 days' }
    ],
    nodes: ['node-01', 'node-02', 'node-03']
  },
  {
    id: 'uni-azure-prod-core',
    name: 'core-prod',
    cloud: 'Azure',
    environment: 'PROD',
    region: 'eastus',
    ybVersion: '2.25.1.0',
    owner: 'Core Services',
    status: STATUS.WARNING,
    health: {
      infrastructure: STATUS.HEALTHY,
      yugabytedb: STATUS.HEALTHY,
      yba: STATUS.HEALTHY,
      security: STATUS.HEALTHY,
      certificates: STATUS.HEALTHY,
      monitoring: STATUS.WARNING,
      backup: STATUS.HEALTHY,
      compliance: STATUS.HEALTHY
    },
    issues: [
      { severity: STATUS.WARNING, message: 'Monitoring agent not reporting on node-02 for 15 minutes' }
    ],
    nodes: ['node-01', 'node-02', 'node-03']
  }
]

/** YugabyteDB universe-level metrics (Prometheus / YBA collector) */
export const UNIVERSE_METRICS = {
  'uni-payments-prod': {
    readOpsPerSec: 18400,
    writeOpsPerSec: 9200,
    avgReadLatencyMs: 2.4,
    avgWriteLatencyMs: 5.1,
    activeConnections: 412,
    tabletsTotal: 1024,
    tabletsUnhealthy: 0,
    underReplicated: 0,
    leaderlessTablets: 0,
    cpuAvgPct: 48,
    memoryAvgPct: 71,
    diskUsedPct: 58,
    replicationLagMs: 18
  },
  'uni-customer-prod-01': {
    readOpsPerSec: 22100,
    writeOpsPerSec: 11800,
    avgReadLatencyMs: 1.8,
    avgWriteLatencyMs: 3.9,
    activeConnections: 528,
    tabletsTotal: 1280,
    tabletsUnhealthy: 0,
    underReplicated: 0,
    leaderlessTablets: 0,
    cpuAvgPct: 55,
    memoryAvgPct: 74,
    diskUsedPct: 62,
    replicationLagMs: 11
  },
  'uni-customer-prod-02': {
    readOpsPerSec: 19600,
    writeOpsPerSec: 10400,
    avgReadLatencyMs: 2.0,
    avgWriteLatencyMs: 4.2,
    activeConnections: 467,
    tabletsTotal: 1152,
    tabletsUnhealthy: 0,
    underReplicated: 0,
    leaderlessTablets: 0,
    cpuAvgPct: 51,
    memoryAvgPct: 69,
    diskUsedPct: 55,
    replicationLagMs: 14
  },
  'uni-analytics-prod': {
    readOpsPerSec: 31200,
    writeOpsPerSec: 8600,
    avgReadLatencyMs: 6.8,
    avgWriteLatencyMs: 18.2,
    activeConnections: 689,
    tabletsTotal: 2048,
    tabletsUnhealthy: 7,
    underReplicated: 12,
    leaderlessTablets: 2,
    cpuAvgPct: 82,
    memoryAvgPct: 88,
    diskUsedPct: 79,
    replicationLagMs: 420
  },
  'uni-payments-uat': {
    readOpsPerSec: 4200,
    writeOpsPerSec: 2100,
    avgReadLatencyMs: 2.9,
    avgWriteLatencyMs: 6.4,
    activeConnections: 86,
    tabletsTotal: 384,
    tabletsUnhealthy: 0,
    underReplicated: 0,
    leaderlessTablets: 0,
    cpuAvgPct: 28,
    memoryAvgPct: 45,
    diskUsedPct: 38,
    replicationLagMs: 22
  },
  'uni-dev-sandbox': {
    readOpsPerSec: 820,
    writeOpsPerSec: 410,
    avgReadLatencyMs: 1.2,
    avgWriteLatencyMs: 2.8,
    activeConnections: 24,
    tabletsTotal: 96,
    tabletsUnhealthy: 0,
    underReplicated: 0,
    leaderlessTablets: 0,
    cpuAvgPct: 12,
    memoryAvgPct: 34,
    diskUsedPct: 22,
    replicationLagMs: 8
  },
  'uni-it-shared': {
    readOpsPerSec: 6800,
    writeOpsPerSec: 3400,
    avgReadLatencyMs: 3.1,
    avgWriteLatencyMs: 7.2,
    activeConnections: 142,
    tabletsTotal: 512,
    tabletsUnhealthy: 1,
    underReplicated: 0,
    leaderlessTablets: 0,
    cpuAvgPct: 38,
    memoryAvgPct: 58,
    diskUsedPct: 47,
    replicationLagMs: 45
  },
  'uni-azure-prod-core': {
    readOpsPerSec: 15800,
    writeOpsPerSec: 7900,
    avgReadLatencyMs: 2.6,
    avgWriteLatencyMs: 5.8,
    activeConnections: 356,
    tabletsTotal: 896,
    tabletsUnhealthy: 0,
    underReplicated: 0,
    leaderlessTablets: 0,
    cpuAvgPct: 44,
    memoryAvgPct: 66,
    diskUsedPct: 52,
    replicationLagMs: 16
  }
}

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

export function getMetricStatus(key, value) {
  const t = METRIC_THRESHOLDS[key]
  if (!t || value == null) return STATUS.HEALTHY
  if (value >= t.crit) return STATUS.CRITICAL
  if (value >= t.warn) return STATUS.WARNING
  return STATUS.HEALTHY
}

export function getUniverseMetrics(universeId) {
  return UNIVERSE_METRICS[universeId] || {
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
}

/** Worst metric status across thresholded fields for a universe */
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

/** VM-level agents/services collected from each cloud provider */
export const VM_AGENT_DEFINITIONS = {
  Azure: [
    { type: 'AZURE_MONITOR_AGENT', label: 'Azure Monitor Agent', service: 'AzureMonitorAgent' },
    { type: 'TANIUM_CLIENT', label: 'Tanium Client', service: 'Tanium Client' },
    { type: 'NESSUS_AGENT', label: 'Nessus Agent', service: 'nessusagent' },
    { type: 'DD_AGENT', label: 'Datadog (dd-agent)', service: 'datadog-agent' }
  ],
  AWS: [
    { type: 'CLOUDWATCH_AGENT', label: 'CloudWatch Agent', service: 'amazon-cloudwatch-agent' },
    { type: 'TANIUM_CLIENT', label: 'Tanium Client', service: 'Tanium Client' },
    { type: 'NESSUS_AGENT', label: 'Nessus Agent', service: 'nessusagent' },
    { type: 'DD_AGENT', label: 'Datadog (dd-agent)', service: 'datadog-agent' }
  ]
}

export function getVmAgentLabel(type) {
  for (const cloud of Object.keys(VM_AGENT_DEFINITIONS)) {
    const found = VM_AGENT_DEFINITIONS[cloud].find((a) => a.type === type)
    if (found) return found.label
  }
  return type.replace(/_/g, ' ')
}

function buildVmAgents(cloud, overrides = {}) {
  const defs = VM_AGENT_DEFINITIONS[cloud] || VM_AGENT_DEFINITIONS.Azure
  const defaults = {
    AZURE_MONITOR_AGENT: { status: STATUS.HEALTHY, version: '1.28.0', message: 'Running — metrics flowing to Log Analytics' },
    CLOUDWATCH_AGENT: { status: STATUS.HEALTHY, version: '1.300057.1', message: 'Running — metrics published' },
    TANIUM_CLIENT: { status: STATUS.HEALTHY, version: '7.4.10.1083', message: 'Connected — last sync 2 min ago' },
    NESSUS_AGENT: { status: STATUS.HEALTHY, version: '10.7.2', message: 'Running — last scan 6 hours ago' },
    DD_AGENT: { status: STATUS.HEALTHY, version: '7.52.1', message: 'Running — dd-agent active' }
  }
  return defs.map((def) => ({
    type: def.type,
    label: def.label,
    service: def.service,
    category: 'VM_AGENT',
    ...(defaults[def.type] || { status: STATUS.HEALTHY, version: '—', message: 'Running' }),
    ...(overrides[def.type] || {})
  }))
}

function buildYbComponents(ybVersion, role, overrides = {}) {
  const comps = []
  if (role === 'MASTER_TSERVER' || role === 'MASTER') {
    comps.push({ type: 'YB_MASTER', label: 'YB Master', category: 'YUGABYTE', status: STATUS.HEALTHY, version: ybVersion, message: 'Running', ...(overrides.YB_MASTER || {}) })
  }
  if (role === 'MASTER_TSERVER' || role === 'TSERVER') {
    comps.push({ type: 'YB_TSERVER', label: 'YB TServer', category: 'YUGABYTE', status: STATUS.HEALTHY, version: ybVersion, message: 'Running', ...(overrides.YB_TSERVER || {}) })
  }
  return comps
}

function buildPlatformComponents(overrides = {}) {
  return [
    { type: 'PLATFORM_AGENT', label: 'Platform Agent', category: 'PLATFORM', status: STATUS.HEALTHY, version: '1.2.0', message: 'Heartbeat 30s ago', ...(overrides.PLATFORM_AGENT || {}) }
  ]
}

export function buildNodeComponents(cloud, ybVersion, role, vmAgentOverrides = {}, ybOverrides = {}) {
  return [
    ...buildYbComponents(ybVersion, role, ybOverrides),
    ...buildPlatformComponents(vmAgentOverrides.PLATFORM_AGENT ? { PLATFORM_AGENT: vmAgentOverrides.PLATFORM_AGENT } : {}),
    ...buildVmAgents(cloud, vmAgentOverrides)
  ]
}

export const NODES = {
  'uni-payments-prod': [
    {
      id: 'node-payments-prod-01',
      name: 'node-01',
      privateIp: '10.0.1.11',
      publicIp: '—',
      az: 'us-east-1a',
      role: 'MASTER_TSERVER',
      status: STATUS.HEALTHY,
      vm: { instanceId: 'i-0a1b2c3d4e5f6g7h8', type: 'm5.2xlarge', os: 'RHEL 8.8' },
      components: buildNodeComponents('AWS', '2.25.1.0', 'MASTER_TSERVER', {}, {})
    },
    {
      id: 'node-payments-prod-02',
      name: 'node-02',
      privateIp: '10.0.1.12',
      publicIp: '—',
      az: 'us-east-1b',
      role: 'TSERVER',
      status: STATUS.WARNING,
      vm: { instanceId: 'i-1b2c3d4e5f6g7h8i9', type: 'm5.2xlarge', os: 'RHEL 8.8' },
      components: buildNodeComponents('AWS', '2.25.1.0', 'TSERVER', {
        TANIUM_CLIENT: { status: STATUS.WARNING, version: '7.4.9.1050', message: 'Version outdated (expected 7.4.10.1083)' }
      })
    },
    {
      id: 'node-payments-prod-03',
      name: 'node-03',
      privateIp: '10.0.1.13',
      publicIp: '—',
      az: 'us-east-1c',
      role: 'TSERVER',
      status: STATUS.CRITICAL,
      vm: { instanceId: 'i-2c3d4e5f6g7h8i9j0', type: 'm5.2xlarge', os: 'RHEL 8.8' },
      components: [
        ...buildNodeComponents('AWS', '2.25.1.0', 'TSERVER'),
        { type: 'CERTIFICATE', label: 'YB TLS Certificate', category: 'CERTIFICATE', status: STATUS.CRITICAL, version: '—', message: 'YB TLS cert expires in 9 days' }
      ]
    }
  ],
  'uni-analytics-prod': [
    {
      id: 'node-analytics-prod-01',
      name: 'node-01',
      privateIp: '10.0.2.11',
      publicIp: '—',
      az: 'us-east-1a',
      role: 'MASTER_TSERVER',
      status: STATUS.CRITICAL,
      vm: { instanceId: 'i-analytics01', type: 'm5.4xlarge', os: 'RHEL 8.8' },
      components: buildNodeComponents('AWS', '2.23.6.0', 'MASTER_TSERVER', {
        TANIUM_CLIENT: { status: STATUS.CRITICAL, version: '7.4.8.990', message: 'Not reporting — 42 min since last sync' },
        NESSUS_AGENT: { status: STATUS.WARNING, version: '10.6.4', message: 'Service stopped' }
      })
    },
    {
      id: 'node-analytics-prod-02',
      name: 'node-02',
      privateIp: '10.0.2.12',
      publicIp: '—',
      az: 'us-east-1b',
      role: 'TSERVER',
      status: STATUS.HEALTHY,
      vm: { instanceId: 'i-analytics02', type: 'm5.4xlarge', os: 'RHEL 8.8' },
      components: buildNodeComponents('AWS', '2.23.6.0', 'TSERVER')
    },
    {
      id: 'node-analytics-prod-03',
      name: 'node-03',
      privateIp: '10.0.2.13',
      publicIp: '—',
      az: 'us-east-1c',
      role: 'TSERVER',
      status: STATUS.HEALTHY,
      vm: { instanceId: 'i-analytics03', type: 'm5.4xlarge', os: 'RHEL 8.8' },
      components: buildNodeComponents('AWS', '2.23.6.0', 'TSERVER')
    }
  ],
  'uni-payments-uat': [
    {
      id: 'node-payments-uat-01',
      name: 'node-01',
      privateIp: '10.1.0.11',
      publicIp: '—',
      az: 'eastus-1',
      role: 'MASTER_TSERVER',
      status: STATUS.HEALTHY,
      vm: { instanceId: '/subscriptions/.../vm-yb-uat-01', type: 'Standard_D8s_v5', os: 'RHEL 8.10' },
      components: buildNodeComponents('Azure', '2.25.0.0', 'MASTER_TSERVER')
    },
    {
      id: 'node-payments-uat-02',
      name: 'node-02',
      privateIp: '10.1.0.12',
      publicIp: '—',
      az: 'eastus-2',
      role: 'TSERVER',
      status: STATUS.HEALTHY,
      vm: { instanceId: '/subscriptions/.../vm-yb-uat-02', type: 'Standard_D8s_v5', os: 'RHEL 8.10' },
      components: buildNodeComponents('Azure', '2.25.0.0', 'TSERVER')
    },
    {
      id: 'node-payments-uat-03',
      name: 'node-03',
      privateIp: '10.1.0.13',
      publicIp: '—',
      az: 'eastus-3',
      role: 'TSERVER',
      status: STATUS.HEALTHY,
      vm: { instanceId: '/subscriptions/.../vm-yb-uat-03', type: 'Standard_D8s_v5', os: 'RHEL 8.10' },
      components: buildNodeComponents('Azure', '2.25.0.0', 'TSERVER')
    }
  ],
  'uni-it-shared': [
    {
      id: 'node-it-shared-01',
      name: 'node-01',
      privateIp: '10.1.1.11',
      publicIp: '—',
      az: 'westus2-1',
      role: 'MASTER_TSERVER',
      status: STATUS.HEALTHY,
      vm: { instanceId: '/subscriptions/.../vm-yb-it-01', type: 'Standard_D8s_v5', os: 'RHEL 8.10' },
      components: buildNodeComponents('Azure', '2.24.2.0', 'MASTER_TSERVER')
    },
    {
      id: 'node-it-shared-02',
      name: 'node-02',
      privateIp: '10.1.1.12',
      publicIp: '—',
      az: 'westus2-2',
      role: 'TSERVER',
      status: STATUS.WARNING,
      vm: { instanceId: '/subscriptions/.../vm-yb-it-02', type: 'Standard_D8s_v5', os: 'RHEL 8.10' },
      components: buildNodeComponents('Azure', '2.24.2.0', 'TSERVER', {
        NESSUS_AGENT: { status: STATUS.WARNING, version: '10.7.1', message: 'Last scan overdue — 9 days ago' }
      })
    },
    {
      id: 'node-it-shared-03',
      name: 'node-03',
      privateIp: '10.1.1.13',
      publicIp: '—',
      az: 'westus2-3',
      role: 'TSERVER',
      status: STATUS.HEALTHY,
      vm: { instanceId: '/subscriptions/.../vm-yb-it-03', type: 'Standard_D8s_v5', os: 'RHEL 8.10' },
      components: buildNodeComponents('Azure', '2.24.2.0', 'TSERVER')
    }
  ],
  'uni-azure-prod-core': [
    {
      id: 'node-core-prod-01',
      name: 'node-01',
      privateIp: '10.1.2.11',
      publicIp: '—',
      az: 'eastus-1',
      role: 'MASTER_TSERVER',
      status: STATUS.HEALTHY,
      vm: { instanceId: '/subscriptions/.../vm-yb-prod-01', type: 'Standard_D16s_v5', os: 'RHEL 8.10' },
      components: buildNodeComponents('Azure', '2.25.1.0', 'MASTER_TSERVER')
    },
    {
      id: 'node-core-prod-02',
      name: 'node-02',
      privateIp: '10.1.2.12',
      publicIp: '—',
      az: 'eastus-2',
      role: 'TSERVER',
      status: STATUS.WARNING,
      vm: { instanceId: '/subscriptions/.../vm-yb-prod-02', type: 'Standard_D16s_v5', os: 'RHEL 8.10' },
      components: buildNodeComponents('Azure', '2.25.1.0', 'TSERVER', {
        DD_AGENT: { status: STATUS.WARNING, version: '7.52.1', message: 'Not reporting — 15 min since last metrics push' },
        AZURE_MONITOR_AGENT: { status: STATUS.HEALTHY, version: '1.28.0', message: 'Running' }
      })
    },
    {
      id: 'node-core-prod-03',
      name: 'node-03',
      privateIp: '10.1.2.13',
      publicIp: '—',
      az: 'eastus-3',
      role: 'TSERVER',
      status: STATUS.HEALTHY,
      vm: { instanceId: '/subscriptions/.../vm-yb-prod-03', type: 'Standard_D16s_v5', os: 'RHEL 8.10' },
      components: buildNodeComponents('Azure', '2.25.1.0', 'TSERVER')
    }
  ]
}

export const CERTIFICATES = [
  { id: 'cert-1', universe: 'payments-prod', type: 'YB TLS', location: 'node-03', issuer: 'Internal CA', expires: '2026-09-05', daysRemaining: 9, status: STATUS.CRITICAL, owner: 'DBA Team', cloud: 'AWS', env: 'PROD' },
  { id: 'cert-2', universe: 'payments-prod', type: 'YBA TLS', location: 'yba-prod-01', issuer: 'Internal CA', expires: '2026-11-20', daysRemaining: 85, status: STATUS.HEALTHY, owner: 'DBA Team', cloud: 'AWS', env: 'PROD' },
  { id: 'cert-3', universe: 'it-shared', type: 'YB TLS', location: 'node-01', issuer: 'Enterprise CA', expires: '2026-09-24', daysRemaining: 28, status: STATUS.WARNING, owner: 'Platform Team', cloud: 'Azure', env: 'IT' },
  { id: 'cert-4', universe: 'customer-prod-01', type: 'YB TLS', location: 'node-01', issuer: 'Internal CA', expires: '2027-01-15', daysRemaining: 141, status: STATUS.HEALTHY, owner: 'Customer Platform', cloud: 'AWS', env: 'PROD' },
  { id: 'cert-5', universe: 'analytics-prod', type: 'VM TLS', location: 'node-01', issuer: 'Internal CA', expires: '2026-10-01', daysRemaining: 35, status: STATUS.HEALTHY, owner: 'Analytics Team', cloud: 'AWS', env: 'PROD' },
  { id: 'cert-6', universe: 'core-prod', type: 'YB TLS', location: 'node-02', issuer: 'Enterprise CA', expires: '2026-09-18', daysRemaining: 22, status: STATUS.WARNING, owner: 'Core Services', cloud: 'Azure', env: 'PROD' },
  { id: 'cert-7', universe: 'payments-uat', type: 'YB TLS', location: 'node-01', issuer: 'Internal CA', expires: '2027-03-01', daysRemaining: 186, status: STATUS.HEALTHY, owner: 'Payments Team', cloud: 'Azure', env: 'UAT' },
  { id: 'cert-8', universe: 'dev-sandbox', type: 'YB TLS', location: 'node-01', issuer: 'Dev CA', expires: '2026-12-01', daysRemaining: 96, status: STATUS.HEALTHY, owner: 'Dev Team', cloud: 'AWS', env: 'DEV' }
]

export const ALERTS = [
  { id: 'alert-1', severity: STATUS.CRITICAL, title: 'Certificate expiring soon', resource: 'payments-prod / node-03', message: 'YB TLS certificate expires in 9 days', time: '2026-08-27T10:15:00Z', universeId: 'uni-payments-prod' },
  { id: 'alert-2', severity: STATUS.CRITICAL, title: 'Security agent down', resource: 'analytics-prod / node-01', message: 'Security agent not reporting for 42 minutes', time: '2026-08-27T09:48:00Z', universeId: 'uni-analytics-prod' },
  { id: 'alert-3', severity: STATUS.WARNING, title: 'Backup overdue', resource: 'analytics-prod', message: 'Last successful backup was 26 hours ago', time: '2026-08-27T08:30:00Z', universeId: 'uni-analytics-prod' },
  { id: 'alert-4', severity: STATUS.WARNING, title: 'Security agent outdated', resource: 'payments-prod / node-02', message: 'Agent version 5.4.1 — expected 5.4.2', time: '2026-08-27T07:22:00Z', universeId: 'uni-payments-prod' },
  { id: 'alert-5', severity: STATUS.WARNING, title: 'Monitoring gap', resource: 'core-prod / node-02', message: 'Monitoring agent silent for 15 minutes', time: '2026-08-27T06:55:00Z', universeId: 'uni-azure-prod-core' },
  { id: 'alert-6', severity: STATUS.WARNING, title: 'YBA connectivity', resource: 'it-shared', message: 'YBA API response time elevated', time: '2026-08-26T22:10:00Z', universeId: 'uni-it-shared' }
]

export const DRIFT_ITEMS = [
  { id: 'drift-1', resource: 'prod-yb-03 (analytics-prod/node-01)', component: 'Security Agent', desired: 'RUNNING', actual: 'STOPPED', detected: '2026-08-27T09:06:00Z', universeId: 'uni-analytics-prod' },
  { id: 'drift-2', resource: 'prod-yb-02 (payments-prod/node-02)', component: 'Security Agent Version', desired: '5.4.2', actual: '5.4.1', detected: '2026-08-27T07:20:00Z', universeId: 'uni-payments-prod' },
  { id: 'drift-3', resource: 'it-yb-01 (it-shared/node-01)', component: 'Backup Schedule', desired: 'DAILY_02:00_UTC', actual: 'DISABLED', detected: '2026-08-26T14:30:00Z', universeId: 'uni-it-shared' }
]

export function getVmAgentsFromNode(node) {
  return (node.components || []).filter((c) => c.category === 'VM_AGENT')
}

export function getVmAgentsSummary(node) {
  const agents = getVmAgentsFromNode(node)
  if (!agents.length) return '—'
  const healthy = agents.filter((a) => a.status === STATUS.HEALTHY).length
  return `${healthy}/${agents.length}`
}

export const INFRASTRUCTURE = UNIVERSES.flatMap((u) =>
  (NODES[u.id] || u.nodes.map((n, i) => ({
    id: `${u.id}-${n}`,
    name: n,
    privateIp: `10.${u.cloud === 'AWS' ? '0' : '1'}.${i + 1}.1${i + 1}`,
    az: `${u.region}a`,
    role: i === 0 ? 'MASTER_TSERVER' : 'TSERVER',
    status: STATUS.HEALTHY,
    vm: { instanceId: `i-${u.id.slice(-6)}${i}`, type: 'm5.2xlarge', os: 'RHEL 8.8' },
    components: [{ type: 'PLATFORM_AGENT', status: STATUS.HEALTHY, version: '1.2.0', message: 'Connected' }]
  }))).map((node) => {
    const vmAgents = getVmAgentsFromNode(node)
    return {
      ...node,
      universe: u.name,
      universeId: u.id,
      cloud: u.cloud,
      environment: u.environment,
      agentStatus: node.components?.find((c) => c.type === 'PLATFORM_AGENT')?.status === STATUS.HEALTHY ? 'CONNECTED' : 'DISCONNECTED',
      lastHeartbeat: '30s ago',
      vmAgents,
      vmAgentsSummary: getVmAgentsSummary(node)
    }
  })
)

export const AUDIT_LOG = [
  { id: 'audit-1', time: '2026-08-27T10:31:00Z', actor: 'jsmith', action: 'PROVISION_APPROVE', resource: 'payments-prod', details: 'Approved PROD provisioning request #PR-1042' },
  { id: 'audit-2', time: '2026-08-27T10:28:00Z', actor: 'dev-team', action: 'PROVISION_REQUEST', resource: 'payments-prod', details: 'Submitted universe provisioning request (3 nodes, m5.2xlarge)' },
  { id: 'audit-3', time: '2026-08-27T09:15:00Z', actor: 'ops-bot', action: 'REMEDIATE', resource: 'analytics-prod/node-01', details: 'Attempted security agent restart — failed' },
  { id: 'audit-4', time: '2026-08-27T08:42:00Z', actor: 'mchen', action: 'HEALTH_CHECK', resource: 'payments-prod', details: 'Manual health validation triggered' },
  { id: 'audit-5', time: '2026-08-26T16:20:00Z', actor: 'admin', action: 'RBAC_UPDATE', resource: 'role:developer', details: 'Added DEV provisioning permission for team-payments' },
  { id: 'audit-6', time: '2026-08-26T14:05:00Z', actor: 'system', action: 'DRIFT_DETECTED', resource: 'it-shared/node-01', details: 'Backup schedule drift: desired DAILY, actual DISABLED' },
  { id: 'audit-7', time: '2026-08-26T11:30:00Z', actor: 'kpatel', action: 'CERT_SCAN', resource: 'global', details: 'Scheduled certificate inventory scan completed — 8 certs' },
  { id: 'audit-8', time: '2026-08-25T09:00:00Z', actor: 'jsmith', action: 'UNIVERSE_UPGRADE', resource: 'customer-prod-01', details: 'YB version upgrade 2.24.x → 2.25.1.0 completed' }
]

export const PLATFORM_HEALTH = [
  { component: 'API Gateway', status: STATUS.HEALTHY, lastCheck: '30s ago', message: 'All endpoints responding' },
  { component: 'Metadata DB (PostgreSQL)', status: STATUS.HEALTHY, lastCheck: '30s ago', message: 'Connections healthy, replication lag 0ms' },
  { component: 'Workflow Engine (Temporal)', status: STATUS.HEALTHY, lastCheck: '1m ago', message: '2 active workflows, 0 failed' },
  { component: 'AWS Adapter', status: STATUS.HEALTHY, lastCheck: '45s ago', message: 'EC2, VPC APIs reachable' },
  { component: 'Azure Adapter', status: STATUS.HEALTHY, lastCheck: '45s ago', message: 'Compute, Network APIs reachable' },
  { component: 'YBA Adapter', status: STATUS.WARNING, lastCheck: '2m ago', message: 'Azure IT YBA response time elevated (1.2s)' },
  { component: 'Agent Connectivity', status: STATUS.HEALTHY, lastCheck: '30s ago', message: '112/114 agents connected (98.2%)' },
  { component: 'Event Bus (Kafka)', status: STATUS.HEALTHY, lastCheck: '1m ago', message: 'All partitions healthy' }
]

export const CRITICAL_ISSUES = [
  { severity: STATUS.CRITICAL, universe: 'payments-prod', message: 'Certificate expires in 9 days', cloud: 'AWS', env: 'PROD', universeId: 'uni-payments-prod' },
  { severity: STATUS.CRITICAL, universe: 'analytics-prod', message: 'Security agent unavailable on node-01', cloud: 'AWS', env: 'PROD', universeId: 'uni-analytics-prod' },
  { severity: STATUS.WARNING, universe: 'analytics-prod', message: 'Backup has not completed in 26 hours', cloud: 'AWS', env: 'PROD', universeId: 'uni-analytics-prod' },
  { severity: STATUS.WARNING, universe: 'customer-prod-01', message: 'Security agent version outdated on node-02', cloud: 'AWS', env: 'PROD', universeId: 'uni-payments-prod' }
]

export const PROVISION_STEPS = [
  'Request validated',
  'Metadata created',
  'Cloud resources selected',
  'VMs provisioned',
  'Network configured',
  'Security agent installed',
  'Monitoring agent installed',
  'Certificates installed',
  'YBA configured',
  'Universe created',
  'Nodes registered',
  'Health checks passed'
]

export const YB_VERSIONS = ['2.25.2.0-b1', '2.25.1.0', '2.25.0.0', '2.24.2.0', '2.23.6.0']
export const VM_SIZES = {
  AWS: ['m5.xlarge', 'm5.2xlarge', 'm5.4xlarge', 'r5.2xlarge'],
  Azure: ['Standard_D4s_v5', 'Standard_D8s_v5', 'Standard_D16s_v5', 'Standard_E8s_v5']
}
export const REGIONS = {
  AWS: ['us-east-1', 'us-west-2', 'eu-west-1'],
  Azure: ['eastus', 'westus2', 'northeurope']
}

export function getUniverseById(id) {
  return UNIVERSES.find((u) => u.id === id)
}

export function getNodesForUniverse(universeId) {
  const universe = getUniverseById(universeId)
  if (NODES[universeId]) return NODES[universeId]
  if (!universe) return []
  return universe.nodes.map((n, i) => {
    const role = i === 0 ? 'MASTER_TSERVER' : 'TSERVER'
    return {
      id: `${universeId}-${n}`,
      name: n,
      privateIp: `10.0.${i + 1}.1${i + 1}`,
      az: `${universe.region}a`,
      role,
      status: STATUS.HEALTHY,
      vm: {
        instanceId: universe.cloud === 'Azure' ? `/subscriptions/.../vm-${n}` : `i-${universeId.slice(-4)}${i}`,
        type: universe.cloud === 'Azure' ? 'Standard_D8s_v5' : 'm5.2xlarge',
        os: universe.cloud === 'Azure' ? 'RHEL 8.10' : 'RHEL 8.8'
      },
      components: buildNodeComponents(universe.cloud, universe.ybVersion, role)
    }
  })
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

export const VULN_STATUS = {
  OPEN: 'OPEN',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  REMEDIATED: 'REMEDIATED'
}

export const PATCH_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
}

export const VULNERABILITIES = [
  {
    id: 'vuln-1',
    cveId: 'CVE-2024-6119',
    severity: STATUS.CRITICAL,
    title: 'OpenSSL X.509 name check buffer overflow',
    package: 'openssl',
    installedVersion: '1.1.1k',
    fixedVersion: '1.1.1w',
    cloud: 'AWS',
    environment: 'PROD',
    universe: 'analytics-prod',
    universeId: 'uni-analytics-prod',
    node: 'node-01',
    nodeId: 'node-analytics-prod-01',
    status: VULN_STATUS.OPEN,
    source: 'Nessus',
    firstSeen: '2026-08-18T04:12:00Z',
    lastSeen: '2026-08-27T06:00:00Z',
    patchJobId: 'patch-1'
  },
  {
    id: 'vuln-2',
    cveId: 'CVE-2024-37371',
    severity: STATUS.CRITICAL,
    title: 'Kerberos PAC validation flaw',
    package: 'krb5-libs',
    installedVersion: '1.18.2',
    fixedVersion: '1.21.3',
    cloud: 'AWS',
    environment: 'PROD',
    universe: 'analytics-prod',
    universeId: 'uni-analytics-prod',
    node: 'node-01',
    nodeId: 'node-analytics-prod-01',
    status: VULN_STATUS.IN_PROGRESS,
    source: 'Nessus',
    firstSeen: '2026-08-15T11:30:00Z',
    lastSeen: '2026-08-27T06:00:00Z',
    patchJobId: 'patch-1'
  },
  {
    id: 'vuln-3',
    cveId: 'CVE-2024-1086',
    severity: STATUS.CRITICAL,
    title: 'Linux kernel use-after-free in netfilter',
    package: 'kernel',
    installedVersion: '4.18.0-513.el8',
    fixedVersion: '4.18.0-553.el8',
    cloud: 'AWS',
    environment: 'PROD',
    universe: 'analytics-prod',
    universeId: 'uni-analytics-prod',
    node: 'node-02',
    nodeId: 'node-analytics-prod-02',
    status: VULN_STATUS.OPEN,
    source: 'Nessus',
    firstSeen: '2026-08-22T09:00:00Z',
    lastSeen: '2026-08-27T06:00:00Z',
    patchJobId: 'patch-2'
  },
  {
    id: 'vuln-4',
    cveId: 'CVE-2024-22017',
    severity: STATUS.WARNING,
    title: 'Node.js HTTP request smuggling',
    package: 'nodejs',
    installedVersion: '18.17.0',
    fixedVersion: '18.20.4',
    cloud: 'AWS',
    environment: 'PROD',
    universe: 'payments-prod',
    universeId: 'uni-payments-prod',
    node: 'node-02',
    nodeId: 'node-payments-prod-02',
    status: VULN_STATUS.OPEN,
    source: 'Nessus',
    firstSeen: '2026-08-25T14:20:00Z',
    lastSeen: '2026-08-27T05:30:00Z',
    patchJobId: 'patch-3'
  },
  {
    id: 'vuln-5',
    cveId: 'CVE-2024-6387',
    severity: STATUS.CRITICAL,
    title: 'OpenSSH regreSSHion remote code execution',
    package: 'openssh-server',
    installedVersion: '8.0p1',
    fixedVersion: '9.8p1',
    cloud: 'AWS',
    environment: 'PROD',
    universe: 'payments-prod',
    universeId: 'uni-payments-prod',
    node: 'node-02',
    nodeId: 'node-payments-prod-02',
    status: VULN_STATUS.SCHEDULED,
    source: 'Nessus',
    firstSeen: '2026-08-10T08:00:00Z',
    lastSeen: '2026-08-27T05:30:00Z',
    patchJobId: 'patch-3'
  },
  {
    id: 'vuln-6',
    cveId: 'CVE-2024-3400',
    severity: STATUS.CRITICAL,
    title: 'PAN-OS command injection (agent dependency)',
    package: 'paloalto-agent',
    installedVersion: '2.1.0',
    fixedVersion: '2.2.1',
    cloud: 'Azure',
    environment: 'IT',
    universe: 'it-shared',
    universeId: 'uni-it-shared',
    node: 'node-02',
    nodeId: 'node-it-shared-02',
    status: VULN_STATUS.OPEN,
    source: 'Nessus',
    firstSeen: '2026-08-19T16:45:00Z',
    lastSeen: '2026-08-18T06:00:00Z',
    patchJobId: null
  },
  {
    id: 'vuln-7',
    cveId: 'CVE-2024-21413',
    severity: STATUS.WARNING,
    title: 'Microsoft Outlook MonikerLink bypass',
    package: 'libcurl',
    installedVersion: '7.61.1',
    fixedVersion: '8.7.1',
    cloud: 'Azure',
    environment: 'IT',
    universe: 'it-shared',
    universeId: 'uni-it-shared',
    node: 'node-02',
    nodeId: 'node-it-shared-02',
    status: VULN_STATUS.OPEN,
    source: 'Nessus',
    firstSeen: '2026-08-12T10:00:00Z',
    lastSeen: '2026-08-18T06:00:00Z',
    patchJobId: null
  },
  {
    id: 'vuln-8',
    cveId: 'CVE-2024-4577',
    severity: STATUS.CRITICAL,
    title: 'PHP CGI argument injection',
    package: 'php-cli',
    installedVersion: '7.4.33',
    fixedVersion: '8.2.21',
    cloud: 'Azure',
    environment: 'PROD',
    universe: 'core-prod',
    universeId: 'uni-azure-prod-core',
    node: 'node-02',
    nodeId: 'node-core-prod-02',
    status: VULN_STATUS.IN_PROGRESS,
    source: 'Nessus',
    firstSeen: '2026-08-21T07:15:00Z',
    lastSeen: '2026-08-27T04:00:00Z',
    patchJobId: 'patch-4'
  },
  {
    id: 'vuln-9',
    cveId: 'CVE-2023-48795',
    severity: STATUS.WARNING,
    title: 'Terrapin SSH protocol prefix truncation',
    package: 'openssh-clients',
    installedVersion: '8.7p1',
    fixedVersion: '9.6p1',
    cloud: 'AWS',
    environment: 'PROD',
    universe: 'customer-prod-01',
    universeId: 'uni-customer-prod-01',
    node: 'node-01',
    nodeId: 'uni-customer-prod-01-node-01',
    status: VULN_STATUS.REMEDIATED,
    source: 'Nessus',
    firstSeen: '2026-07-01T12:00:00Z',
    lastSeen: '2026-08-20T06:00:00Z',
    patchJobId: 'patch-5'
  },
  {
    id: 'vuln-10',
    cveId: 'CVE-2024-3094',
    severity: STATUS.CRITICAL,
    title: 'xz/liblzma backdoor (supply chain)',
    package: 'xz-libs',
    installedVersion: '5.4.6',
    fixedVersion: '5.4.6-2.el8',
    cloud: 'AWS',
    environment: 'DEV',
    universe: 'dev-sandbox',
    universeId: 'uni-dev-sandbox',
    node: 'node-01',
    nodeId: 'uni-dev-sandbox-node-01',
    status: VULN_STATUS.REMEDIATED,
    source: 'Nessus',
    firstSeen: '2026-06-15T09:00:00Z',
    lastSeen: '2026-08-01T06:00:00Z',
    patchJobId: 'patch-6'
  },
  {
    id: 'vuln-11',
    cveId: 'CVE-2024-21762',
    severity: STATUS.WARNING,
    title: 'FortiOS out-of-bound write (monitoring dependency)',
    package: 'forti-monitor-agent',
    installedVersion: '7.0.12',
    fixedVersion: '7.0.14',
    cloud: 'Azure',
    environment: 'UAT',
    universe: 'payments-uat',
    universeId: 'uni-payments-uat',
    node: 'node-01',
    nodeId: 'node-payments-uat-01',
    status: VULN_STATUS.OPEN,
    source: 'Nessus',
    firstSeen: '2026-08-26T18:00:00Z',
    lastSeen: '2026-08-27T02:00:00Z',
    patchJobId: null
  }
]

export const PATCH_JOBS = [
  {
    id: 'patch-1',
    title: 'RHEL 8 security bundle — analytics-prod node-01',
    cveIds: ['CVE-2024-6119', 'CVE-2024-37371'],
    cloud: 'AWS',
    environment: 'PROD',
    universe: 'analytics-prod',
    universeId: 'uni-analytics-prod',
    nodes: ['node-01'],
    status: PATCH_STATUS.IN_PROGRESS,
    tool: 'Tanium',
    scheduledFor: '2026-08-27T22:00:00Z',
    startedAt: '2026-08-27T14:00:00Z',
    completedAt: null,
    owner: 'Security Ops',
    maintenanceWindow: 'PROD-SAT-02:00',
    progress: 62
  },
  {
    id: 'patch-2',
    title: 'Kernel update — analytics-prod node-02',
    cveIds: ['CVE-2024-1086'],
    cloud: 'AWS',
    environment: 'PROD',
    universe: 'analytics-prod',
    universeId: 'uni-analytics-prod',
    nodes: ['node-02'],
    status: PATCH_STATUS.SCHEDULED,
    tool: 'Tanium',
    scheduledFor: '2026-08-30T02:00:00Z',
    startedAt: null,
    completedAt: null,
    owner: 'Platform Team',
    maintenanceWindow: 'PROD-SAT-02:00',
    progress: 0
  },
  {
    id: 'patch-3',
    title: 'OpenSSH + Node.js patches — payments-prod',
    cveIds: ['CVE-2024-6387', 'CVE-2024-22017'],
    cloud: 'AWS',
    environment: 'PROD',
    universe: 'payments-prod',
    universeId: 'uni-payments-prod',
    nodes: ['node-02'],
    status: PATCH_STATUS.SCHEDULED,
    tool: 'Tanium',
    scheduledFor: '2026-08-28T02:00:00Z',
    startedAt: null,
    completedAt: null,
    owner: 'DBA Team',
    maintenanceWindow: 'PROD-SUN-02:00',
    progress: 0
  },
  {
    id: 'patch-4',
    title: 'PHP runtime update — core-prod node-02',
    cveIds: ['CVE-2024-4577'],
    cloud: 'Azure',
    environment: 'PROD',
    universe: 'core-prod',
    universeId: 'uni-azure-prod-core',
    nodes: ['node-02'],
    status: PATCH_STATUS.IN_PROGRESS,
    tool: 'Tanium',
    scheduledFor: '2026-08-27T20:00:00Z',
    startedAt: '2026-08-27T12:30:00Z',
    completedAt: null,
    owner: 'Core Services',
    maintenanceWindow: 'PROD-WED-20:00',
    progress: 45
  },
  {
    id: 'patch-5',
    title: 'OpenSSH Terrapin fix — customer-prod-01',
    cveIds: ['CVE-2023-48795'],
    cloud: 'AWS',
    environment: 'PROD',
    universe: 'customer-prod-01',
    universeId: 'uni-customer-prod-01',
    nodes: ['node-01'],
    status: PATCH_STATUS.COMPLETED,
    tool: 'Tanium',
    scheduledFor: '2026-08-19T02:00:00Z',
    startedAt: '2026-08-19T02:05:00Z',
    completedAt: '2026-08-19T02:42:00Z',
    owner: 'Customer Platform',
    maintenanceWindow: 'PROD-SAT-02:00',
    progress: 100
  },
  {
    id: 'patch-6',
    title: 'xz-libs rollback — dev-sandbox',
    cveIds: ['CVE-2024-3094'],
    cloud: 'AWS',
    environment: 'DEV',
    universe: 'dev-sandbox',
    universeId: 'uni-dev-sandbox',
    nodes: ['node-01'],
    status: PATCH_STATUS.COMPLETED,
    tool: 'Tanium',
    scheduledFor: '2026-08-01T10:00:00Z',
    startedAt: '2026-08-01T10:02:00Z',
    completedAt: '2026-08-01T10:18:00Z',
    owner: 'Dev Team',
    maintenanceWindow: 'DEV-ANYTIME',
    progress: 100
  },
  {
    id: 'patch-7',
    title: 'Nessus agent recovery — it-shared node-02',
    cveIds: [],
    cloud: 'Azure',
    environment: 'IT',
    universe: 'it-shared',
    universeId: 'uni-it-shared',
    nodes: ['node-02'],
    status: PATCH_STATUS.FAILED,
    tool: 'Tanium',
    scheduledFor: '2026-08-26T18:00:00Z',
    startedAt: '2026-08-26T18:05:00Z',
    completedAt: '2026-08-26T18:22:00Z',
    owner: 'Security Ops',
    maintenanceWindow: 'IT-WEEKDAY-18:00',
    progress: 0,
    failureReason: 'Nessus agent service failed to restart after package update'
  }
]

/** Monthly universe infrastructure cost (USD) — compute, storage, network, backup, licensing */
export const UNIVERSE_COSTS = [
  {
    id: 'cost-payments-prod',
    universeId: 'uni-payments-prod',
    universeName: 'payments-prod',
    cloud: 'AWS',
    environment: 'PROD',
    period: '2026-08',
    currency: 'USD',
    totalMonthly: 18420,
    nodeCount: 3,
    instanceType: 'm5.2xlarge',
    breakdown: { compute: 11200, storage: 4200, network: 980, backup: 1240, licensing: 800 },
    trendPct: 4.2,
    consumerCount: 4
  },
  {
    id: 'cost-customer-prod-01',
    universeId: 'uni-customer-prod-01',
    universeName: 'customer-prod-01',
    cloud: 'AWS',
    environment: 'PROD',
    period: '2026-08',
    currency: 'USD',
    totalMonthly: 14280,
    nodeCount: 3,
    instanceType: 'm5.xlarge',
    breakdown: { compute: 8640, storage: 3600, network: 720, backup: 960, licensing: 360 },
    trendPct: -1.8,
    consumerCount: 3
  },
  {
    id: 'cost-customer-prod-02',
    universeId: 'uni-customer-prod-02',
    universeName: 'customer-prod-02',
    cloud: 'AWS',
    environment: 'PROD',
    period: '2026-08',
    currency: 'USD',
    totalMonthly: 12650,
    nodeCount: 3,
    instanceType: 'm5.xlarge',
    breakdown: { compute: 7800, storage: 3100, network: 650, backup: 850, licensing: 250 },
    trendPct: 2.1,
    consumerCount: 2
  },
  {
    id: 'cost-analytics-prod',
    universeId: 'uni-analytics-prod',
    universeName: 'analytics-prod',
    cloud: 'AWS',
    environment: 'PROD',
    period: '2026-08',
    currency: 'USD',
    totalMonthly: 22100,
    nodeCount: 3,
    instanceType: 'r5.2xlarge',
    breakdown: { compute: 14800, storage: 5200, network: 1100, backup: 600, licensing: 400 },
    trendPct: 8.5,
    consumerCount: 5
  },
  {
    id: 'cost-payments-uat',
    universeId: 'uni-payments-uat',
    universeName: 'payments-uat',
    cloud: 'Azure',
    environment: 'UAT',
    period: '2026-08',
    currency: 'USD',
    totalMonthly: 6240,
    nodeCount: 3,
    instanceType: 'Standard_D8s_v5',
    breakdown: { compute: 3800, storage: 1400, network: 420, backup: 420, licensing: 200 },
    trendPct: 0.5,
    consumerCount: 2
  },
  {
    id: 'cost-dev-sandbox',
    universeId: 'uni-dev-sandbox',
    universeName: 'dev-sandbox',
    cloud: 'AWS',
    environment: 'DEV',
    period: '2026-08',
    currency: 'USD',
    totalMonthly: 2180,
    nodeCount: 3,
    instanceType: 'm5.large',
    breakdown: { compute: 1320, storage: 480, network: 180, backup: 120, licensing: 80 },
    trendPct: -3.2,
    consumerCount: 1
  },
  {
    id: 'cost-it-shared',
    universeId: 'uni-it-shared',
    universeName: 'it-shared',
    cloud: 'Azure',
    environment: 'IT',
    period: '2026-08',
    currency: 'USD',
    totalMonthly: 4890,
    nodeCount: 3,
    instanceType: 'Standard_D4s_v5',
    breakdown: { compute: 2940, storage: 1200, network: 350, backup: 280, licensing: 120 },
    trendPct: 1.1,
    consumerCount: 3
  },
  {
    id: 'cost-azure-prod-core',
    universeId: 'uni-azure-prod-core',
    universeName: 'core-prod',
    cloud: 'Azure',
    environment: 'PROD',
    period: '2026-08',
    currency: 'USD',
    totalMonthly: 16740,
    nodeCount: 3,
    instanceType: 'Standard_E8s_v5',
    breakdown: { compute: 10200, storage: 4100, network: 890, backup: 1050, licensing: 500 },
    trendPct: 3.7,
    consumerCount: 4
  }
]

/**
 * Database-level consumers — rawUsagePct = share of universe capacity consumed.
 * Model B allocation (computed via computeUniverseAllocation):
 *   activePool  = universeTotal × combinedUsage / 100
 *   idlePool    = universeTotal − activePool
 *   allocated   = activePool × (rawUsage / combinedUsage)
 */
export const CONSUMER_COSTS = [
  // payments-prod — 40% combined (5 + 20 + 5 + 10) — canonical example
  { id: 'cons-pp-1', universeId: 'uni-payments-prod', database: 'payments_core', consumer: 'Payments Core Team', owner: 'payments-core@corp.com', rawUsagePct: 5, usage: { cpuPct: 5, storageGb: 820, readOpsPct: 6, writeOpsPct: 4 }, trendPct: 5.1 },
  { id: 'cons-pp-2', universeId: 'uni-payments-prod', database: 'payments_ledger', consumer: 'Finance Ledger', owner: 'finance-ledger@corp.com', rawUsagePct: 20, usage: { cpuPct: 20, storageGb: 610, readOpsPct: 22, writeOpsPct: 18 }, trendPct: 3.8 },
  { id: 'cons-pp-3', universeId: 'uni-payments-prod', database: 'payments_fraud', consumer: 'Fraud Detection', owner: 'fraud@corp.com', rawUsagePct: 5, usage: { cpuPct: 5, storageGb: 420, readOpsPct: 4, writeOpsPct: 6 }, trendPct: 6.2 },
  { id: 'cons-pp-4', universeId: 'uni-payments-prod', database: 'payments_audit', consumer: 'Compliance & Audit', owner: 'compliance@corp.com', rawUsagePct: 10, usage: { cpuPct: 10, storageGb: 180, readOpsPct: 8, writeOpsPct: 12 }, trendPct: 1.0 },

  { id: 'cons-cp1-1', universeId: 'uni-customer-prod-01', database: 'customer_profile', consumer: 'Customer 360', owner: 'customer360@corp.com', rawUsagePct: 28, usage: { cpuPct: 28, storageGb: 920, readOpsPct: 30, writeOpsPct: 26 }, trendPct: -2.0 },
  { id: 'cons-cp1-2', universeId: 'uni-customer-prod-01', database: 'customer_orders', consumer: 'Order Management', owner: 'orders@corp.com', rawUsagePct: 22, usage: { cpuPct: 22, storageGb: 680, readOpsPct: 24, writeOpsPct: 20 }, trendPct: -1.5 },
  { id: 'cons-cp1-3', universeId: 'uni-customer-prod-01', database: 'customer_prefs', consumer: 'Preferences Service', owner: 'prefs@corp.com', rawUsagePct: 12, usage: { cpuPct: 12, storageGb: 240, readOpsPct: 10, writeOpsPct: 14 }, trendPct: -0.8 },

  { id: 'cons-cp2-1', universeId: 'uni-customer-prod-02', database: 'billing_main', consumer: 'Billing Platform', owner: 'billing@corp.com', rawUsagePct: 32, usage: { cpuPct: 32, storageGb: 1100, readOpsPct: 34, writeOpsPct: 30 }, trendPct: 2.5 },
  { id: 'cons-cp2-2', universeId: 'uni-customer-prod-02', database: 'billing_reports', consumer: 'Reporting & Analytics', owner: 'billing-reports@corp.com', rawUsagePct: 18, usage: { cpuPct: 18, storageGb: 480, readOpsPct: 20, writeOpsPct: 16 }, trendPct: 1.8 },

  { id: 'cons-ap-1', universeId: 'uni-analytics-prod', database: 'analytics_events', consumer: 'Event Pipeline', owner: 'events@corp.com', rawUsagePct: 24, usage: { cpuPct: 24, storageGb: 2400, readOpsPct: 26, writeOpsPct: 22 }, trendPct: 12.0 },
  { id: 'cons-ap-2', universeId: 'uni-analytics-prod', database: 'analytics_warehouse', consumer: 'Data Warehouse', owner: 'dwh@corp.com', rawUsagePct: 22, usage: { cpuPct: 22, storageGb: 3200, readOpsPct: 20, writeOpsPct: 18 }, trendPct: 9.5 },
  { id: 'cons-ap-3', universeId: 'uni-analytics-prod', database: 'analytics_ml', consumer: 'ML Feature Store', owner: 'ml-platform@corp.com', rawUsagePct: 18, usage: { cpuPct: 18, storageGb: 890, readOpsPct: 16, writeOpsPct: 20 }, trendPct: 15.2 },
  { id: 'cons-ap-4', universeId: 'uni-analytics-prod', database: 'analytics_dashboards', consumer: 'BI Dashboards', owner: 'bi@corp.com', rawUsagePct: 14, usage: { cpuPct: 14, storageGb: 420, readOpsPct: 18, writeOpsPct: 8 }, trendPct: 4.0 },
  { id: 'cons-ap-5', universeId: 'uni-analytics-prod', database: 'analytics_staging', consumer: 'Staging / QA', owner: 'analytics-qa@corp.com', rawUsagePct: 10, usage: { cpuPct: 10, storageGb: 310, readOpsPct: 6, writeOpsPct: 12 }, trendPct: -5.0 },

  { id: 'cons-uat-1', universeId: 'uni-payments-uat', database: 'uat_payments', consumer: 'Payments QA', owner: 'payments-qa@corp.com', rawUsagePct: 22, usage: { cpuPct: 22, storageGb: 280, readOpsPct: 24, writeOpsPct: 20 }, trendPct: 0.2 },
  { id: 'cons-uat-2', universeId: 'uni-payments-uat', database: 'uat_integration', consumer: 'Integration Testing', owner: 'integration@corp.com', rawUsagePct: 13, usage: { cpuPct: 13, storageGb: 120, readOpsPct: 12, writeOpsPct: 15 }, trendPct: 1.2 },

  { id: 'cons-dev-1', universeId: 'uni-dev-sandbox', database: 'dev_shared', consumer: 'Dev Shared', owner: 'dev-team@corp.com', rawUsagePct: 55, usage: { cpuPct: 55, storageGb: 95, readOpsPct: 52, writeOpsPct: 58 }, trendPct: -3.2 },

  { id: 'cons-it-1', universeId: 'uni-it-shared', database: 'it_tools', consumer: 'Internal Tools', owner: 'it-tools@corp.com', rawUsagePct: 16, usage: { cpuPct: 16, storageGb: 220, readOpsPct: 18, writeOpsPct: 14 }, trendPct: 0.8 },
  { id: 'cons-it-2', universeId: 'uni-it-shared', database: 'it_monitoring', consumer: 'Monitoring Store', owner: 'monitoring@corp.com', rawUsagePct: 14, usage: { cpuPct: 14, storageGb: 380, readOpsPct: 12, writeOpsPct: 16 }, trendPct: 2.0 },
  { id: 'cons-it-3', universeId: 'uni-it-shared', database: 'it_ci', consumer: 'CI/CD Metadata', owner: 'devops@corp.com', rawUsagePct: 10, usage: { cpuPct: 10, storageGb: 140, readOpsPct: 11, writeOpsPct: 9 }, trendPct: -0.5 },

  { id: 'cons-ac-1', universeId: 'uni-azure-prod-core', database: 'core_identity', consumer: 'Identity Platform', owner: 'identity@corp.com', rawUsagePct: 18, usage: { cpuPct: 18, storageGb: 540, readOpsPct: 20, writeOpsPct: 16 }, trendPct: 4.0 },
  { id: 'cons-ac-2', universeId: 'uni-azure-prod-core', database: 'core_config', consumer: 'Config Service', owner: 'platform@corp.com', rawUsagePct: 12, usage: { cpuPct: 12, storageGb: 180, readOpsPct: 14, writeOpsPct: 10 }, trendPct: 2.5 },
  { id: 'cons-ac-3', universeId: 'uni-azure-prod-core', database: 'core_notifications', consumer: 'Notifications', owner: 'notifications@corp.com', rawUsagePct: 20, usage: { cpuPct: 20, storageGb: 320, readOpsPct: 18, writeOpsPct: 22 }, trendPct: 5.8 },
  { id: 'cons-ac-4', universeId: 'uni-azure-prod-core', database: 'core_audit', consumer: 'Platform Audit', owner: 'audit@corp.com', rawUsagePct: 15, usage: { cpuPct: 15, storageGb: 890, readOpsPct: 12, writeOpsPct: 16 }, trendPct: 1.2 }
]

/** Model B: compute active pool, idle pool, and per-consumer chargeback */
export function computeUniverseAllocation(universeCost) {
  if (!universeCost) return null
  const consumers = CONSUMER_COSTS.filter((c) => c.universeId === universeCost.universeId)
  const combinedUsagePct = consumers.reduce((s, c) => s + c.rawUsagePct, 0)
  const activePool = Math.round(universeCost.totalMonthly * combinedUsagePct / 100)
  const idlePool = universeCost.totalMonthly - activePool

  const allocatedConsumers = consumers.map((c) => {
    const shareOfActivePct = combinedUsagePct > 0 ? (c.rawUsagePct / combinedUsagePct) * 100 : 0
    const allocatedCost = combinedUsagePct > 0
      ? Math.round(activePool * (c.rawUsagePct / combinedUsagePct))
      : 0
    return {
      ...c,
      combinedUsagePct,
      shareOfActivePct,
      allocatedCost
    }
  })

  return {
    universeId: universeCost.universeId,
    universeName: universeCost.universeName,
    totalMonthly: universeCost.totalMonthly,
    combinedUsagePct,
    utilizationPct: combinedUsagePct,
    idlePct: Math.max(0, 100 - combinedUsagePct),
    activePool,
    idlePool,
    consumers: allocatedConsumers
  }
}

export function enrichUniverseCost(universeCost) {
  const allocation = computeUniverseAllocation(universeCost)
  if (!allocation) return universeCost
  return {
    ...universeCost,
    utilizationPct: allocation.utilizationPct,
    idlePct: allocation.idlePct,
    activePool: allocation.activePool,
    idlePool: allocation.idlePool,
    combinedUsagePct: allocation.combinedUsagePct
  }
}

export function getConsumerAllocations(cloud, env, universeId) {
  const universes = filterUniverseCosts(cloud, env)
  const rows = []
  for (const u of universes) {
    if (universeId && u.universeId !== universeId) continue
    const allocation = computeUniverseAllocation(u)
    if (allocation) rows.push(...allocation.consumers)
  }
  return rows
}

export function getIdleAllocations(cloud, env, universeId) {
  const universes = filterUniverseCosts(cloud, env)
  const idleRows = []
  for (const u of universes) {
    if (universeId && u.universeId !== universeId) continue
    const allocation = computeUniverseAllocation(u)
    if (allocation && allocation.idlePool > 0) {
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

export const FINANCE_KPIS = {
  totalMonthlySpend: UNIVERSE_COSTS.reduce((s, u) => s + u.totalMonthly, 0),
  universeCount: UNIVERSE_COSTS.length,
  consumerCount: CONSUMER_COSTS.length,
  avgCostPerUniverse: Math.round(UNIVERSE_COSTS.reduce((s, u) => s + u.totalMonthly, 0) / UNIVERSE_COSTS.length),
  topSpendUniverse: 'analytics-prod',
  period: '2026-08'
}

export function filterUniverseCosts(cloud, env) {
  return UNIVERSE_COSTS.filter((c) => {
    if (cloud && c.cloud !== cloud) return false
    if (env && c.environment !== env) return false
    return true
  }).map(enrichUniverseCost)
}

export function filterConsumerCosts(cloud, env, universeId) {
  return getConsumerAllocations(cloud, env, universeId)
}

export function summarizeFinance(universeCosts) {
  const enriched = universeCosts.map(enrichUniverseCost)
  const total = enriched.reduce((s, u) => s + u.totalMonthly, 0)
  const compute = enriched.reduce((s, u) => s + u.breakdown.compute, 0)
  const storage = enriched.reduce((s, u) => s + u.breakdown.storage, 0)
  const network = enriched.reduce((s, u) => s + u.breakdown.network, 0)
  const activePool = enriched.reduce((s, u) => s + (u.activePool || 0), 0)
  const idlePool = enriched.reduce((s, u) => s + (u.idlePool || 0), 0)
  const avgUtilization = enriched.length
    ? enriched.reduce((s, u) => s + (u.utilizationPct || 0), 0) / enriched.length
    : 0
  return { total, compute, storage, network, activePool, idlePool, avgUtilization, count: enriched.length }
}

export function getConsumersForUniverse(universeId) {
  const u = UNIVERSE_COSTS.find((c) => c.universeId === universeId)
  if (!u) return []
  const allocation = computeUniverseAllocation(u)
  return allocation?.consumers || []
}

export function getUniverseCostById(universeId) {
  return UNIVERSE_COSTS.find((c) => c.universeId === universeId)
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

export function getUniverseFilterLabel(cloud, env) {
  const cloudLabel = cloud || 'All'
  const envLabels = { DEV: 'Dev', IT: 'IT', UAT: 'UAT', PROD: 'Production' }
  const envLabel = env ? (envLabels[env] || env) : 'All'
  if (!cloud && !env) return 'Viewing All / All'
  return `Viewing ${cloudLabel} / ${envLabel}`
}
