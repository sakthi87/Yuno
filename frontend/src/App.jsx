import React, { useState, useEffect } from 'react'
import Tabs from './components/Tabs'
import Settings from './components/Settings'
import OverviewDashboard from './components/OverviewDashboard'
import UniversesView from './components/UniversesView'
import AgentsAlertsView from './components/AgentsAlertsView'
import ProvisionWizard from './components/ProvisionWizard'
import FinanceView from './components/FinanceView'
import SetupWizard from './components/SetupWizard'
import AgentFleet from './components/AgentFleet'
import { getSessionUser, clearSession } from './services/authService'
import { getSetupState, GLOBAL_KPIS } from './services/dataService'
import './App.css'

const ROLES = [
  { id: 'admin', label: 'Platform Admin' },
  { id: 'dba', label: 'DBA' },
  { id: 'viewer', label: 'Viewer' },
  { id: 'developer', label: 'Developer' },
  { id: 'operations', label: 'Operations' },
  { id: 'security', label: 'Security' }
]

const LEGACY_TABS = {
  infrastructure: 'universes',
  security: 'agents',
  alerts: 'agents',
  platform: 'overview',
  audit: 'overview'
}

function normalizeTab(tab) {
  return LEGACY_TABS[tab] || tab
}

const SETTINGS_ROLES = new Set(['admin', 'dba', 'security'])

function App({ dataSource = 'mock', user: initialUser }) {
  const sessionUser = initialUser || getSessionUser()
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return normalizeTab(params.get('tab') || 'overview')
  })
  const [role, setRole] = useState(sessionUser?.role || 'admin')
  const [navState, setNavState] = useState({})
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState('health')
  const [showWizard, setShowWizard] = useState(() => {
    const setup = getSetupState()
    if (setup?.completed) return false
    if ((GLOBAL_KPIS?.totalUniverses || 0) > 0) return false
    return setup?.completed === false
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab')) {
      setActiveTab(normalizeTab(params.get('tab')))
    }
    const legacyTab = params.get('tab')
    if (legacyTab === 'platform' || legacyTab === 'audit') {
      setSettingsSection(legacyTab === 'audit' ? 'audit' : 'health')
      setSettingsOpen(true)
    }
    if (params.get('wizard') === '1') setShowWizard(true)
  }, [])

  const handleNavigate = (tab, state = {}) => {
    setActiveTab(normalizeTab(tab))
    setNavState(state)
  }

  const handleFilterUniverses = (cloud, env) => {
    setNavState({ filter: { cloud, env } })
    setActiveTab('universes')
  }

  const logout = () => {
    clearSession()
    window.location.reload()
  }

  const renderContent = () => {
    if (showWizard) {
      return (
        <SetupWizard
          onComplete={() => setShowWizard(false)}
          onOpenIntegrations={() => {
            setShowWizard(false)
            setSettingsSection('integrations')
            setSettingsOpen(true)
          }}
        />
      )
    }

    switch (activeTab) {
      case 'overview':
        return (
          <OverviewDashboard
            onNavigate={handleNavigate}
            onFilterUniverses={handleFilterUniverses}
            persona={role}
          />
        )
      case 'universes':
        return (
          <UniversesView
            initialFilter={navState.filter}
            initialUniverseId={navState.universeId}
            initialNodeId={navState.nodeId}
            onClearNav={() => setNavState({})}
          />
        )
      case 'agents':
        return <AgentsAlertsView />
      case 'fleet':
        return <AgentFleet />
      case 'provision':
        return <ProvisionWizard />
      case 'finance':
        return <FinanceView />
      default:
        return (
          <OverviewDashboard
            onNavigate={handleNavigate}
            onFilterUniverses={handleFilterUniverses}
            persona={role}
          />
        )
    }
  }

  if (settingsOpen) {
    return (
      <div className="app">
        <Settings
          open={settingsOpen}
          initialSection={settingsSection}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="16" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
            <circle cx="18" cy="12" r="4" fill="#3498db" />
            <circle cx="11" cy="22" r="4" fill="#27ae60" />
            <circle cx="25" cy="22" r="4" fill="#e74c3c" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h1>YugabyteDB Platform</h1>
          <div className="app-subtitle">Operations Console & Self-Service Control Plane</div>
        </div>
        <div className="header-actions">
          <span className="demo-badge">{dataSource === 'api' ? 'API' : 'DEMO'}</span>
          <select
            className="role-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            title="Persona / RBAC lens"
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <span className="auth-user-chip">{sessionUser?.name || sessionUser?.username || 'User'}</span>
          <button type="button" className="btn-link header-text-btn" onClick={() => setShowWizard(true)}>
            Setup
          </button>
          <button type="button" className="btn-link header-text-btn" onClick={logout}>
            Logout
          </button>
          {SETTINGS_ROLES.has(role) && (
            <button
              type="button"
              className="settings-icon-button"
              onClick={() => {
                setSettingsSection('integrations')
                setSettingsOpen(true)
              }}
              title="Settings"
              aria-label="Settings"
            >
              ⚙️
            </button>
          )}
        </div>
      </header>
      {!showWizard && (
        <Tabs activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setNavState({}) }} role={role} />
      )}
      <div className="app-content">
        {renderContent()}
      </div>
    </div>
  )
}

export default App
