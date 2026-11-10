import React, { useState } from 'react'
import { ALERTS, DRIFT_ITEMS, STATUS } from '../services/dataService'
import { DemoBanner, PageHeader, StatusBadge, StatusDot } from './shared/PlatformUI'

const AlertsCompliance = ({ embedded = false, initialSubView = 'alerts' }) => {
  const [subView, setSubView] = useState(initialSubView)
  const [severityFilter, setSeverityFilter] = useState('')

  const filteredAlerts = ALERTS.filter((a) => !severityFilter || a.severity === severityFilter)

  const content = (
    <>
      {!embedded && (
        <>
          <PageHeader title="Agents & Alerts" subtitle="Active alerts, configuration drift, and compliance status" />
          <DemoBanner />
          <div className="sub-nav">
            <button type="button" className={subView === 'alerts' ? 'active' : ''} onClick={() => setSubView('alerts')}>
              Active Alerts
            </button>
            <button type="button" className={subView === 'drift' ? 'active' : ''} onClick={() => setSubView('drift')}>
              Configuration Drift
            </button>
          </div>
        </>
      )}

      {(embedded ? initialSubView : subView) === 'alerts' && (
        <>
          <div className="platform-kpi-row">
            <div className="platform-kpi bad">
              <div className="platform-kpi-label">Critical</div>
              <div className="platform-kpi-value">{ALERTS.filter((a) => a.severity === STATUS.CRITICAL).length}</div>
            </div>
            <div className="platform-kpi warn">
              <div className="platform-kpi-label">Warning</div>
              <div className="platform-kpi-value">{ALERTS.filter((a) => a.severity === STATUS.WARNING).length}</div>
            </div>
            <div className="platform-kpi">
              <div className="platform-kpi-label">Total Active</div>
              <div className="platform-kpi-value">{ALERTS.length}</div>
            </div>
          </div>

          <div className="filter-bar">
            {['', STATUS.CRITICAL, STATUS.WARNING].map((s) => (
              <button
                key={s || 'all'}
                type="button"
                className={`filter-chip ${severityFilter === s ? 'active' : ''}`}
                onClick={() => setSeverityFilter(s)}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          <div className="platform-card">
            <h3>Alert Feed</h3>
            <table className="platform-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Title</th>
                  <th>Resource</th>
                  <th>Message</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td><StatusBadge status={alert.severity} /></td>
                    <td><strong>{alert.title}</strong></td>
                    <td>{alert.resource}</td>
                    <td>{alert.message}</td>
                    <td>{new Date(alert.time).toLocaleString()}</td>
                    <td>
                      <button type="button" className="btn btn-sm">Acknowledge</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(embedded ? initialSubView : subView) === 'drift' && (
        <>
          <div className="platform-banner" style={{ background: '#fff3e0', borderColor: '#f5c882' }}>
            Drift detection compares <strong>desired state</strong> (metadata) vs <strong>actual state</strong> (agent/collector reports).
          </div>

          <div className="platform-card">
            <h3>Configuration Drift</h3>
            <table className="platform-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Component</th>
                  <th>Desired</th>
                  <th>Actual</th>
                  <th>Detected</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {DRIFT_ITEMS.map((d) => (
                  <tr key={d.id}>
                    <td>{d.resource}</td>
                    <td>{d.component}</td>
                    <td><span className="platform-pill ok">{d.desired}</span></td>
                    <td><span className="platform-pill bad">{d.actual}</span></td>
                    <td>{new Date(d.detected).toLocaleString()}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-primary">Remediate</button>
                      <button type="button" className="btn btn-sm" style={{ marginLeft: 4 }}>Ignore</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )

  if (embedded) return content

  return <div className="platform-page">{content}</div>
}

export default AlertsCompliance
