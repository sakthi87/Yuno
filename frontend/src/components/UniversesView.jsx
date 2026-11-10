import React, { useState, useMemo, useEffect } from 'react'
import {
  filterUniverses,
  getUniverseById,
  getNodesForUniverse,
  getNodeById,
  getUniverseFilterLabel,
  getVmAgentLabel,
  VM_AGENT_DEFINITIONS,
  INFRASTRUCTURE,
  UNIVERSES
} from '../services/dataService'
import ContextFilterSelector from './ContextFilterSelector'
import VmInventoryPanel from './VmInventoryPanel'
import UniverseInventoryPanel from './UniverseInventoryPanel'
import { UniverseMetricsDetail } from './UniverseMetricsPanel'
import {
  DemoBanner,
  PageHeader,
  Breadcrumb,
  StatusBadge,
  HealthTile,
  IssueList,
  HEALTH_DIMENSIONS
} from './shared/PlatformUI'

const UniverseDetail = ({ universe, listLabel = 'Universes', onBack, onSelectNode }) => {
  const nodes = getNodesForUniverse(universe.id)

  return (
    <>
      <Breadcrumb
        items={[
          { label: listLabel, onClick: onBack },
          { label: universe.name }
        ]}
      />
      <div className="detail-header">
        <div>
          <h2>{universe.name}</h2>
          <div className="detail-meta">
            <span className="platform-pill">{universe.cloud}</span>
            <span className="platform-pill">{universe.environment}</span>
            <span className="platform-pill">{universe.region}</span>
            <span>Owner: {universe.owner}</span>
            <span>YB {universe.ybVersion}</span>
          </div>
        </div>
        <div className="action-bar">
          <StatusBadge status={universe.status} />
          <button type="button" className="btn btn-sm">Remediate</button>
          <button type="button" className="btn btn-sm">Upgrade</button>
          <button type="button" className="btn btn-sm">Scale</button>
        </div>
      </div>

      <div className="health-grid">
        {HEALTH_DIMENSIONS.map((d) => (
          <HealthTile key={d.key} label={d.label} status={universe.health[d.key]} />
        ))}
      </div>

      <UniverseMetricsDetail universeId={universe.id} />

      {universe.issues.length > 0 && (
        <div className="platform-card compact" style={{ marginBottom: '1rem' }}>
          <h3>Issues</h3>
          <IssueList issues={universe.issues} />
        </div>
      )}

      <div className="platform-grid-2">
        <div className="platform-card">
          <h3>Nodes</h3>
          <table className="platform-table">
            <thead>
              <tr>
                <th>Node</th>
                <th>Role</th>
                <th>Private IP</th>
                <th>AZ</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <tr
                  key={node.id}
                  className="clickable"
                  onClick={() => onSelectNode(node.id)}
                >
                  <td><strong>{node.name}</strong></td>
                  <td>{node.role}</td>
                  <td>{node.privateIp}</td>
                  <td>{node.az}</td>
                  <td><StatusBadge status={node.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="platform-card">
          <h3>YBA</h3>
          <table className="platform-table">
            <tbody>
              <tr><td>Instance</td><td>yba-{universe.environment.toLowerCase()}-01</td></tr>
              <tr><td>Version</td><td>2.25.1.0</td></tr>
              <tr><td>Connectivity</td><td><StatusBadge status={universe.health.yba} /></td></tr>
              <tr><td>Universes Managed</td><td>12</td></tr>
              <tr><td>Last Sync</td><td>2 minutes ago</td></tr>
            </tbody>
          </table>
          <h3 style={{ marginTop: '1rem' }}>Services</h3>
          <table className="platform-table">
            <tbody>
              <tr><td>Platform Agent</td><td><StatusBadge status="HEALTHY" /></td></tr>
              <tr><td>Monitoring</td><td><StatusBadge status={universe.health.monitoring} /></td></tr>
              <tr><td>Backup</td><td><StatusBadge status={universe.health.backup} /></td></tr>
              <tr><td>Logging</td><td><StatusBadge status="HEALTHY" /></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

const ComponentTable = ({ components, title }) => {
  if (!components?.length) return null
  return (
    <div className="platform-card" style={{ marginBottom: '0.85rem' }}>
      <h3>{title}</h3>
      <table className="platform-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Service</th>
            <th>Version</th>
            <th>Status</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {components.map((c) => (
            <tr key={c.type}>
              <td><strong>{c.label || getVmAgentLabel(c.type)}</strong></td>
              <td className="platform-mono">{c.service || '—'}</td>
              <td>{c.version}</td>
              <td><StatusBadge status={c.status} /></td>
              <td>{c.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const NodeDetail = ({ universe, node, listLabel = 'Universes', onBack, onBackToUniverse }) => {
  const ybComponents = (node.components || []).filter((c) => c.category === 'YUGABYTE' || c.type.startsWith('YB_'))
  const platformComponents = (node.components || []).filter((c) => c.category === 'PLATFORM')
  const vmAgents = (node.components || []).filter((c) => c.category === 'VM_AGENT')
  const otherComponents = (node.components || []).filter(
    (c) => !ybComponents.includes(c) && !platformComponents.includes(c) && !vmAgents.includes(c)
  )
  const agentDefs = VM_AGENT_DEFINITIONS[universe.cloud] || []

  return (
    <>
      <Breadcrumb
        items={[
          { label: listLabel, onClick: onBack },
          { label: universe.name, onClick: onBackToUniverse },
          { label: node.name }
        ]}
      />
      <div className="detail-header">
        <div>
          <h2>{node.name}</h2>
          <div className="detail-meta">
            <span>{universe.name}</span>
            <span>{node.privateIp}</span>
            <span>{node.role}</span>
            <span>{node.az}</span>
          </div>
        </div>
        <div className="action-bar">
          <StatusBadge status={node.status} />
          <button type="button" className="btn btn-sm btn-primary">Restart Agent</button>
          <button type="button" className="btn btn-sm">View Logs</button>
          <button type="button" className="btn btn-sm">Create Incident</button>
        </div>
      </div>

      <div className="platform-card compact" style={{ marginBottom: '1rem' }}>
        <h3>Expected VM Agents ({universe.cloud})</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {agentDefs.map((a) => (
            <span key={a.type} className="platform-pill">{a.label}</span>
          ))}
        </div>
      </div>

      <div className="platform-grid-2">
        <div className="platform-card">
          <h3>VM Details</h3>
          <table className="platform-table">
            <tbody>
              <tr><td>Cloud</td><td>{universe.cloud}</td></tr>
              <tr><td>Instance ID</td><td className="platform-mono">{node.vm?.instanceId}</td></tr>
              <tr><td>Instance Type</td><td>{node.vm?.type}</td></tr>
              <tr><td>OS</td><td>{node.vm?.os}</td></tr>
              <tr><td>CPU</td><td><StatusBadge status="HEALTHY" /> 42%</td></tr>
              <tr><td>Memory</td><td><StatusBadge status="HEALTHY" /> 68%</td></tr>
              <tr><td>Disk</td><td><StatusBadge status="HEALTHY" /> 54% used</td></tr>
            </tbody>
          </table>
        </div>

        <div className="platform-card">
          <h3>VM Agent Summary</h3>
          <table className="platform-table">
            <thead>
              <tr><th>Agent</th><th>Status</th></tr>
            </thead>
            <tbody>
              {vmAgents.map((a) => (
                <tr key={a.type}>
                  <td>{a.label}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ComponentTable components={ybComponents} title="YugabyteDB Processes" />
      <ComponentTable components={platformComponents} title="Platform Agent" />
      <ComponentTable components={vmAgents} title={`VM Agents & Services (${universe.cloud})`} />
      <ComponentTable components={otherComponents} title="Other" />
    </>
  )
}

const UniversesView = ({ initialFilter, initialUniverseId, initialNodeId, onClearNav }) => {
  const [viewMode, setViewMode] = useState('universes')
  const [cloud, setCloud] = useState(initialFilter?.cloud || '')
  const [env, setEnv] = useState(initialFilter?.env || '')
  const [agentFilter, setAgentFilter] = useState('')
  const [selectedId, setSelectedId] = useState(initialUniverseId || null)
  const [selectedNodeId, setSelectedNodeId] = useState(initialNodeId || null)
  const [drillSource, setDrillSource] = useState(() => {
    if (initialUniverseId) return 'universes'
    if (initialNodeId) return 'vms'
    return null
  })

  useEffect(() => {
    if (initialFilter?.cloud) setCloud(initialFilter.cloud)
    if (initialFilter?.env) setEnv(initialFilter.env)
  }, [initialFilter])

  const universes = useMemo(
    () => filterUniverses(cloud || null, env || null),
    [cloud, env]
  )

  const filterLabel = getUniverseFilterLabel(cloud, env)
  const filteredVms = INFRASTRUCTURE.filter((vm) => {
    if (cloud && vm.cloud !== cloud) return false
    if (env && vm.environment !== env) return false
    if (agentFilter && vm.agentStatus !== agentFilter) return false
    return true
  })
  const connectedAgents = INFRASTRUCTURE.filter((v) => v.agentStatus === 'CONNECTED').length
  const selectedUniverse = selectedId ? getUniverseById(selectedId) : null
  const selectedNode =
    selectedUniverse && selectedNodeId
      ? getNodeById(selectedUniverse.id, selectedNodeId)
      : null

  const listLabel = drillSource === 'vms' ? 'VMs' : 'Universes'

  const handleBack = () => {
    const returnToVms = drillSource === 'vms'
    setSelectedId(null)
    setSelectedNodeId(null)
    setDrillSource(null)
    if (returnToVms) setViewMode('vms')
    onClearNav?.()
  }

  const handleSelectUniverse = (universeId) => {
    setDrillSource('universes')
    setSelectedId(universeId)
    setSelectedNodeId(null)
  }

  const handleSelectVm = (vm) => {
    setDrillSource('vms')
    setViewMode('vms')
    setSelectedId(vm.universeId)
    setSelectedNodeId(vm.id)
  }

  if (selectedUniverse && selectedNode) {
    return (
      <div className="platform-page">
        <DemoBanner />
        <NodeDetail
          universe={selectedUniverse}
          node={selectedNode}
          listLabel={listLabel}
          onBack={handleBack}
          onBackToUniverse={() => setSelectedNodeId(null)}
        />
      </div>
    )
  }

  if (selectedUniverse) {
    return (
      <div className="platform-page">
        <DemoBanner />
        <UniverseDetail
          universe={selectedUniverse}
          listLabel={listLabel}
          onBack={handleBack}
          onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
        />
      </div>
    )
  }

  return (
    <div className="platform-page">
      <PageHeader
        title="Universes & Infrastructure"
        subtitle="Universe drill-down and flat VM inventory"
      />
      <DemoBanner />

      <div className="sub-nav">
        <button type="button" className={viewMode === 'universes' ? 'active' : ''} onClick={() => setViewMode('universes')}>
          Universes
        </button>
        <button type="button" className={viewMode === 'vms' ? 'active' : ''} onClick={() => setViewMode('vms')}>
          VMs
        </button>
      </div>

      <ContextFilterSelector
        cloud={cloud}
        onCloudChange={setCloud}
        environment={env}
        onEnvironmentChange={setEnv}
        summary={
          viewMode === 'universes'
            ? `${filterLabel} · ${universes.length} universes`
            : `${filterLabel} · ${filteredVms.length} VMs`
        }
        additionalRows={
          viewMode === 'vms'
            ? [{
              label: 'Platform Agent',
              options: [
                { id: '', label: 'All' },
                { id: 'CONNECTED', label: 'Connected' },
                { id: 'DISCONNECTED', label: 'Disconnected' }
              ],
              value: agentFilter,
              onChange: setAgentFilter
            }]
            : []
        }
      />

      {viewMode === 'universes' ? (
        <UniverseInventoryPanel
          universes={universes}
          total={UNIVERSES.length}
          onSelectUniverse={handleSelectUniverse}
        />
      ) : (
        <VmInventoryPanel
          vms={filteredVms}
          connected={connectedAgents}
          total={INFRASTRUCTURE.length}
          onSelectVm={handleSelectVm}
        />
      )}
    </div>
  )
}

export default UniversesView
