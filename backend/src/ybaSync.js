import { run, queryOne, getSettings, upsertSetting } from './store.js'
import { stampProvenance } from './provenance.js'
import { recomputePlatformState } from './healthEngine.js'

/** Built-in mock YBA catalog for demo Mode A */
export function getMockYbaCatalog() {
  return {
    universes: [
      {
        id: 'uni-payments-prod',
        name: 'payments-prod',
        cloud: 'AWS',
        environment: 'PROD',
        region: 'us-east-1',
        ybVersion: '2.25.1.0',
        owner: 'DBA Team',
        status: 'WARNING',
        health: { yba: 'HEALTHY', backup: 'HEALTHY' },
        issues: [],
        nodes: [
          {
            id: 'node-payments-prod-01',
            name: 'node-01',
            privateIp: '10.0.1.11',
            az: 'us-east-1a',
            role: 'MASTER_TSERVER',
            status: 'HEALTHY',
            vm: { type: 'm5.2xlarge', storageGb: 500 },
            components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
          },
          {
            id: 'node-payments-prod-02',
            name: 'node-02',
            privateIp: '10.0.1.12',
            az: 'us-east-1b',
            role: 'TSERVER',
            status: 'WARNING',
            vm: { type: 'm5.2xlarge', storageGb: 500 },
            components: [{ type: 'PLATFORM_AGENT', status: 'WARNING', version: '1.1.0' }]
          },
          {
            id: 'node-payments-prod-03',
            name: 'node-03',
            privateIp: '10.0.1.13',
            az: 'us-east-1c',
            role: 'TSERVER',
            status: 'CRITICAL',
            vm: { type: 'm5.2xlarge', storageGb: 500 },
            components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
          }
        ],
        metrics: {
          readOpsPerSec: 18400,
          writeOpsPerSec: 9200,
          avgReadLatencyMs: 2.4,
          avgWriteLatencyMs: 5.1,
          cpuAvgPct: 48,
          memoryAvgPct: 71,
          diskUsedPct: 58,
          replicationLagMs: 18,
          tabletsUnhealthy: 0,
          underReplicated: 0,
          leaderlessTablets: 0
        }
      },
      {
        id: 'uni-analytics-prod',
        name: 'analytics-prod',
        cloud: 'AWS',
        environment: 'PROD',
        region: 'us-east-1',
        ybVersion: '2.23.6.0',
        owner: 'Analytics Team',
        status: 'CRITICAL',
        health: { yba: 'HEALTHY', backup: 'WARNING' },
        issues: [],
        nodes: [
          {
            id: 'node-analytics-prod-01',
            name: 'node-01',
            privateIp: '10.0.2.11',
            az: 'us-east-1a',
            role: 'MASTER_TSERVER',
            status: 'CRITICAL',
            vm: { type: 'm5.4xlarge', storageGb: 1000 },
            components: [{ type: 'PLATFORM_AGENT', status: 'CRITICAL', version: '1.0.0' }]
          },
          {
            id: 'node-analytics-prod-02',
            name: 'node-02',
            privateIp: '10.0.2.12',
            az: 'us-east-1b',
            role: 'TSERVER',
            status: 'HEALTHY',
            vm: { type: 'm5.4xlarge', storageGb: 1000 },
            components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
          },
          {
            id: 'node-analytics-prod-03',
            name: 'node-03',
            privateIp: '10.0.2.13',
            az: 'us-east-1c',
            role: 'TSERVER',
            status: 'HEALTHY',
            vm: { type: 'm5.4xlarge', storageGb: 1000 },
            components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
          }
        ],
        metrics: {
          readOpsPerSec: 31200,
          writeOpsPerSec: 8600,
          avgReadLatencyMs: 6.8,
          avgWriteLatencyMs: 18.2,
          cpuAvgPct: 82,
          memoryAvgPct: 88,
          diskUsedPct: 79,
          replicationLagMs: 420,
          tabletsUnhealthy: 7,
          underReplicated: 12,
          leaderlessTablets: 2
        }
      },
      {
        id: 'uni-customer-prod-01',
        name: 'customer-prod-01',
        cloud: 'AWS',
        environment: 'PROD',
        region: 'us-east-1',
        ybVersion: '2.25.1.0',
        owner: 'Customer Platform',
        status: 'HEALTHY',
        health: { yba: 'HEALTHY', backup: 'HEALTHY' },
        issues: [],
        nodes: [
          {
            id: 'node-customer-prod-01-01',
            name: 'node-01',
            privateIp: '10.0.3.11',
            az: 'us-east-1a',
            role: 'MASTER_TSERVER',
            status: 'HEALTHY',
            vm: { type: 'm5.2xlarge', storageGb: 500 },
            components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
          },
          {
            id: 'node-customer-prod-01-02',
            name: 'node-02',
            privateIp: '10.0.3.12',
            az: 'us-east-1b',
            role: 'TSERVER',
            status: 'HEALTHY',
            vm: { type: 'm5.2xlarge', storageGb: 500 },
            components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
          },
          {
            id: 'node-customer-prod-01-03',
            name: 'node-03',
            privateIp: '10.0.3.13',
            az: 'us-east-1c',
            role: 'TSERVER',
            status: 'HEALTHY',
            vm: { type: 'm5.2xlarge', storageGb: 500 },
            components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
          }
        ],
        metrics: {
          readOpsPerSec: 22100,
          writeOpsPerSec: 11800,
          avgReadLatencyMs: 1.8,
          avgWriteLatencyMs: 3.9,
          cpuAvgPct: 55,
          memoryAvgPct: 74,
          diskUsedPct: 62,
          replicationLagMs: 11,
          tabletsUnhealthy: 0,
          underReplicated: 0,
          leaderlessTablets: 0
        }
      },
      {
        id: 'uni-payments-uat',
        name: 'payments-uat',
        cloud: 'Azure',
        environment: 'UAT',
        region: 'eastus',
        ybVersion: '2.25.0.0',
        owner: 'Payments Team',
        status: 'HEALTHY',
        health: { yba: 'HEALTHY', backup: 'HEALTHY' },
        issues: [],
        nodes: [
          {
            id: 'node-payments-uat-01',
            name: 'node-01',
            privateIp: '10.1.1.11',
            az: 'eastus-1',
            role: 'MASTER_TSERVER',
            status: 'HEALTHY',
            vm: { type: 'Standard_D8s_v5', storageGb: 400 },
            components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
          },
          {
            id: 'node-payments-uat-02',
            name: 'node-02',
            privateIp: '10.1.1.12',
            az: 'eastus-2',
            role: 'TSERVER',
            status: 'HEALTHY',
            vm: { type: 'Standard_D8s_v5', storageGb: 400 },
            components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
          },
          {
            id: 'node-payments-uat-03',
            name: 'node-03',
            privateIp: '10.1.1.13',
            az: 'eastus-3',
            role: 'TSERVER',
            status: 'HEALTHY',
            vm: { type: 'Standard_D8s_v5', storageGb: 400 },
            components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
          }
        ],
        metrics: {
          readOpsPerSec: 4200,
          writeOpsPerSec: 2100,
          avgReadLatencyMs: 2.9,
          avgWriteLatencyMs: 6.4,
          cpuAvgPct: 28,
          memoryAvgPct: 45,
          diskUsedPct: 38,
          replicationLagMs: 22,
          tabletsUnhealthy: 0,
          underReplicated: 0,
          leaderlessTablets: 0
        }
      },
      {
        id: 'uni-azure-prod-core',
        name: 'core-prod',
        cloud: 'Azure',
        environment: 'PROD',
        region: 'eastus',
        ybVersion: '2.25.1.0',
        owner: 'Core Services',
        status: 'WARNING',
        health: { yba: 'WARNING', backup: 'HEALTHY' },
        issues: [],
        nodes: [
          {
            id: 'node-azure-prod-01',
            name: 'node-01',
            privateIp: '10.1.2.11',
            az: 'eastus-1',
            role: 'MASTER_TSERVER',
            status: 'HEALTHY',
            vm: { type: 'Standard_D16s_v5', storageGb: 800 },
            components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
          },
          {
            id: 'node-azure-prod-02',
            name: 'node-02',
            privateIp: '10.1.2.12',
            az: 'eastus-2',
            role: 'TSERVER',
            status: 'WARNING',
            vm: { type: 'Standard_D16s_v5', storageGb: 800 },
            components: [{ type: 'PLATFORM_AGENT', status: 'WARNING', version: '1.2.0' }]
          },
          {
            id: 'node-azure-prod-03',
            name: 'node-03',
            privateIp: '10.1.2.13',
            az: 'eastus-3',
            role: 'TSERVER',
            status: 'HEALTHY',
            vm: { type: 'Standard_D16s_v5', storageGb: 800 },
            components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
          }
        ],
        metrics: {
          readOpsPerSec: 15800,
          writeOpsPerSec: 7900,
          avgReadLatencyMs: 2.6,
          avgWriteLatencyMs: 5.8,
          cpuAvgPct: 44,
          memoryAvgPct: 66,
          diskUsedPct: 52,
          replicationLagMs: 16,
          tabletsUnhealthy: 0,
          underReplicated: 0,
          leaderlessTablets: 0
        }
      }
    ]
  }
}

