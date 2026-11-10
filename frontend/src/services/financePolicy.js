/** Default finance policy — mirrors backend/src/financePolicy.js for mock/offline mode. */
export const DEFAULT_FINANCE_POLICY = {
  currency: 'USD',
  period: 'monthly',
  allocationModel: 'usage_plus_idle',
  hoursPerMonth: 730,
  rates: {
    licensePerVcpuMonth: 33.33,
    computePerVcpuHour: 0.064,
    storagePerGbMonth: 0.12,
    networkPerGb: 0.09,
    backupPctOfStorage: 20,
    platformOverheadPct: 5,
    defaultStorageGbPerNode: 500,
    networkGbPerNodeMonth: 150
  },
  instanceVcpus: {
    'm5.large': 2,
    'm5.xlarge': 4,
    'm5.2xlarge': 8,
    'm5.4xlarge': 16,
    'r5.2xlarge': 8,
    'Standard_D4s_v5': 4,
    'Standard_D8s_v5': 8,
    'Standard_D16s_v5': 16,
    'Standard_E8s_v5': 8
  },
  cloudOverrides: {
    Azure: { computePerVcpuHour: 0.072 }
  },
  environmentOverrides: {
    UAT: { platformOverheadPct: 0 },
    DEV: { platformOverheadPct: 0, licensePerVcpuMonth: 0 },
    IT: { platformOverheadPct: 2 }
  }
}

export function mergeFinancePolicy(stored) {
  if (!stored || typeof stored !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_FINANCE_POLICY))
  }
  return {
    ...DEFAULT_FINANCE_POLICY,
    ...stored,
    rates: { ...DEFAULT_FINANCE_POLICY.rates, ...(stored.rates || {}) },
    instanceVcpus: { ...DEFAULT_FINANCE_POLICY.instanceVcpus, ...(stored.instanceVcpus || {}) },
    cloudOverrides: { ...DEFAULT_FINANCE_POLICY.cloudOverrides, ...(stored.cloudOverrides || {}) },
    environmentOverrides: {
      ...DEFAULT_FINANCE_POLICY.environmentOverrides,
      ...(stored.environmentOverrides || {})
    }
  }
}

export function resolveRates(cloud, environment, policy) {
  const base = { ...policy.rates }
  const cloudRates = policy.cloudOverrides?.[cloud] || {}
  const envRates = policy.environmentOverrides?.[environment] || {}
  return { ...base, ...cloudRates, ...envRates }
}

export function getInstanceVcpus(instanceType, policy) {
  if (!instanceType) return 4
  return policy.instanceVcpus[instanceType] || 4
}
