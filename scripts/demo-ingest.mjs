#!/usr/bin/env node
/**
 * Wave 1 demo: populate estate via ingest APIs only (no seed dependency).
 * Usage: node scripts/demo-ingest.mjs [--base http://localhost:3001]
 */
const BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : process.env.YUNO_URL || 'http://localhost:3001'

let TOKEN = process.env.AGENT_API_TOKEN || process.env.ENROLL_TOKEN || ''

async function api(method, path, body, token = TOKEN) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`)
  return data
}

async function ensureIngestToken() {
  if (TOKEN) return TOKEN
  // Prefer packaged Mac secret if present
  try {
    const fs = await import('fs')
    const path = await import('path')
    const { fileURLToPath } = await import('url')
    const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
    const secretsPath = path.join(root, 'packaging/mac/config/secrets.env')
    if (fs.existsSync(secretsPath)) {
      for (const line of fs.readFileSync(secretsPath, 'utf8').split('\n')) {
        const m = line.match(/^AGENT_API_TOKEN=(.+)$/)
        if (m) {
          TOKEN = m[1].trim()
          return TOKEN
        }
      }
    }
  } catch {
    /* ignore */
  }
  const login = await api('POST', '/api/v1/auth/login', { username: 'admin', password: 'admin' }, '')
  const enroll = await api('POST', '/api/v1/agents/enroll-token', {}, login.token)
  TOKEN = enroll.token
  return TOKEN
}

const provenance = { source: 'demo-ingest', collectedAt: new Date().toISOString() }

const universes = [
  {
    id: 'uni-demo-payments',
    name: 'demo-payments',
    cloud: 'AWS',
    environment: 'PROD',
    region: 'us-east-1',
    ybVersion: '2.25.1.0',
    owner: 'Demo DBA',
    status: 'WARNING',
    health: { yba: 'HEALTHY', backup: 'HEALTHY' },
    issues: [],
    nodes: ['node-demo-p1', 'node-demo-p2', 'node-demo-p3'],
    ...provenance
  },
  {
    id: 'uni-demo-analytics',
    name: 'demo-analytics',
    cloud: 'AWS',
    environment: 'PROD',
    region: 'us-east-1',
    ybVersion: '2.23.6.0',
    owner: 'Analytics',
    status: 'CRITICAL',
    health: { yba: 'HEALTHY', backup: 'WARNING' },
    issues: [],
    nodes: ['node-demo-a1', 'node-demo-a2'],
    ...provenance
  }
]

const nodes = [
  {
    universeId: 'uni-demo-payments',
    node: {
      id: 'node-demo-p1',
      name: 'node-01',
      privateIp: '10.20.1.11',
      az: 'us-east-1a',
      role: 'MASTER_TSERVER',
      status: 'HEALTHY',
      vm: { type: 'm5.2xlarge', storageGb: 500 },
      components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
    }
  },
  {
    universeId: 'uni-demo-payments',
    node: {
      id: 'node-demo-p2',
      name: 'node-02',
      privateIp: '10.20.1.12',
      az: 'us-east-1b',
      role: 'TSERVER',
      status: 'WARNING',
      vm: { type: 'm5.2xlarge', storageGb: 500 },
      components: [{ type: 'PLATFORM_AGENT', status: 'WARNING', version: '1.1.0' }]
    }
  },
  {
    universeId: 'uni-demo-payments',
    node: {
      id: 'node-demo-p3',
      name: 'node-03',
      privateIp: '10.20.1.13',
      az: 'us-east-1c',
      role: 'TSERVER',
      status: 'HEALTHY',
      vm: { type: 'm5.2xlarge', storageGb: 500 },
      components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
    }
  },
  {
    universeId: 'uni-demo-analytics',
    node: {
      id: 'node-demo-a1',
      name: 'node-01',
      privateIp: '10.20.2.11',
      az: 'us-east-1a',
      role: 'MASTER_TSERVER',
      status: 'CRITICAL',
      vm: { type: 'm5.4xlarge', storageGb: 1000 },
      components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
    }
  },
  {
    universeId: 'uni-demo-analytics',
    node: {
      id: 'node-demo-a2',
      name: 'node-02',
      privateIp: '10.20.2.12',
      az: 'us-east-1b',
      role: 'TSERVER',
      status: 'WARNING',
      vm: { type: 'm5.4xlarge', storageGb: 1000 },
      components: [{ type: 'PLATFORM_AGENT', status: 'HEALTHY', version: '1.2.0' }]
    }
  }
]

const metrics = [
  {
    universeId: 'uni-demo-payments',
    metrics: {
      readOpsPerSec: 12000,
      writeOpsPerSec: 6400,
      avgReadLatencyMs: 3.1,
      avgWriteLatencyMs: 6.2,
      cpuAvgPct: 62,
      memoryAvgPct: 74,
      diskUsedPct: 68,
      replicationLagMs: 40,
      tabletsUnhealthy: 0,
      underReplicated: 0,
      leaderlessTablets: 0,
      ...provenance
    }
  },
  {
    universeId: 'uni-demo-analytics',
    metrics: {
      readOpsPerSec: 22000,
      writeOpsPerSec: 1800,
      avgReadLatencyMs: 18,
      avgWriteLatencyMs: 9,
      cpuAvgPct: 88,
      memoryAvgPct: 91,
      diskUsedPct: 86,
      replicationLagMs: 220,
      tabletsUnhealthy: 2,
      underReplicated: 4,
      leaderlessTablets: 0,
      ...provenance
    }
  }
]

async function main() {
  console.log(`Demo ingest → ${BASE}`)
  await ensureIngestToken()
  console.log(`  using token ${TOKEN.slice(0, 16)}…`)

  for (const u of universes) {
    await api('POST', '/api/v1/ingest/universes', u)
    console.log(`  universe ${u.id}`)
  }

  for (const n of nodes) {
    await api('POST', '/api/v1/ingest/heartbeat', {
      universeId: n.universeId,
      node: n.node,
      agent: {
        id: `agent-${n.node.id}`,
        hostname: n.node.name,
        version: '1.0.0',
        hostMetrics: { cpuPct: 40, memoryPct: 55, diskPct: 50 }
      }
    })
    console.log(`  heartbeat ${n.node.id}`)
  }

  for (const m of metrics) {
    await api('POST', '/api/v1/ingest/metrics', m)
    console.log(`  metrics ${m.universeId}`)
  }

  await api('POST', '/api/v1/ingest/vulnerabilities', [
    {
      id: 'vuln-demo-1',
      cveId: 'CVE-2024-DEMO',
      severity: 'CRITICAL',
      status: 'OPEN',
      universeId: 'uni-demo-analytics',
      universe: 'demo-analytics',
      title: 'Demo critical package',
      ...provenance
    }
  ])
  console.log('  vulnerabilities')

  await api('POST', '/api/v1/ingest/certificates', {
    id: 'cert-demo-1',
    type: 'Node-to-Node',
    universeId: 'uni-demo-payments',
    universe: 'demo-payments',
    location: 'node-01',
    daysRemaining: 12,
    status: 'CRITICAL',
    ...provenance
  })
  console.log('  certificates')

  console.log('Done. Login as admin/admin, sync/recompute if needed, open Overview.')
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
