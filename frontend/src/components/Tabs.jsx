import React from 'react'
import './Tabs.css'

const Tabs = ({ activeTab, onTabChange, role }) => {
  const allTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'universes', label: 'Universes' },
    { id: 'fleet', label: 'Agent Fleet' },
    { id: 'agents', label: 'Agents & Alerts' },
    { id: 'finance', label: 'Finance' },
    { id: 'provision', label: 'Provision Universe' }
  ]

  const roleTabs = {
    viewer: ['overview', 'universes', 'fleet', 'finance'],
    developer: ['overview', 'universes', 'provision'],
    security: ['overview', 'agents', 'fleet'],
    operations: ['overview', 'universes', 'fleet', 'agents', 'finance'],
    dba: ['overview', 'universes', 'fleet', 'agents', 'finance', 'provision'],
    admin: allTabs.map((t) => t.id)
  }

  const allowed = roleTabs[role] || roleTabs.admin
  const tabs = allTabs.filter((t) => allowed.includes(t.id))

  return (
    <div className="tabs-container">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default Tabs
