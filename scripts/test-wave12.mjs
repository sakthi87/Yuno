#!/usr/bin/env node
/**
 * End-to-end Wave 1+2 API smoke test against a running backend.
 * Usage: node scripts/test-wave12.mjs [--base http://localhost:3001]
 */
const BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : process.env.YUNO_URL || 'http://localhost:3001'

let passed = 0
let failed = 0

function ok(name, cond, detail = '') {
  if (cond) {
    passed += 1
    console.log(`  ✓ ${name}`)
  } else {
    failed += 1
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

async function json(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  return { res, data }
}

async function main() {
  console.log(`Wave 1+2 test → ${BASE}\n`)

  const health = await json('GET', '/api/v1/health')
  ok('health', health.res.ok && health.data.status === 'ok', JSON.stringify(health.data))

  const denied = await json('GET', '/api/v1/bootstrap')
  ok('bootstrap requires auth', denied.res.status === 401 || health.data.authRequired === false)

  const login = await json('POST', '/api/v1/auth/login', { username: 'admin', password: 'admin' })
  ok('login', login.res.ok && login.data.token, login.data.error)
  const token = login.data.token

  const me = await json('GET', '/api/v1/auth/me', undefined, token)
  ok('auth/me', me.res.ok && me.data.authenticated)

  const sync = await json(
    'POST',
    '/api/v1/integrations/yba/sync',
    { mode: 'mock', enabled: true },
    token
  )
  ok('yba mock sync', sync.res.ok && sync.data.universeCount > 0, JSON.stringify(sync.data))

  const enroll = await json('POST', '/api/v1/agents/enroll-token', {}, token)
  ok('enroll token', enroll.res.ok && enroll.data.token, enroll.data.error)
  const enrollToken = enroll.data.token

  const install = await fetch(`${BASE}/api/v1/agents/install.sh`)
  const installText = await install.text()
  ok('install.sh', install.ok && installText.includes('heartbeat'))

  // Pick a universe/node from bootstrap
  const boot1 = await json('GET', '/api/v1/bootstrap', undefined, token)
  ok('bootstrap after sync', boot1.res.ok && (boot1.data.universes || []).length > 0)
  const uni = boot1.data.universes[0]
  const nodes = boot1.data.nodesByUniverse?.[uni.id] || []
  const node = nodes[0]

  if (node) {
    const hb = await json(
      'POST',
      '/api/v1/ingest/heartbeat',
      {
        universeId: uni.id,
        node: {
          id: node.id,
          name: node.name,
          status: 'HEALTHY',
          role: node.role || 'TSERVER'
        },
        agent: {
          id: `agent-${node.id}`,
          hostname: node.name,
          version: '1.0.0-test',
          hostMetrics: { cpuPct: 41, memoryPct: 50, diskPct: 33 }
        }
      },
      enrollToken
    )
    ok('agent heartbeat', hb.res.ok, JSON.stringify(hb.data))
  } else {
    ok('agent heartbeat', false, 'no nodes after sync')
  }

  const recompute = await json('POST', '/api/v1/platform/recompute', {}, token)
  ok('recompute', recompute.res.ok && recompute.data.insightCount >= 0, JSON.stringify(recompute.data))

  const prom = await json('POST', '/api/v1/integrations/prometheus/sync', { mode: 'mock' }, token)
  ok('prometheus mock sync', prom.res.ok)

  const notify = await json('POST', '/api/v1/notifications/test', { channel: 'slack' }, token)
  ok('notifications test', notify.res.ok)

  const agents = await json('GET', '/api/v1/agents', undefined, token)
  ok('agent fleet', agents.res.ok && (agents.data.summary?.total ?? 0) >= 1, JSON.stringify(agents.data.summary))

  const boot2 = await json('GET', '/api/v1/bootstrap', undefined, token)
  ok(
    'insights present',
    boot2.res.ok && Array.isArray(boot2.data.insights),
    `count=${boot2.data.insights?.length}`
  )
  ok('finance kpis', boot2.data.financeKpis?.totalMonthlySpend != null)
  ok('setup object', boot2.data.setup != null)
  ok('integrations object', boot2.data.integrations != null)

  const auto = await json('POST', '/api/v1/agents/auto-enroll-commands', {}, token)
  ok('auto-enroll commands', auto.res.ok && (auto.data.commands || []).length > 0)

  console.log(`\nResult: ${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
