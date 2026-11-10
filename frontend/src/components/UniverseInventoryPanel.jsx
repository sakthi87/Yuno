import React from 'react'
import {
  UNIVERSES,
  getUniverseMetricsOverallStatus,
  summarizeUniverseMetrics
} from '../services/dataService'
import { StatusBadge } from './shared/PlatformUI'

const UniverseInventoryPanel = ({ universes, total = UNIVERSES.length, onSelectUniverse }) => {
  const allSummary = summarizeUniverseMetrics(UNIVERSES)
  const atRisk = allSummary.warning + allSummary.critical
  const healthyPct = total ? ((allSummary.healthy / total) * 100).toFixed(1) : '—'

  return (
    <>
      <div className="platform-kpi-row">
        <div className="platform-kpi">
          <div className="platform-kpi-label">Total Universes</div>
          <div className="platform-kpi-value">{total}</div>
        </div>
        <div className="platform-kpi good">
          <div className="platform-kpi-label">Metrics Healthy</div>
          <div className="platform-kpi-value">{allSummary.healthy}</div>
          <div className="platform-kpi-hint">{healthyPct}%</div>
        </div>
        <div className="platform-kpi bad">
          <div className="platform-kpi-label">Metrics At Risk</div>
          <div className="platform-kpi-value">{atRisk}</div>
        </div>
        <div className="platform-kpi">
          <div className="platform-kpi-label">Showing</div>
          <div className="platform-kpi-value">{universes.length}</div>
        </div>
      </div>

      <div className="platform-card">
        <h3>Universe Inventory</h3>
        <table className="platform-table">
          <thead>
            <tr>
              <th>Universe</th>
              <th>Cloud</th>
              <th>Environment</th>
              <th>Region</th>
              <th>YB Version</th>
              <th>Nodes</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Metrics</th>
            </tr>
          </thead>
          <tbody>
            {universes.map((u) => (
              <tr
                key={u.id}
                className="clickable"
                onClick={() => onSelectUniverse(u.id)}
              >
                <td><strong>{u.name}</strong></td>
                <td>{u.cloud}</td>
                <td>{u.environment}</td>
                <td>{u.region}</td>
                <td>{u.ybVersion}</td>
                <td>{u.nodes.length}</td>
                <td>{u.owner}</td>
                <td><StatusBadge status={u.status} /></td>
                <td><StatusBadge status={getUniverseMetricsOverallStatus(u.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default UniverseInventoryPanel
