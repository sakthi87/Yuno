import React from 'react'
import { CLOUDS, VM_AGENT_DEFINITIONS } from '../services/dataService'
import { StatusBadge } from './shared/PlatformUI'

const getAgentStatus = (vm, type) => {
  const agent = vm.vmAgents?.find((a) => a.type === type)
  return agent?.status || 'UNKNOWN'
}

const VmInventoryPanel = ({ vms, connected, total, onSelectVm }) => (
  <>
    <div className="platform-kpi-row">
      <div className="platform-kpi">
        <div className="platform-kpi-label">Total VMs</div>
        <div className="platform-kpi-value">{total}</div>
      </div>
      <div className="platform-kpi good">
        <div className="platform-kpi-label">Platform Agents Connected</div>
        <div className="platform-kpi-value">{connected}</div>
        <div className="platform-kpi-hint">{total ? `${((connected / total) * 100).toFixed(1)}%` : '—'}</div>
      </div>
      <div className="platform-kpi bad">
        <div className="platform-kpi-label">Disconnected</div>
        <div className="platform-kpi-value">{total - connected}</div>
      </div>
      <div className="platform-kpi">
        <div className="platform-kpi-label">Showing</div>
        <div className="platform-kpi-value">{vms.length}</div>
      </div>
    </div>

    <div className="platform-card">
      <h3>VM Inventory</h3>
      <p style={{ fontSize: '0.82rem', color: '#627d98', margin: '0 0 0.75rem' }}>
        Flat VM view — click a row to drill into node and agent details. Azure: Monitor, Tanium, Nessus, Datadog · AWS: CloudWatch, Tanium, Nessus, Datadog
      </p>
      <table className="platform-table">
        <thead>
          <tr>
            <th>Cloud</th>
            <th>Env</th>
            <th>Universe</th>
            <th>Node</th>
            <th>Instance ID</th>
            <th>OS</th>
            <th>Platform Agent</th>
            <th>VM Agents</th>
            <th>Monitor</th>
            <th>Tanium</th>
            <th>Nessus</th>
            <th>Datadog</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {vms.map((vm) => {
            const monitorType = vm.cloud === 'Azure' ? 'AZURE_MONITOR_AGENT' : 'CLOUDWATCH_AGENT'
            return (
              <tr
                key={vm.id}
                className={onSelectVm ? 'clickable' : ''}
                onClick={onSelectVm ? () => onSelectVm(vm) : undefined}
              >
                <td>{vm.cloud}</td>
                <td>{vm.environment}</td>
                <td>{vm.universe}</td>
                <td><strong>{vm.name}</strong></td>
                <td className="platform-mono" style={{ fontSize: '0.72rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{vm.vm?.instanceId}</td>
                <td>{vm.vm?.os}</td>
                <td>
                  <span className={`platform-pill ${vm.agentStatus === 'CONNECTED' ? 'ok' : 'bad'}`}>
                    {vm.agentStatus}
                  </span>
                </td>
                <td>{vm.vmAgentsSummary}</td>
                <td><StatusBadge status={getAgentStatus(vm, monitorType)} /></td>
                <td><StatusBadge status={getAgentStatus(vm, 'TANIUM_CLIENT')} /></td>
                <td><StatusBadge status={getAgentStatus(vm, 'NESSUS_AGENT')} /></td>
                <td><StatusBadge status={getAgentStatus(vm, 'DD_AGENT')} /></td>
                <td><StatusBadge status={vm.status} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>

    <div className="platform-grid-2" style={{ marginTop: '0.85rem' }}>
      {CLOUDS.map((c) => (
        <div key={c} className="platform-card compact">
          <h3>{c} — Expected VM Agents</h3>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', color: '#486581' }}>
            {(VM_AGENT_DEFINITIONS[c] || []).map((a) => (
              <li key={a.type}><strong>{a.label}</strong> <span className="platform-mono">({a.service})</span></li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </>
)

export default VmInventoryPanel
