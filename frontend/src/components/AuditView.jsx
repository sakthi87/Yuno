import React, { useState } from 'react'
import { AUDIT_LOG } from '../services/dataService'
import { DemoBanner, PageHeader } from './shared/PlatformUI'

const AuditView = ({ embedded = false }) => {
  const [actionFilter, setActionFilter] = useState('')
  const actions = [...new Set(AUDIT_LOG.map((a) => a.action))]
  const filtered = AUDIT_LOG.filter((a) => !actionFilter || a.action === actionFilter)

  const content = (
    <>
      {!embedded && (
        <>
          <PageHeader title="Audit" subtitle="Immutable record of platform operations" />
          <DemoBanner />
        </>
      )}

      <div className="filter-bar">
        <span style={{ fontSize: '0.82rem', color: '#627d98', fontWeight: 600 }}>Action:</span>
        <button type="button" className={`filter-chip ${!actionFilter ? 'active' : ''}`} onClick={() => setActionFilter('')}>All</button>
        {actions.map((a) => (
          <button
            key={a}
            type="button"
            className={`filter-chip ${actionFilter === a ? 'active' : ''}`}
            onClick={() => setActionFilter(a)}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="platform-card">
        <h3>Audit Log</h3>
        <table className="platform-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.time).toLocaleString()}</td>
                <td><strong>{entry.actor}</strong></td>
                <td><span className="platform-pill">{entry.action}</span></td>
                <td>{entry.resource}</td>
                <td>{entry.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )

  if (embedded) return content

  return <div className="platform-page">{content}</div>
}

export default AuditView
