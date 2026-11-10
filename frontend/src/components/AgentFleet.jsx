import React, { useEffect, useState } from 'react'
import { apiFetch } from '../services/authService'
import { PageHeader, KpiCard, StatusBadge } from './shared/PlatformUI'
import './AgentFleet.css'

const AgentFleet = () => {
  const [fleet, setFleet] = useState({ items: [], summary: {} })
  const [autoCommands, setAutoCommands] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const data = await apiFetch('/agents')
    setFleet(data)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
    const t = setInterval(() => load().catch(() => {}), 15000)
    return () => clearInterval(t)
  }, [])

  const enroll = async () => {
    setBusy(true)
    setError('')
    try {
      const data = await apiFetch('/agents/auto-enroll-commands', { method: 'POST', body: '{}' })
      setAutoCommands(data)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="platform-page agent-fleet">
      <PageHeader
        title="Agent fleet"
        subtitle="Enrollment, heartbeats, and host provenance"
      />
      {error && <div className="setup-banner bad">{error}</div>}

      <div className="platform-kpi-row fit">
        <KpiCard label="Agents" value={fleet.summary?.total ?? 0} />
        <KpiCard label="Connected" value={fleet.summary?.connected ?? 0} tone="good" />
        <KpiCard label="Stale / down" value={fleet.summary?.degraded ?? 0} tone="warn" />
      </div>

      <div className="platform-card">
        <div className="overview-section-header">
          <h3>Fleet</h3>
          <button type="button" className="btn-primary" disabled={busy} onClick={enroll}>
            {busy ? 'Working…' : 'Auto-enroll commands'}
          </button>
        </div>
        <table className="platform-table">
          <thead>
            <tr>
              <th>Hostname</th>
              <th>Node</th>
              <th>Universe</th>
              <th>Status</th>
              <th>Version</th>
              <th>Last heartbeat</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {(fleet.items || []).length === 0 && (
              <tr>
                <td colSpan={7} style={{ color: '#627d98' }}>
                  No agents yet — generate enroll commands after YBA sync.
                </td>
              </tr>
            )}
            {(fleet.items || []).map((a) => (
              <tr key={a.id}>
                <td>{a.hostname}</td>
                <td>{a.nodeId}</td>
                <td>{a.universeId}</td>
                <td>
                  <StatusBadge status={a.connected ? 'HEALTHY' : 'WARNING'} />
                </td>
                <td>{a.version || '—'}</td>
                <td>
                  {a.lastHeartbeat
                    ? `${a.secondsAgo != null ? `${a.secondsAgo}s ago` : a.lastHeartbeat}`
                    : '—'}
                </td>
                <td>{a.source || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {autoCommands && (
        <div className="platform-card">
          <h3>Install commands ({autoCommands.commands?.length || 0})</h3>
          <p className="platform-subtitle">Token expires with enrollment setting · token={autoCommands.token?.slice(0, 18)}…</p>
          <div className="agent-commands">
            {(autoCommands.commands || []).slice(0, 8).map((c) => (
              <code key={c.nodeId}>{c.command}</code>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentFleet
