import { mergeFinancePolicy, resolveRates, getInstanceVcpus } from './financePolicy.js'

function roundUsd(n) {
  return Math.round(n)
}

function primaryInstanceType(nodes) {
  if (!nodes?.length) return 'unknown'
  const counts = {}
  for (const node of nodes) {
    const t = node.vm?.type || 'unknown'
    counts[t] = (counts[t] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

function sumNodeVcpus(nodes, policy) {
  return nodes.reduce((sum, node) => sum + getInstanceVcpus(node.vm?.type, policy), 0)
}

function sumProvisionedStorageGb(nodes, rates) {
  return nodes.reduce(
    (sum, node) => sum + Number(node.vm?.storageGb || rates.defaultStorageGbPerNode || 500),
    0
  )
}

function estimateNetworkGb(nodes, metrics, rates) {
  if (metrics?.networkEgressGb != null) return Number(metrics.networkEgressGb)
  const ops = (metrics?.readOpsPerSec || 0) + (metrics?.writeOpsPerSec || 0)
  if (ops > 0) {
    const gbFromOps = (ops * 86400 * 30) / (1024 * 1024 * 1024) * 0.001
    return Math.max(gbFromOps, nodes.length * (rates.networkGbPerNodeMonth || 100) * 0.25)
  }
  return nodes.length * (rates.networkGbPerNodeMonth || 100)
}

export function computeUniverseCostFromPolicy(universe, nodes, metrics, policyInput) {
  const policy = mergeFinancePolicy(policyInput)
  const rates = resolveRates(universe.cloud, universe.environment, policy)
  const hours = policy.hoursPerMonth || 730
  const nodeList = nodes || []
  const totalVcpus = sumNodeVcpus(nodeList, policy)
  const instanceType = primaryInstanceType(nodeList)
  const provisionedStorageGb = sumProvisionedStorageGb(nodeList, rates)
  const storageGb = metrics?.storageUsedGb != null
    ? Number(metrics.storageUsedGb)
    : provisionedStorageGb * ((metrics?.diskUsedPct || 60) / 100)

  const compute = totalVcpus * hours * rates.computePerVcpuHour
  const storage = provisionedStorageGb * rates.storagePerGbMonth
  const networkGb = estimateNetworkGb(nodeList, metrics, rates)
  const network = networkGb * rates.networkPerGb
  const licensing = totalVcpus * rates.licensePerVcpuMonth
  const backup = storage * (rates.backupPctOfStorage / 100)
  const subtotal = compute + storage + network + licensing + backup
  const overhead = subtotal * (rates.platformOverheadPct / 100)
  const totalMonthly = subtotal + overhead

  return {
    id: `cost-${universe.id}`,
    universeId: universe.id,
    universeName: universe.name,
    cloud: universe.cloud,
    environment: universe.environment,
    period: new Date().toISOString().slice(0, 7),
    currency: policy.currency || 'USD',
    totalMonthly: roundUsd(totalMonthly),
    nodeCount: nodeList.length,
    instanceType,
    totalVcpus,
    provisionedStorageGb: roundUsd(provisionedStorageGb),
    storageUsedGb: roundUsd(storageGb),
    breakdown: {
      compute: roundUsd(compute),
      storage: roundUsd(storage),
      network: roundUsd(network),
      backup: roundUsd(backup),
      licensing: roundUsd(licensing),
      overhead: roundUsd(overhead)
    },
    computedFromPolicy: true,
    trendPct: metrics?.costTrendPct ?? 0,
    consumerCount: 0
  }
}

export function computeUniverseAllocation(universeCost, consumers) {
  const rows = consumers.filter((c) => c.universeId === universeCost.universeId)
  const combinedUsagePct = rows.reduce((s, c) => s + (c.rawUsagePct || 0), 0)
  const activePool = roundUsd(universeCost.totalMonthly * combinedUsagePct / 100)
  const idlePool = universeCost.totalMonthly - activePool

  const allocatedConsumers = rows.map((c) => {
    const rawUsagePct = c.rawUsagePct || 0
    const shareOfActivePct = combinedUsagePct > 0 ? (rawUsagePct / combinedUsagePct) * 100 : 0
    const allocatedCost = combinedUsagePct > 0
      ? roundUsd(activePool * (rawUsagePct / combinedUsagePct))
      : 0
    return { ...c, combinedUsagePct, shareOfActivePct, allocatedCost }
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

export function enrichUniverseCost(universeCost, consumers) {
  const allocation = computeUniverseAllocation(universeCost, consumers)
  return {
    ...universeCost,
    consumerCount: allocation.consumers.length,
    utilizationPct: allocation.utilizationPct,
    idlePct: allocation.idlePct,
    activePool: allocation.activePool,
    idlePool: allocation.idlePool,
    combinedUsagePct: allocation.combinedUsagePct
  }
}

export function buildFinancePayload({ universes, nodesByUniverse, universeMetrics, consumerRows, policy }) {
  const mergedPolicy = mergeFinancePolicy(policy)
  const consumers = consumerRows || []

  const universeCosts = universes.map((universe) => {
    const nodes = nodesByUniverse[universe.id] || []
    const metrics = universeMetrics[universe.id] || {}
    const base = computeUniverseCostFromPolicy(universe, nodes, metrics, mergedPolicy)
    return enrichUniverseCost(base, consumers)
  })

  const consumerCosts = []
  for (const u of universeCosts) {
    consumerCosts.push(...computeUniverseAllocation(u, consumers).consumers)
  }

  const totalMonthlySpend = universeCosts.reduce((s, u) => s + u.totalMonthly, 0)
  const activePool = universeCosts.reduce((s, u) => s + (u.activePool || 0), 0)
  const idlePool = universeCosts.reduce((s, u) => s + (u.idlePool || 0), 0)
  const avgUtilization = universeCosts.length
    ? universeCosts.reduce((s, u) => s + (u.utilizationPct || 0), 0) / universeCosts.length
    : 0

  return {
    financePolicy: mergedPolicy,
    universeCosts,
    consumerCosts,
    financeKpis: {
      totalMonthlySpend,
      activePool,
      idlePool,
      avgUtilization,
      universeCount: universeCosts.length,
      consumerCount: consumers.length,
      avgCostPerUniverse: universeCosts.length
        ? roundUsd(totalMonthlySpend / universeCosts.length)
        : 0,
      topSpendUniverse: universeCosts.slice().sort((a, b) => b.totalMonthly - a.totalMonthly)[0]?.universeName || null,
      period: new Date().toISOString().slice(0, 7),
      computedFromPolicy: true
    }
  }
}

export function summarizeFinance(universeCosts) {
  const total = universeCosts.reduce((s, u) => s + u.totalMonthly, 0)
  const compute = universeCosts.reduce((s, u) => s + (u.breakdown?.compute || 0), 0)
  const storage = universeCosts.reduce((s, u) => s + (u.breakdown?.storage || 0), 0)
  const network = universeCosts.reduce((s, u) => s + (u.breakdown?.network || 0), 0)
  const licensing = universeCosts.reduce((s, u) => s + (u.breakdown?.licensing || 0), 0)
  const activePool = universeCosts.reduce((s, u) => s + (u.activePool || 0), 0)
  const idlePool = universeCosts.reduce((s, u) => s + (u.idlePool || 0), 0)
  const avgUtilization = universeCosts.length
    ? universeCosts.reduce((s, u) => s + (u.utilizationPct || 0), 0) / universeCosts.length
    : 0
  return {
    total, compute, storage, network, licensing, activePool, idlePool, avgUtilization,
    count: universeCosts.length
  }
}
