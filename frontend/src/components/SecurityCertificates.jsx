import React, { useState } from 'react'
import { CERTIFICATES, STATUS } from '../services/dataService'
import { DemoBanner, PageHeader, StatusBadge } from './shared/PlatformUI'

const securityRows = [
  { cloud: 'AWS', universe: 'analytics-prod', node: 'node-01', tanium: 'CRITICAL', nessus: 'WARNING', monitor: 'HEALTHY', datadog: 'HEALTHY', taniumMsg: 'Not reporting — 42 min', nessusMsg: 'Service stopped' },
  { cloud: 'AWS', universe: 'payments-prod', node: 'node-02', tanium: 'WARNING', nessus: 'HEALTHY', monitor: 'HEALTHY', datadog: 'HEALTHY', taniumMsg: 'Version outdated', nessusMsg: 'Running' },
  { cloud: 'AWS', universe: 'payments-prod', node: 'node-01', tanium: 'HEALTHY', nessus: 'HEALTHY', monitor: 'HEALTHY', datadog: 'HEALTHY', taniumMsg: 'Connected', nessusMsg: 'Last scan 6h ago' },
  { cloud: 'Azure', universe: 'core-prod', node: 'node-02', tanium: 'HEALTHY', nessus: 'HEALTHY', monitor: 'HEALTHY', datadog: 'WARNING', taniumMsg: 'Connected', datadogMsg: 'Silent 15 min' },
  { cloud: 'Azure', universe: 'it-shared', node: 'node-02', tanium: 'HEALTHY', nessus: 'WARNING', monitor: 'HEALTHY', datadog: 'HEALTHY', nessusMsg: 'Last scan 9 days ago' },
  { cloud: 'Azure', universe: 'payments-uat', node: 'node-01', tanium: 'HEALTHY', nessus: 'HEALTHY', monitor: 'HEALTHY', datadog: 'HEALTHY', taniumMsg: 'Connected', nessusMsg: 'Last scan 2d ago' }
]

const SecurityCertificates = ({ embedded = false, initialSubView = 'certificates' }) => {
  const [subView, setSubView] = useState(initialSubView)
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = CERTIFICATES.filter((c) => !statusFilter || c.status === statusFilter)
  const critical = CERTIFICATES.filter((c) => c.status === STATUS.CRITICAL).length
  const warning = CERTIFICATES.filter((c) => c.status === STATUS.WARNING).length
  const expiring30 = CERTIFICATES.filter((c) => c.daysRemaining <= 30).length
  const activeView = embedded ? initialSubView : subView

  const content = (
    <>
      {!embedded && (
        <>
          <PageHeader title="Agents & Alerts" subtitle="Certificate inventory, VM agents, and compliance" />
          <DemoBanner />
          <div className="sub-nav">
            <button type="button" className={subView === 'certificates' ? 'active' : ''} onClick={() => setSubView('certificates')}>Certificates</button>
            <button type="button" className={subView === 'security' ? 'active' : ''} onClick={() => setSubView('security')}>VM Agents</button>
            <button type="button" className={subView === 'compliance' ? 'active' : ''} onClick={() => setSubView('compliance')}>Compliance</button>
          </div>
        </>
      )}

      {activeView === 'certificates' && (
        <>
          <div className="platform-kpi-row">
            <div className="platform-kpi">
              <div className="platform-kpi-label">Total Certificates</div>
              <div className="platform-kpi-value">{CERTIFICATES.length}</div>
            </div>
            <div className="platform-kpi warn">
              <div className="platform-kpi-label">Expiring &lt; 30 days</div>
              <div className="platform-kpi-value">{expiring30}</div>
            </div>
            <div className="platform-kpi warn">
              <div className="platform-kpi-label">Warning</div>
              <div className="platform-kpi-value">{warning}</div>
            </div>
            <div className="platform-kpi bad">
              <div className="platform-kpi-label">Critical</div>
              <div className="platform-kpi-value">{critical}</div>
            </div>
          </div>

          <div className="filter-bar">
            {['', STATUS.CRITICAL, STATUS.WARNING, STATUS.HEALTHY].map((s) => (
              <button
                key={s || 'all'}
                type="button"
                className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          <div className="platform-card">
            <h3>Certificate Inventory</h3>
            <table className="platform-table">
              <thead>
                <tr>
                  <th>Universe</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Issuer</th>
                  <th>Expires</th>
                  <th>Days Left</th>
                  <th>Owner</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.universe}</strong><br /><span style={{ fontSize: '0.75rem', color: '#829ab1' }}>{c.cloud} · {c.env}</span></td>
                    <td>{c.type}</td>
                    <td>{c.location}</td>
                    <td>{c.issuer}</td>
                    <td>{c.expires}</td>
                    <td>{c.daysRemaining}</td>
                    <td>{c.owner}</td>
                    <td><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeView === 'security' && (
        <div className="platform-card">
          <h3>VM Agent Status by Node</h3>
          <p style={{ fontSize: '0.82rem', color: '#627d98', margin: '0 0 0.75rem' }}>
            Cross-estate agent inventory — filter unhealthy rows to find Tanium/Datadog/Nessus issues.
          </p>
          <table className="platform-table">
            <thead>
              <tr>
                <th>Cloud</th>
                <th>Universe</th>
                <th>Node</th>
                <th>Monitor</th>
                <th>Tanium</th>
                <th>Nessus</th>
                <th>Datadog</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {securityRows.map((row, i) => (
                <tr key={i}>
                  <td>{row.cloud}</td>
                  <td>{row.universe}</td>
                  <td>{row.node}</td>
                  <td><StatusBadge status={row.monitor} /></td>
                  <td><StatusBadge status={row.tanium} /></td>
                  <td><StatusBadge status={row.nessus} /></td>
                  <td><StatusBadge status={row.datadog} /></td>
                  <td style={{ fontSize: '0.78rem', color: '#627d98' }}>
                    {[row.taniumMsg, row.nessusMsg, row.datadogMsg].filter(Boolean).join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeView === 'compliance' && (
        <div className="platform-grid-2">
          <div className="platform-card">
            <h3>Compliance by Environment</h3>
            <table className="platform-table">
              <thead>
                <tr><th>Environment</th><th>Compliant</th><th>Warnings</th><th>Non-Compliant</th></tr>
              </thead>
              <tbody>
                <tr><td>DEV</td><td>6</td><td>0</td><td>0</td></tr>
                <tr><td>IT</td><td>3</td><td>1</td><td>0</td></tr>
                <tr><td>UAT</td><td>4</td><td>0</td><td>0</td></tr>
                <tr><td>PROD</td><td>12</td><td>2</td><td>1</td></tr>
              </tbody>
            </table>
          </div>
          <div className="platform-card">
            <h3>Policy Checks</h3>
            <table className="platform-table">
              <tbody>
                <tr><td>OS Hardening Baseline</td><td><StatusBadge status="WARNING" /></td></tr>
                <tr><td>Firewall Rules</td><td><StatusBadge status="HEALTHY" /></td></tr>
                <tr><td>Endpoint Protection</td><td><StatusBadge status="HEALTHY" /></td></tr>
                <tr><td>TLS Enabled</td><td><StatusBadge status="HEALTHY" /></td></tr>
                <tr><td>Encryption at Rest</td><td><StatusBadge status="HEALTHY" /></td></tr>
                <tr><td>Security Agent Required</td><td><StatusBadge status="CRITICAL" /></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )

  if (embedded) return content

  return <div className="platform-page">{content}</div>
}

export default SecurityCertificates
