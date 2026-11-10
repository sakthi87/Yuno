import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { config } from './config.js'
import {
  initSchema,
  clearAllData,
  run,
  queryOne,
  upsertConfig,
  upsertSetting,
  getDbLocation
} from './store.js'
import { DEFAULT_FINANCE_POLICY } from './financePolicy.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const demoCandidates = [
  // Docker / packaged layout: /app/src + /app/frontend/...
  path.join(__dirname, '../frontend/src/services/demoData.js'),
  // Monorepo layout: backend/src + frontend/...
  path.join(__dirname, '../../frontend/src/services/demoData.js')
]

async function loadDemoModule() {
  for (const demoPath of demoCandidates) {
    try {
      return await import(pathToFileURL(demoPath).href)
    } catch {
      /* try next */
    }
  }
  throw new Error(
    `Demo data module not found. Tried:\n${demoCandidates.map((p) => `  - ${p}`).join('\n')}`
  )
}

export async function seedDatabase() {
  await initSchema()
  await clearAllData()

  const demo = await loadDemoModule()

  for (const u of demo.UNIVERSES) {
    await run(
      `INSERT INTO universes (id, name, cloud, environment, region, yb_version, owner, status, health_json, issues_json, node_names_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        u.id, u.name, u.cloud, u.environment, u.region, u.ybVersion, u.owner, u.status,
        JSON.stringify(u.health), JSON.stringify(u.issues), JSON.stringify(u.nodes)
      ]
    )

    const nodes = demo.NODES[u.id] || demo.getNodesForUniverse(u.id)
    for (const node of nodes) {
      await run(
        `INSERT INTO nodes (id, universe_id, name, private_ip, public_ip, az, role, status, vm_json, components_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          node.id, u.id, node.name, node.privateIp, node.publicIp || '—', node.az, node.role, node.status,
          JSON.stringify(node.vm || {}), JSON.stringify(node.components || [])
        ]
      )
    }
  }

  for (const [universeId, metrics] of Object.entries(demo.UNIVERSE_METRICS)) {
    await run('INSERT INTO universe_metrics (universe_id, metrics_json) VALUES (?, ?)', [
      universeId, JSON.stringify(metrics)
    ])
  }

  for (const vm of demo.INFRASTRUCTURE) {
    await run('INSERT INTO infrastructure (id, universe_id, payload_json) VALUES (?, ?, ?)', [
      vm.id, vm.universeId || null, JSON.stringify(vm)
    ])
  }

  const seedMany = async (table, rows, idKey = 'id') => {
    for (const row of rows) {
      await run(`INSERT INTO ${table} (id, payload_json) VALUES (?, ?)`, [row[idKey], JSON.stringify(row)])
    }
  }

  await seedMany('alerts', demo.ALERTS)
  await seedMany('drift_items', demo.DRIFT_ITEMS)
  await seedMany('vulnerabilities', demo.VULNERABILITIES)
  await seedMany('patch_jobs', demo.PATCH_JOBS)
  await seedMany('certificates', demo.CERTIFICATES)

  for (const row of demo.AUDIT_LOG) {
    await run('INSERT INTO audit_log (id, payload_json, sort_time) VALUES (?, ?, ?)', [
      row.id, JSON.stringify(row), row.time
    ])
  }

  for (const row of demo.PLATFORM_HEALTH) {
    await run('INSERT INTO platform_health (payload_json) VALUES (?)', [JSON.stringify(row)])
  }

  await upsertConfig('clouds', demo.CLOUDS)
  await upsertConfig('environments', demo.ENVIRONMENTS)
  await upsertConfig('globalOverview', demo.GLOBAL_OVERVIEW)
  await upsertConfig('globalKpis', demo.GLOBAL_KPIS)
  await upsertConfig('criticalIssues', demo.CRITICAL_ISSUES)
  await upsertConfig('vmAgentDefinitions', demo.VM_AGENT_DEFINITIONS)
  await upsertConfig('provisionSteps', demo.PROVISION_STEPS)
  await upsertConfig('ybVersions', demo.YB_VERSIONS)
  await upsertConfig('vmSizes', demo.VM_SIZES)
  await upsertConfig('regions', demo.REGIONS)
  await upsertConfig('vulnStatus', demo.VULN_STATUS)
  await upsertConfig('patchStatus', demo.PATCH_STATUS)
  await upsertConfig('status', demo.STATUS)
  await upsertSetting('finance', {
    ...DEFAULT_FINANCE_POLICY,
    configuredVia: 'seed',
    updatedAt: new Date().toISOString()
  })

  for (const c of demo.CONSUMER_COSTS) {
    const id = c.id || `${c.universeId}:${c.database}`
    await run(
      `INSERT INTO consumer_usage (id, universe_id, database_name, consumer, owner, raw_usage_pct, usage_json, trend_pct)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        c.universeId,
        c.database,
        c.consumer,
        c.owner,
        c.rawUsagePct ?? 0,
        JSON.stringify(c.usage || {}),
        c.trendPct ?? null
      ]
    )
  }

  const nodeCount = await queryOne('SELECT COUNT(*) AS c FROM nodes')
  console.log(`Database seeded at ${getDbLocation()}`)
  console.log(`  Universes: ${demo.UNIVERSES.length}`)
  console.log(`  Nodes: ${nodeCount?.c || 0}`)
  console.log(`  VMs: ${demo.INFRASTRUCTURE.length}`)
  console.log(`  Vulnerabilities: ${demo.VULNERABILITIES.length}`)
  console.log(`  Patch jobs: ${demo.PATCH_JOBS.length}`)
}

/** Refresh finance data when demo DB is missing Model B consumer usage or policy. */
export async function ensureFinanceDemoData() {
  if (!config.autoSeed) return false

  const policyRow = await queryOne('SELECT value_json FROM platform_settings WHERE key = ?', ['finance'])
  const usageCount = await queryOne('SELECT COUNT(*) AS c FROM consumer_usage')
  const count = Number(usageCount?.c || 0)

  let consumers = []
  const row = await queryOne('SELECT value_json FROM app_config WHERE key = ?', ['consumerCosts'])
  if (row?.value_json) {
    try {
      consumers = JSON.parse(row.value_json)
    } catch {
      consumers = []
    }
  }

  const needsPolicy = !policyRow
  const needsUsage = count === 0 || (consumers.length > 0 && consumers.every((c) => c.rawUsagePct == null))

  if (!needsPolicy && !needsUsage) return false

  const demo = await loadDemoModule()

  if (needsPolicy) {
    await upsertSetting('finance', {
      ...DEFAULT_FINANCE_POLICY,
      configuredVia: 'auto-refresh',
      updatedAt: new Date().toISOString()
    })
  }

  if (needsUsage) {
    await run('DELETE FROM consumer_usage')
    for (const c of demo.CONSUMER_COSTS) {
      const id = c.id || `${c.universeId}:${c.database}`
      await run(
        `INSERT INTO consumer_usage (id, universe_id, database_name, consumer, owner, raw_usage_pct, usage_json, trend_pct)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          c.universeId,
          c.database,
          c.consumer,
          c.owner,
          c.rawUsagePct ?? 0,
          JSON.stringify(c.usage || {}),
          c.trendPct ?? null
        ]
      )
    }
  }

  console.log('Refreshed finance demo data (policy + consumer usage for Model B)')
  return true
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMain) {
  import('./store.js').then(({ initStore }) => initStore())
    .then(() => seedDatabase())
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}