async function upsertUniverse(u, provenance) {
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
      u.id,
      u.name,
      u.cloud,
      u.environment,
      u.region || null,
      u.ybVersion || null,
      u.owner || null,
      u.status || 'HEALTHY',
      JSON.stringify(u.health || {}),
      JSON.stringify(u.issues || []),
      JSON.stringify((u.nodes || []).map((n) => n.name || n)),
      provenance.source,
      provenance.collectedAt
    ]
  )
}

async function upsertNode(universeId, node, provenance) {
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
       collected_at = EXCLUDED.collected_at`,
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
      provenance.source,
      provenance.collectedAt,
      null
    ]
  )
}

async function upsertMetrics(universeId, metrics, provenance) {
  const payload = { ...metrics, ...provenance }
  await run(
    `INSERT INTO universe_metrics (universe_id, metrics_json, source, collected_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (universe_id) DO UPDATE SET metrics_json = EXCLUDED.metrics_json, source = EXCLUDED.source, collected_at = EXCLUDED.collected_at`,
    [universeId, JSON.stringify(payload), provenance.source, provenance.collectedAt]
  )
}

export async function testYbaConnection(integration) {
  const mode = integration?.mode || 'mock'
  if (mode === 'mock' || !integration?.url || integration.url.includes('mock')) {
    return { ok: true, mode: 'mock', message: 'Mock YBA reachable', universeCount: getMockYbaCatalog().universes.length }
  }
  try {
    const url = integration.url.replace(/\/$/, '') + '/api/v1/universe_list'
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${integration.apiToken || ''}` },
      signal: AbortSignal.timeout(8000)
    })
    if (!res.ok) {
      return { ok: false, mode: 'live', message: `YBA returned HTTP ${res.status}` }
    }
    return { ok: true, mode: 'live', message: 'YBA connection OK' }
  } catch (err) {
    return { ok: false, mode: 'live', message: err.message }
  }
}

