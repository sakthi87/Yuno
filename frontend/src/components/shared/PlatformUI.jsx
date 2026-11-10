import React from 'react'
import { STATUS, getDataSource } from '../../services/dataService'
import '../../styles/platform.css'

export const StatusDot = ({ status }) => (
  <span className={`status-dot ${status}`} title={status} />
)

export const StatusBadge = ({ status }) => (
  <span className={`status-badge ${status}`}>
    <StatusDot status={status} />
    {status}
  </span>
)

export const KpiCard = ({ label, value, hint, tone }) => (
  <div className={`platform-kpi ${tone || ''}`}>
    <div className="platform-kpi-label">{label}</div>
    <div className="platform-kpi-value">{value}</div>
    {hint && <div className="platform-kpi-hint">{hint}</div>}
  </div>
)

export const DemoBanner = () => {
  const dataSource = getDataSource()
  return (
    <div className="platform-banner">
      {dataSource === 'api' ? (
        <>
          Live data from <strong>Platform API</strong> (PostgreSQL) — loaded via{' '}
          <code>/api/v1/bootstrap</code>
        </>
      ) : (
        <>
          Demo UI with <strong>mock data</strong> — styled after ODP360. Start the backend for API mode.
        </>
      )}
    </div>
  )
}

export const PageHeader = ({ title, subtitle, controls }) => (
  <div className="platform-toolbar">
    <div>
      <h2>{title}</h2>
      {subtitle && <p className="platform-subtitle">{subtitle}</p>}
    </div>
    {controls && <div className="platform-toolbar-controls">{controls}</div>}
  </div>
)

export const Breadcrumb = ({ items }) => (
  <nav className="breadcrumb">
    {items.map((item, i) => (
      <React.Fragment key={item.label}>
        {i > 0 && <span className="sep">›</span>}
        {item.onClick ? (
          <button type="button" className="link" onClick={item.onClick}>
            {item.label}
          </button>
        ) : (
          <span>{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
)

export const HealthTile = ({ label, status }) => (
  <div className="health-tile">
    <div className="label">{label}</div>
    <StatusBadge status={status} />
  </div>
)

export const IssueList = ({ issues }) => (
  <ul className="issue-list">
    {issues.map((issue, i) => (
      <li key={i}>
        <StatusDot status={issue.severity || issue.status} />
        <span>{issue.message}</span>
      </li>
    ))}
  </ul>
)

export const HEALTH_DIMENSIONS = [
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'yugabytedb', label: 'YugabyteDB' },
  { key: 'yba', label: 'YBA' },
  { key: 'security', label: 'Security' },
  { key: 'certificates', label: 'Certificates' },
  { key: 'monitoring', label: 'Monitoring' },
  { key: 'backup', label: 'Backup' },
  { key: 'compliance', label: 'Compliance' }
]

export { STATUS }
