import React, { useMemo, useState } from 'react'
import {
  UNIVERSE_COSTS,
  filterUniverseCosts,
  filterConsumerCosts,
  summarizeFinance,
  getUniverseFilterLabel,
  getIdleAllocations,
  computeUniverseAllocation
} from '../services/dataService'
import ContextFilterSelector from './ContextFilterSelector'
import { DemoBanner, PageHeader } from './shared/PlatformUI'

const fmtUsd = (n) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
const fmtPct = (n) => `${(n ?? 0).toFixed(1)}%`

const TrendCell = ({ pct }) => {
  if (pct == null) return '—'
  const up = pct > 0
  return (
    <span className={up ? 'finance-trend up' : 'finance-trend down'}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

const AllocationFormula = () => (
  <div className="finance-formula">
    <strong>Model B — usage-based + idle pool</strong>
    <p>
      Each database reports <em>raw usage</em> as a % of universe capacity (not normalized to 100%).
      Combined usage drives the <strong>active pool</strong>; the remainder is idle / reserved overhead.
    </p>
    <ul>
      <li>Active pool = universe total × combined usage ÷ 100</li>
      <li>Idle pool = universe total − active pool</li>
      <li>Consumer charge = active pool × (raw usage ÷ combined usage)</li>
    </ul>
    <p className="finance-formula-example">
      Example: $10,000 universe, DBs at 5% + 20% + 5% + 10% = 40% → active $4,000, idle $6,000.
      DB at 20% gets $4,000 × (20 ÷ 40) = <strong>$2,000</strong>.
    </p>
  </div>
)

const UniverseCostsPanel = ({ cloud, env, onSelectUniverse, selectedUniverseId }) => {
  const filtered = useMemo(
    () => filterUniverseCosts(cloud || null, env || null),
    [cloud, env]
  )
  const summary = summarizeFinance(filtered)

  return (
    <>
      <AllocationFormula />

      <div className="platform-kpi-row fit">
        <div className="platform-kpi">
          <div className="platform-kpi-label">Total spend</div>
          <div className="platform-kpi-value">{fmtUsd(summary.total)}</div>
          <div className="platform-kpi-hint">filtered universes</div>
        </div>
        <div className="platform-kpi">
          <div className="platform-kpi-label">Active pool</div>
          <div className="platform-kpi-value">{fmtUsd(summary.activePool)}</div>
          <div className="platform-kpi-hint">allocated to consumers</div>
        </div>
        <div className="platform-kpi">
          <div className="platform-kpi-label">Idle / reserved</div>
          <div className="platform-kpi-value">{fmtUsd(summary.idlePool)}</div>
          <div className="platform-kpi-hint">unallocated capacity</div>
        </div>
        <div className="platform-kpi">
          <div className="platform-kpi-label">Avg utilization</div>
          <div className="platform-kpi-value">{fmtPct(summary.avgUtilization)}</div>
        </div>
        <div className="platform-kpi">
          <div className="platform-kpi-label">Licensing</div>
          <div className="platform-kpi-value">{fmtUsd(summary.licensing || 0)}</div>
        </div>
        <div className="platform-kpi">
          <div className="platform-kpi-label">Universes</div>
          <div className="platform-kpi-value">{summary.count}</div>
        </div>
      </div>

      <div className="platform-table-wrap">
        <table className="platform-table">
          <thead>
            <tr>
              <th>Universe</th>
              <th>Cloud</th>
              <th>Env</th>
              <th>Utilization</th>
              <th>Active pool</th>
              <th>Idle / reserved</th>
              <th>Monthly total</th>
              <th>Compute</th>
              <th>Licensing</th>
              <th>Storage</th>
              <th>Consumers</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className={selectedUniverseId === row.universeId ? 'row-selected' : 'clickable-row'}
                onClick={() => onSelectUniverse(row.universeId)}
              >
                <td><strong>{row.universeName}</strong></td>
                <td>{row.cloud}</td>
                <td><span className="platform-pill">{row.environment}</span></td>
                <td>
                  <strong>{fmtPct(row.utilizationPct)}</strong>
                  <div className="table-sub">of capacity used</div>
                </td>
                <td>{fmtUsd(row.activePool)}</td>
                <td className="finance-idle-cell">{fmtUsd(row.idlePool)}</td>
                <td><strong>{fmtUsd(row.totalMonthly)}</strong></td>
                <td>{fmtUsd(row.breakdown?.compute)}</td>
                <td>{fmtUsd(row.breakdown?.licensing)}</td>
                <td>{fmtUsd(row.breakdown?.storage)}</td>
                <td>{row.consumerCount}</td>
                <td><TrendCell pct={row.trendPct} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

const ConsumerAllocationPanel = ({ cloud, env, universeId, onClearUniverse }) => {
  const filtered = useMemo(
    () => filterConsumerCosts(cloud || null, env || null, universeId || null),
    [cloud, env, universeId]
  )

  const idleRows = useMemo(
    () => getIdleAllocations(cloud || null, env || null, universeId || null),
    [cloud, env, universeId]
  )

  const universeCosts = useMemo(
    () => filterUniverseCosts(cloud || null, env || null),
    [cloud, env]
  )

  const selectedAllocation = useMemo(() => {
    if (!universeId) return null
    const u = universeCosts.find((c) => c.universeId === universeId)
    return u ? computeUniverseAllocation(u) : null
  }, [universeId, universeCosts])

  const allocatedSum = filtered.reduce((s, c) => s + c.allocatedCost, 0)
  const idleSum = idleRows.reduce((s, r) => s + r.idlePool, 0)
  const basisTotal = universeId
    ? (selectedAllocation?.totalMonthly || allocatedSum + idleSum)
    : allocatedSum + idleSum

  return (
    <>
      <AllocationFormula />

      {universeId && selectedAllocation && (
        <div className="finance-context-bar">
          <span>
            <strong>{selectedAllocation.universeName}</strong>
            {' — '}
            {fmtPct(selectedAllocation.combinedUsagePct)} utilization
            {' · '}
            active {fmtUsd(selectedAllocation.activePool)}
            {' · '}
            idle {fmtUsd(selectedAllocation.idlePool)}
          </span>
          <button type="button" className="btn-link" onClick={onClearUniverse}>
            Show all universes
          </button>
        </div>
      )}

      <div className="platform-kpi-row fit">
        <div className="platform-kpi">
          <div className="platform-kpi-label">Consumers</div>
          <div className="platform-kpi-value">{filtered.length}</div>
        </div>
        <div className="platform-kpi">
          <div className="platform-kpi-label">Active allocated</div>
          <div className="platform-kpi-value">{fmtUsd(allocatedSum)}</div>
        </div>
        <div className="platform-kpi">
          <div className="platform-kpi-label">Idle / reserved</div>
          <div className="platform-kpi-value">{fmtUsd(idleSum)}</div>
        </div>
        <div className="platform-kpi">
          <div className="platform-kpi-label">Universe basis</div>
          <div className="platform-kpi-value">{fmtUsd(basisTotal)}</div>
          <div className="platform-kpi-hint">active + idle = total</div>
        </div>
      </div>

      <div className="platform-table-wrap">
        <table className="platform-table">
          <thead>
            <tr>
              <th>Database</th>
              <th>Consumer / team</th>
              <th>Universe</th>
              <th>Raw usage</th>
              <th>Share of active</th>
              <th>CPU %</th>
              <th>Storage (GB)</th>
              <th>Allocated cost</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const universe = UNIVERSE_COSTS.find((u) => u.universeId === row.universeId)
              return (
                <tr key={row.id}>
                  <td><code>{row.database}</code></td>
                  <td>
                    <div>{row.consumer}</div>
                    <div className="table-sub">{row.owner}</div>
                  </td>
                  <td>{universe?.universeName || row.universeId}</td>
                  <td>
                    <strong>{fmtPct(row.rawUsagePct)}</strong>
                    <div className="table-sub">of universe</div>
                  </td>
                  <td>
                    <strong>{fmtPct(row.shareOfActivePct)}</strong>
                    <div className="table-sub">of active pool</div>
                  </td>
                  <td>{row.usage.cpuPct}%</td>
                  <td>{row.usage.storageGb}</td>
                  <td><strong>{fmtUsd(row.allocatedCost)}</strong></td>
                  <td><TrendCell pct={row.trendPct} /></td>
                </tr>
              )
            })}
            {idleRows.map((row) => (
              <tr key={row.id} className="finance-idle-row">
                <td colSpan={3}>
                  <em>{row.label}</em>
                  <div className="table-sub">{row.universeName}</div>
                </td>
                <td>
                  <strong>{fmtPct(row.idlePct)}</strong>
                  <div className="table-sub">unused capacity</div>
                </td>
                <td>—</td>
                <td colSpan={2} className="table-sub">
                  Not charged to any consumer — universe overhead / headroom
                </td>
                <td><strong>{fmtUsd(row.idlePool)}</strong></td>
                <td>—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

const FinanceView = () => {
  const [subView, setSubView] = useState('universes')
  const [cloud, setCloud] = useState('')
  const [env, setEnv] = useState('')
  const [selectedUniverseId, setSelectedUniverseId] = useState(null)

  const filterLabel = getUniverseFilterLabel(cloud, env)

  const handleSelectUniverse = (universeId) => {
    setSelectedUniverseId(universeId)
    setSubView('consumers')
  }

  return (
    <div className="platform-page">
      <PageHeader
        title="Finance"
        subtitle="Universe costs computed from Settings rate card + node metrics; Model B consumer chargeback"
      />
      <DemoBanner />

      <div className="sub-nav">
        <button
          type="button"
          className={subView === 'universes' ? 'active' : ''}
          onClick={() => setSubView('universes')}
        >
          Universe costs
        </button>
        <button
          type="button"
          className={subView === 'consumers' ? 'active' : ''}
          onClick={() => setSubView('consumers')}
        >
          Consumer allocation
        </button>
      </div>

      <ContextFilterSelector
        cloud={cloud}
        onCloudChange={setCloud}
        environment={env}
        onEnvironmentChange={setEnv}
        summary={`${filterLabel} · August 2026`}
      />

      {subView === 'universes' && (
        <UniverseCostsPanel
          cloud={cloud}
          env={env}
          selectedUniverseId={selectedUniverseId}
          onSelectUniverse={handleSelectUniverse}
        />
      )}

      {subView === 'consumers' && (
        <ConsumerAllocationPanel
          cloud={cloud}
          env={env}
          universeId={selectedUniverseId}
          onClearUniverse={() => setSelectedUniverseId(null)}
        />
      )}

      {selectedUniverseId && subView === 'universes' && (
        <div className="finance-hint">
          Tip: click a universe row to drill into consumer allocation for that universe.
        </div>
      )}
    </div>
  )
}

export default FinanceView
