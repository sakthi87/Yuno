import React, { useMemo, useState } from 'react'
import {
  PATCH_JOBS,
  PATCH_STATUS,
  filterPatchJobs,
  summarizePatchJobs,
  getUniverseFilterLabel
} from '../services/dataService'
import ContextFilterSelector from './ContextFilterSelector'

const PatchStatusPill = ({ status }) => {
  const tone =
    status === PATCH_STATUS.COMPLETED ? 'ok'
      : status === PATCH_STATUS.FAILED ? 'bad'
        : status === PATCH_STATUS.IN_PROGRESS ? 'warn'
          : 'warn'
  return <span className={`platform-pill ${tone}`}>{status.replace('_', ' ')}</span>
}

const PatchingPanel = () => {
  const [cloud, setCloud] = useState('')
  const [env, setEnv] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(
    () => filterPatchJobs(cloud || null, env || null, statusFilter || null),
    [cloud, env, statusFilter]
  )

  const allSummary = summarizePatchJobs(PATCH_JOBS)
  const filterLabel = getUniverseFilterLabel(cloud, env)

  return (
    <>
      <ContextFilterSelector
        cloud={cloud}
        onCloudChange={setCloud}
        environment={env}
        onEnvironmentChange={setEnv}
        summary={`${filterLabel} · ${filtered.length} patch jobs`}
        additionalRows={[
          {
            label: 'Status',
            options: [
              { id: '', label: 'All' },
              { id: PATCH_STATUS.SCHEDULED, label: 'Scheduled' },
              { id: PATCH_STATUS.IN_PROGRESS, label: 'In Progress' },
              { id: PATCH_STATUS.COMPLETED, label: 'Completed' },
              { id: PATCH_STATUS.FAILED, label: 'Failed' }
            ],
            value: statusFilter,
            onChange: setStatusFilter
          }
        ]}
      />

      <div className="platform-kpi-row six">
        <div className="platform-kpi">
          <div className="platform-kpi-label">Total Jobs</div>
          <div className="platform-kpi-value">{allSummary.total}</div>
        </div>
        <div className="platform-kpi warn">
          <div className="platform-kpi-label">Scheduled</div>
          <div className="platform-kpi-value">{allSummary.scheduled}</div>
        </div>
        <div className="platform-kpi warn">
          <div className="platform-kpi-label">In Progress</div>
          <div className="platform-kpi-value">{allSummary.inProgress}</div>
        </div>
        <div className="platform-kpi good">
          <div className="platform-kpi-label">Completed</div>
          <div className="platform-kpi-value">{allSummary.completed}</div>
        </div>
        <div className="platform-kpi bad">
          <div className="platform-kpi-label">Failed</div>
          <div className="platform-kpi-value">{allSummary.failed}</div>
        </div>
        <div className="platform-kpi">
          <div className="platform-kpi-label">Showing</div>
          <div className="platform-kpi-value">{filtered.length}</div>
        </div>
      </div>

      <div className="platform-banner" style={{ background: '#eef2f6', borderColor: '#bcccdc', marginBottom: '0.85rem' }}>
        Remediation executed via <strong>Tanium</strong> during approved maintenance windows. Jobs map to CVEs in the Vulnerabilities sub-view.
      </div>

      <div className="platform-card">
        <h3>Patch Jobs</h3>
        <table className="platform-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>CVEs</th>
              <th>Cloud</th>
              <th>Env</th>
              <th>Universe</th>
              <th>Nodes</th>
              <th>Tool</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Window</th>
              <th>Scheduled</th>
              <th>Owner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((job) => (
              <tr key={job.id}>
                <td>
                  <strong>{job.title}</strong>
                  {job.failureReason && (
                    <div style={{ fontSize: '0.72rem', color: '#9b1c1c', marginTop: 2 }}>{job.failureReason}</div>
                  )}
                </td>
                <td className="platform-mono" style={{ fontSize: '0.72rem' }}>
                  {job.cveIds.length ? job.cveIds.join(', ') : '—'}
                </td>
                <td>{job.cloud}</td>
                <td>{job.environment}</td>
                <td>{job.universe}</td>
                <td>{job.nodes.join(', ')}</td>
                <td>{job.tool}</td>
                <td><PatchStatusPill status={job.status} /></td>
                <td>
                  {job.status === PATCH_STATUS.IN_PROGRESS ? (
                    <span>{job.progress}%</span>
                  ) : job.status === PATCH_STATUS.COMPLETED ? (
                    <span className="platform-pill ok">100%</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{job.maintenanceWindow}</td>
                <td>{new Date(job.scheduledFor).toLocaleString()}</td>
                <td>{job.owner}</td>
                <td>
                  {job.status === PATCH_STATUS.SCHEDULED && (
                    <button type="button" className="btn btn-sm btn-primary">Run Now</button>
                  )}
                  {job.status === PATCH_STATUS.FAILED && (
                    <button type="button" className="btn btn-sm">Retry</button>
                  )}
                  {job.status === PATCH_STATUS.IN_PROGRESS && (
                    <button type="button" className="btn btn-sm">View Logs</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default PatchingPanel
