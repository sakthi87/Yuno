import React from 'react'
import { PLATFORM_HEALTH } from '../services/dataService'
import { DemoBanner, PageHeader, StatusBadge, KpiCard } from './shared/PlatformUI'

const PlatformHealthView = ({ embedded = false }) => {
  const healthy = PLATFORM_HEALTH.filter((c) => c.status === 'HEALTHY').length
  const warning = PLATFORM_HEALTH.filter((c) => c.status === 'WARNING').length

  const content = (
    <>
      {!embedded && (
        <>
          <PageHeader title="Platform Health" subtitle="Observability of the control plane itself" />
          <DemoBanner />
        </>
      )}

      <div className="platform-kpi-row">
        <KpiCard label="Components" value={PLATFORM_HEALTH.length} />
        <KpiCard label="Healthy" value={healthy} tone="good" />
        <KpiCard label="Warning" value={warning} tone="warn" />
        <KpiCard label="Overall" value={warning > 0 ? 'DEGRADED' : 'HEALTHY'} tone={warning > 0 ? 'warn' : 'good'} />
      </div>

      <div className="platform-card">
        <h3>Control Plane Components</h3>
        <table className="platform-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Status</th>
              <th>Last Check</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {PLATFORM_HEALTH.map((c) => (
              <tr key={c.component}>
                <td><strong>{c.component}</strong></td>
                <td><StatusBadge status={c.status} /></td>
                <td>{c.lastCheck}</td>
                <td>{c.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="platform-grid-2" style={{ marginTop: '0.85rem' }}>
        <div className="platform-card compact">
          <h3>Architecture Engines</h3>
          <table className="platform-table">
            <tbody>
              <tr><td>Inventory Engine</td><td><StatusBadge status="HEALTHY" /></td></tr>
              <tr><td>Observability Engine</td><td><StatusBadge status="HEALTHY" /></td></tr>
              <tr><td>Automation Engine</td><td><StatusBadge status="HEALTHY" /></td></tr>
              <tr><td>Policy Engine</td><td><StatusBadge status="HEALTHY" /></td></tr>
              <tr><td>Reconciler</td><td><StatusBadge status="HEALTHY" /></td></tr>
            </tbody>
          </table>
        </div>
        <div className="platform-card compact">
          <h3>Data Stores</h3>
          <table className="platform-table">
            <tbody>
              <tr><td>Metadata DB</td><td><StatusBadge status="HEALTHY" /></td></tr>
              <tr><td>Metrics DB (Prometheus)</td><td><StatusBadge status="HEALTHY" /></td></tr>
              <tr><td>Event Store (Kafka)</td><td><StatusBadge status="HEALTHY" /></td></tr>
              <tr><td>Cache (Redis)</td><td><StatusBadge status="HEALTHY" /></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )

  if (embedded) return content

  return <div className="platform-page">{content}</div>
}

export default PlatformHealthView
