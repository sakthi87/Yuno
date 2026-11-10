import React, { useMemo, useState } from 'react'
import {
  VULNERABILITIES,
  VULN_STATUS,
  STATUS,
  filterVulnerabilities,
  summarizeVulnerabilities,
  getUniverseFilterLabel,
  PATCH_JOBS
} from '../services/dataService'
import ContextFilterSelector from './ContextFilterSelector'
import { StatusBadge } from './shared/PlatformUI'

const VulnStatusPill = ({ status }) => {
  const tone =
    status === VULN_STATUS.REMEDIATED ? 'ok'
      : status === VULN_STATUS.IN_PROGRESS || status === VULN_STATUS.SCHEDULED ? 'warn'
        : 'bad'
  return <span className={`platform-pill ${tone}`}>{status.replace('_', ' ')}</span>
}

const VulnerabilitiesPanel = () => {
  const [cloud, setCloud] = useState('')
  const [env, setEnv] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(
    () => filterVulnerabilities(cloud || null, env || null, severityFilter || null, statusFilter || null),
    [cloud, env, severityFilter, statusFilter]
  )

  const allSummary = summarizeVulnerabilities(VULNERABILITIES)
  const filterLabel = getUniverseFilterLabel(cloud, env)

  const getPatchRef = (patchJobId) => {
    if (!patchJobId) return '—'
    const job = PATCH_JOBS.find((p) => p.id === patchJobId)
    return job ? job.title.split(' — ')[0] : patchJobId
  }

  return (
    <>
      <ContextFilterSelector
        cloud={cloud}
        onCloudChange={setCloud}
        environment={env}
        onEnvironmentChange={setEnv}
        summary={`${filterLabel} · ${filtered.length} CVE findings`}
        additionalRows={[
          {
            label: 'Severity',
            options: [
              { id: '', label: 'All' },
              { id: STATUS.CRITICAL, label: 'Critical' },
              { id: STATUS.WARNING, label: 'High/Warning' }
            ],
            value: severityFilter,
            onChange: setSeverityFilter
          },
          {
            label: 'Status',
            options: [
              { id: '', label: 'All' },
              { id: VULN_STATUS.OPEN, label: 'Open' },
              { id: VULN_STATUS.SCHEDULED, label: 'Scheduled' },
              { id: VULN_STATUS.IN_PROGRESS, label: 'In Progress' },
              { id: VULN_STATUS.REMEDIATED, label: 'Remediated' }
            ],
            value: statusFilter,
            onChange: setStatusFilter
          }
        ]}
      />

      <div className="platform-kpi-row fit">
        <div className="platform-kpi">
          <div className="platform-kpi-label">Total CVEs</div>
          <div className="platform-kpi-value">{allSummary.total}</div>
        </div>
        <div className="platform-kpi bad">
          <div className="platform-kpi-label">Critical Open</div>
          <div className="platform-kpi-value">{allSummary.critical}</div>
        </div>
        <div className="platform-kpi warn">
          <div className="platform-kpi-label">Open/Scheduled</div>
          <div className="platform-kpi-value">{allSummary.open}</div>
        </div>
        <div className="platform-kpi good">
          <div className="platform-kpi-label">Remediated</div>
          <div className="platform-kpi-value">{allSummary.remediated}</div>
        </div>
        <div className="platform-kpi">
          <div className="platform-kpi-label">Showing</div>
          <div className="platform-kpi-value">{filtered.length}</div>
        </div>
      </div>

      <div className="platform-banner" style={{ background: '#eef2f6', borderColor: '#bcccdc', marginBottom: '0.85rem' }}>
        Findings sourced from <strong>Nessus</strong> scans on YugabyteDB node VMs. Link to <strong>Patching</strong> sub-view for Tanium remediation jobs.
      </div>

      <div className="platform-card">
        <h3>Vulnerability Inventory (CVEs)</h3>
        <table className="platform-table">
          <thead>
            <tr>
              <th>CVE</th>
              <th>Severity</th>
              <th>Package</th>
              <th>Installed</th>
              <th>Fixed In</th>
              <th>Cloud</th>
              <th>Env</th>
              <th>Universe</th>
              <th>Node</th>
              <th>Status</th>
              <th>Source</th>
              <th>Patch Job</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id}>
                <td>
                  <strong>{v.cveId}</strong>
                  <div style={{ fontSize: '0.72rem', color: '#627d98', marginTop: 2 }}>{v.title}</div>
                </td>
                <td><StatusBadge status={v.severity} /></td>
                <td>{v.package}</td>
                <td className="platform-mono">{v.installedVersion}</td>
                <td className="platform-mono">{v.fixedVersion}</td>
                <td>{v.cloud}</td>
                <td>{v.environment}</td>
                <td>{v.universe}</td>
                <td>{v.node}</td>
                <td><VulnStatusPill status={v.status} /></td>
                <td>{v.source}</td>
                <td>{getPatchRef(v.patchJobId)}</td>
                <td>{new Date(v.lastSeen).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default VulnerabilitiesPanel