export async function syncFromYba(integrationInput) {
  const settings = await getSettings()
  const integration = integrationInput || settings.integrations?.yba || { mode: 'mock' }
  const provenance = stampProvenance('yba')
  const started = Date.now()

  let catalog
  const mode = integration.mode || (integration.url?.includes('mock') ? 'mock' : 'mock')
  if (mode === 'mock' || !integration.url || integration.url.includes('mock')) {
    catalog = getMockYbaCatalog()
  } else {
    // Live YBA: best-effort; fall back to mock shape on failure for demo resilience
    try {
      const url = integration.url.replace(/\/$/, '') + '/api/v1/universe_list'
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${integration.apiToken || ''}` },
        signal: AbortSignal.timeout(15000)
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      catalog = { universes: normalizeLiveYba(data) }
    } catch (err) {
      throw new Error(`YBA sync failed: ${err.message}`)
    }
  }

  let universeCount = 0
  let nodeCount = 0
  for (const u of catalog.universes) {
    await upsertUniverse(u, provenance)
    universeCount += 1
    for (const node of u.nodes || []) {
      await upsertNode(u.id, node, provenance)
      nodeCount += 1
    }
    if (u.metrics) await upsertMetrics(u.id, u.metrics, provenance)
  }

  const financePolicy = settings.finance
  await recomputePlatformState(financePolicy)

  const result = {
    ok: true,
    mode: mode === 'live' ? 'live' : 'mock',
    universeCount,
    nodeCount,
    durationMs: Date.now() - started,
    syncedAt: provenance.collectedAt,
    source: 'yba'
  }

  const integrations = { ...(settings.integrations || {}), yba: { ...integration, lastSync: result } }
  await upsertSetting('integrations', integrations)
  return result
}

function normalizeLiveYba(data) {
  const list = Array.isArray(data) ? data : data.universes || data.entities || []
  return list.map((item, idx) => ({
    id: item.universeUUID || item.id || `uni-live-${idx}`,
    name: item.name || item.universeName || `universe-${idx}`,
    cloud: item.provider || item.cloud || 'AWS',
    environment: item.environment || 'PROD',
    region: item.region || null,
    ybVersion: item.universeDetails?.clusters?.[0]?.userIntent?.ybSoftwareVersion || item.ybVersion || null,
    owner: item.owner || null,
    status: 'HEALTHY',
    health: {},
    issues: [],
    nodes: [],
    metrics: {}
  }))
}

export async function getYbaIntegration() {
  const settings = await getSettings()
  return settings.integrations?.yba || {
    mode: 'mock',
    url: 'mock://yba',
    apiToken: '',
    enabled: false,
    lastSync: null
  }
}
