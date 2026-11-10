import React from 'react'
import {
  UNIVERSES,
  getUniverseMetrics,
  getMetricStatus,
  getUniverseMetricsOverallStatus,
  summarizeUniverseMetrics
} from '../services/dataService'
import { StatusBadge } from './shared/PlatformUI'

const formatOps = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

const MetricCell = ({ metricKey, value, suffix = '' }) => (
  <>
    <StatusBadge status={getMetricStatus(metricKey, value)} />{' '}
    {value}{suffix}
  </>
)

const UniverseMetricsPanel = ({ universes, total = UNIVERSES.length, onSelectUniverse }) => {
  const summary = summarizeUniverseMetrics(universes)

  return (
    <>
      <div className="platform-kpi-row">
        <div className="platform-kpi">
          <div className="platform-kpi-label">Total Universes</div>
          <div className="platform-kpi-value">{total}</div>
        </div>
        <div className="platform-kpi good">
          <div className="platform-kpi-label">Metrics Healthy</div>
          <div className="platform-kpi-value">{summary.healthy}</div>
        </div>
        <div className="platform-kpi warn">
          <div className="platform-kpi-label">Warning</div>
          <div className="platform-kpi-value">{summary.warning}</div>
        </div>
        <div className="platform-kpi bad">
          <div className="platform-kpi-label">Critical</div>
          <div className="platform-kpi-value">{summary.critical}</div>
        </div>
        <div className="platform-kpi">
          <div className="platform-kpi-label">Showing</div>
          <div className="platform-kpi-value">{universes.length}</div>
        </div>
      </div>

      <div className="platform-card">
        <h3>Universe Metrics</h3>
        <p style={{ fontSize: '0.82rem', color: '#627d98', margin: '0 0 0.75rem' }}>
          Flat universe view — YugabyteDB throughput, latency, tablet health, and node resource averages from YBA / Prometheus collectors.
        </p>
        <table className="platform-table">
          <thead>
            <tr>
              <th>Universe</th>
              <th>Cloud</th>
              <th>Env</th>
              <th>Read OPS</th>
              <th>Write OPS</th>
              <th>Read Lat</th>
              <th>Write Lat</th>
              <th>Connections</th>
              <th>Tablets</th>
              <th>Unhealthy</th>
              <th>CPU Avg</th>
              <th>Mem Avg</th>
              <th>Disk</th>
              <th>Repl Lag</th>
              <th>Metrics</th>
            </tr>
          </thead>
          <tbody>
            {universes.map((u) => {
              const m = getUniverseMetrics(u.id)
              const rowClass = onSelectUniverse ? 'clickable' : ''
              return (
                <tr
                  key={u.id}
                  className={rowClass}
                  onClick={onSelectUniverse ? () => onSelectUniverse(u.id) : undefined}
                >
                  <td><strong>{u.name}</strong></td>
                  <td>{u.cloud}</td>
                  <td>{u.environment}</td>
                  <td>{formatOps(m.readOpsPerSec)}</td>
                  <td>{formatOps(m.writeOpsPerSec)}</td>
                  <td><MetricCell metricKey="avgReadLatencyMs" value={m.avgReadLatencyMs} suffix=" ms" /></td>
                  <td><MetricCell metricKey="avgWriteLatencyMs" value={m.avgWriteLatencyMs} suffix=" ms" /></td>
                  <td><MetricCell metricKey="activeConnections" value={m.activeConnections} /></td>
                  <td>{m.tabletsTotal}</td>
                  <td><MetricCell metricKey="tabletsUnhealthy" value={m.tabletsUnhealthy} /></td>
                  <td><MetricCell metricKey="cpuAvgPct" value={m.cpuAvgPct} suffix="%" /></td>
                  <td><MetricCell metricKey="memoryAvgPct" value={m.memoryAvgPct} suffix="%" /></td>
                  <td><MetricCell metricKey="diskUsedPct" value={m.diskUsedPct} suffix="%" /></td>
                  <td><MetricCell metricKey="replicationLagMs" value={m.replicationLagMs} suffix=" ms" /></td>
                  <td><StatusBadge status={getUniverseMetricsOverallStatus(u.id)} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

export const UniverseMetricsDetail = ({ universeId }) => {
  const m = getUniverseMetrics(universeId)

  return (
    <div className="platform-grid-2" style={{ marginBottom: '1rem' }}>
      <div className="platform-card">
        <h3>Universe Metrics</h3>
        <table className="platform-table">
          <tbody>
            <tr><td>Read OPS</td><td>{formatOps(m.readOpsPerSec)}/s</td></tr>
            <tr><td>Write OPS</td><td>{formatOps(m.writeOpsPerSec)}/s</td></tr>
            <tr>
              <td>Avg Read Latency</td>
              <td><MetricCell metricKey="avgReadLatencyMs" value={m.avgReadLatencyMs} suffix=" ms" /></td>
            </tr>
            <tr>
              <td>Avg Write Latency</td>
              <td><MetricCell metricKey="avgWriteLatencyMs" value={m.avgWriteLatencyMs} suffix=" ms" /></td>
            </tr>
            <tr>
              <td>Active Connections</td>
              <td><MetricCell metricKey="activeConnections" value={m.activeConnections} /></td>
            </tr>
            <tr><td>Tablets (total)</td><td>{m.tabletsTotal}</td></tr>
            <tr>
              <td>Unhealthy Tablets</td>
              <td><MetricCell metricKey="tabletsUnhealthy" value={m.tabletsUnhealthy} /></td>
            </tr>
            <tr>
              <td>Under-replicated</td>
              <td><MetricCell metricKey="underReplicated" value={m.underReplicated} /></td>
            </tr>
            <tr>
              <td>Leaderless Tablets</td>
              <td><MetricCell metricKey="leaderlessTablets" value={m.leaderlessTablets} /></td>
            </tr>
            <tr>
              <td>Replication Lag</td>
              <td><MetricCell metricKey="replicationLagMs" value={m.replicationLagMs} suffix=" ms" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="platform-card">
        <h3>Node Resource Averages</h3>
        <table className="platform-table">
          <tbody>
            <tr>
              <td>CPU (avg)</td>
              <td><MetricCell metricKey="cpuAvgPct" value={m.cpuAvgPct} suffix="%" /></td>
            </tr>
            <tr>
              <td>Memory (avg)</td>
              <td><MetricCell metricKey="memoryAvgPct" value={m.memoryAvgPct} suffix="%" /></td>
            </tr>
            <tr>
              <td>Disk Used (avg)</td>
              <td><MetricCell metricKey="diskUsedPct" value={m.diskUsedPct} suffix="%" /></td>
            </tr>
            <tr>
              <td>Overall Metrics</td>
              <td><StatusBadge status={getUniverseMetricsOverallStatus(universeId)} /></td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: '0.78rem', color: '#627d98', margin: '0.75rem 0 0' }}>
          Aggregated across all nodes in the universe. Thresholds align with VM resource alerts on individual nodes.
        </p>
      </div>
    </div>
  )
}

export default UniverseMetricsPanel
