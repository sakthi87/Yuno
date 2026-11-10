import React, { useState } from 'react'
import AlertsCompliance from './AlertsCompliance'
import SecurityCertificates from './SecurityCertificates'
import VulnerabilitiesPanel from './VulnerabilitiesPanel'
import PatchingPanel from './PatchingPanel'
import { DemoBanner, PageHeader } from './shared/PlatformUI'

/**
 * Agents + Alerts — exceptions, CVEs, patching, and agent/cert inventory.
 */
const AgentsAlertsView = () => {
  const [subView, setSubView] = useState('alerts')

  return (
    <div className="platform-page">
      <PageHeader
        title="Agents & Alerts"
        subtitle="Alerts, drift, CVE vulnerabilities, Tanium patching, VM agents, and certificates"
      />
      <DemoBanner />

      <div className="sub-nav">
        <button type="button" className={subView === 'alerts' ? 'active' : ''} onClick={() => setSubView('alerts')}>
          Alerts
        </button>
        <button type="button" className={subView === 'drift' ? 'active' : ''} onClick={() => setSubView('drift')}>
          Drift
        </button>
        <button type="button" className={subView === 'vulnerabilities' ? 'active' : ''} onClick={() => setSubView('vulnerabilities')}>
          Vulnerabilities
        </button>
        <button type="button" className={subView === 'patching' ? 'active' : ''} onClick={() => setSubView('patching')}>
          Patching
        </button>
        <button type="button" className={subView === 'agents' ? 'active' : ''} onClick={() => setSubView('agents')}>
          VM Agents
        </button>
        <button type="button" className={subView === 'certificates' ? 'active' : ''} onClick={() => setSubView('certificates')}>
          Certificates
        </button>
      </div>

      {subView === 'alerts' && <AlertsCompliance embedded initialSubView="alerts" />}
      {subView === 'drift' && <AlertsCompliance embedded initialSubView="drift" />}
      {subView === 'vulnerabilities' && <VulnerabilitiesPanel />}
      {subView === 'patching' && <PatchingPanel />}
      {subView === 'agents' && <SecurityCertificates embedded initialSubView="security" />}
      {subView === 'certificates' && <SecurityCertificates embedded initialSubView="certificates" />}
    </div>
  )
}

export default AgentsAlertsView
