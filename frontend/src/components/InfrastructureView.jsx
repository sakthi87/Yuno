import React, { useState } from 'react'
import { INFRASTRUCTURE, CLOUDS, ENVIRONMENTS, VM_AGENT_DEFINITIONS, getUniverseFilterLabel } from '../services/dataService'
import { DemoBanner, PageHeader, StatusBadge } from './shared/PlatformUI'
import ContextFilterSelector from './ContextFilterSelector'

const getAgentStatus = (vm, type) => {
  const agent = vm.vmAgents?.find((a) => a.type === type)
  return agent?.status || 'UNKNOWN'
}

const InfrastructureView = () => {
  const [cloud, setCloud] = useState('')
  const [env, setEnv] = useState('')
  const [agentFilter, setAgentFilter] = useState('')

  const filtered = INFRASTRUCTURE.filter((vm) => {
    if (cloud && vm.cloud !== cloud) return false
    if (env && vm.environment !== env) return false
    if (agentFilter && vm.agentStatus !== agentFilter) return false
    return true
  })

  const connected = INFRASTRUCTURE.filter((v) => v.agentStatus === 'CONNECTED').length

  return (
    <div className="platform-page">
      <PageHeader
        title="Infrastructure"
        subtitle="VM inventory, platform agents, Azure/AWS VM services (Monitor, Tanium, Nessus, Datadog)"
      />
      <DemoBanner />

      <ContextFilterSelector
        cloud={cloud}
        onCloudChange={setCloud}
        environment={env}
        onEnvironmentChange={setEnv}
        summary={`${getUniverseFilterLabel(cloud, env)} · ${filtered.length} VMs`}
        additionalRows={[
          {
            label: 'Platform Agent',
            options: [
              { id: '', label: 'All' },
              { id: 'CONNECTED', label: 'Connected' },
              { id: 'DISCONNECTED', label: 'Disconnected' }
            ],
            value: agentFilter,
            onChange: setAgentFilter
          }
        ]}
      />

      <div className="platform-kpi-row">
        <div className="platform-kpi">
          <div className="platform-kpi-label">Total VMs</div>
          <div className="platform-kpi-value">{INFRASTRUCTURE.length}</div>
        </div>
        <div className="platform-kpi good">
          <div className="platform-kpi-label">Agents Connected</div>
          <div className="platform-kpi-value">{connected}</div>
          <div className="platform-kpi-hint">{((connected / INFRASTRUCTURE.length) * 100).toFixed(1)}%</div>
        </div>
        <div className="platform-kpi bad">
          <div className="platform-kpi-label">Disconnected</div>
          <div className="platform-kpi-value">{INFRASTRUCTURE.length - connected}</div>
        </div>
        <div className="platform-kpi">
          <div className="platform-kpi-label">Showing</div>
          <div className="platform-kpi-value">{filtered.length}</div>
        </div>
      </div>

      <div className="platform-card">
        <h3>VM Inventory</h3>
        <p style={{ fontSize: '0.82rem', color: '#627d98', margin: '0 0 0.75rem' }}>
          Azure VMs: Azure Monitor Agent, Tanium Client, Nessus Agent, dd-agent (Datadog) ·
          AWS VMs: CloudWatch Agent, Tanium, Nessus, Datadog
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
              <th title="Monitor agent">Monitor</th>
              <th title="Tanium Client">Tanium</th>
              <th title="Nessus Agent">Nessus</th>
              <th title="Datadog dd-agent">Datadog</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((vm) => {
              const monitorType = vm.cloud === 'Azure' ? 'AZURE_MONITOR_AGENT' : 'CLOUDWATCH_AGENT'
              return (
                <tr key={vm.id}>
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
        {(CLOUDS).map((c) => (
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
    </div>
  )
}

export default InfrastructureView
