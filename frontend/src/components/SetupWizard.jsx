import React, { useEffect, useState } from 'react'
import { apiFetch } from '../services/authService'
import { PageHeader } from './shared/PlatformUI'
import './SetupWizard.css'

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'yba', title: 'Connect YBA' },
  { id: 'agents', title: 'Enroll agents' },
  { id: 'done', title: 'Ready' }
]

const SetupWizard = ({ onComplete, onOpenIntegrations }) => {
  const [setup, setSetup] = useState({ step: 'welcome', completed: false })
  const [ybaMode, setYbaMode] = useState('mock')
  const [ybaUrl, setYbaUrl] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [enroll, setEnroll] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const data = await apiFetch('/setup')
      setSetup(data)
      if (data.completed) onComplete?.(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const saveStep = async (patch) => {
    const data = await apiFetch('/setup', { method: 'PUT', body: JSON.stringify(patch) })
    setSetup(data.setup)
    return data.setup
  }

  const syncYba = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await apiFetch('/integrations/yba', {
        method: 'PUT',
        body: JSON.stringify({ mode: ybaMode, url: ybaUrl, enabled: true })
      })
      const result = await apiFetch('/integrations/yba/sync', {
        method: 'POST',
        body: JSON.stringify({ mode: ybaMode, url: ybaUrl })
      })
      setMessage(`Synced ${result.universeCount ?? 0} universes / ${result.nodeCount ?? 0} nodes (${result.mode}).`)
      await saveStep({ step: 'agents', ybaConnected: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const createEnroll = async () => {
    setBusy(true)
    setError('')
    try {
      const data = await apiFetch('/agents/enroll-token', {
        method: 'POST',
        body: JSON.stringify({})
      })
      setEnroll(data)
      await saveStep({ step: 'done', agentsReady: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const finish = async () => {
    setBusy(true)
    try {
      await apiFetch('/platform/recompute', { method: 'POST', body: '{}' })
      const data = await saveStep({ step: 'done', completed: true })
      onComplete?.(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const step = setup.step || 'welcome'
  const stepIndex = Math.max(0, STEPS.findIndex((s) => s.id === step))

  return (
    <div className="platform-page setup-wizard">
      <PageHeader
        title="Setup Wizard"
        subtitle="Connect YBA, enroll agents, then open the live ops console"
      />

      <div className="setup-steps">
        {STEPS.map((s, i) => (
          <div key={s.id} className={`setup-step-pill ${i <= stepIndex ? 'active' : ''}`}>
            {i + 1}. {s.title}
          </div>
        ))}
      </div>

      {error && <div className="setup-banner bad">{error}</div>}
      {message && <div className="setup-banner ok">{message}</div>}

      {step === 'welcome' && (
        <div className="platform-card">
          <h3>Customer-space control plane</h3>
          <p className="platform-subtitle">
            This wizard wires your estate into Yuno: discover universes from Yugabyte Anywhere,
            enroll host agents, then compute health and FinOps from live data.
          </p>
          <button type="button" className="btn-primary" disabled={busy} onClick={() => saveStep({ step: 'yba' })}>
            Start setup
          </button>
        </div>
      )}

      {step === 'yba' && (
        <div className="platform-card">
          <h3>Connect Yugabyte Anywhere</h3>
          <label className="setup-field">
            Mode
            <select value={ybaMode} onChange={(e) => setYbaMode(e.target.value)}>
              <option value="mock">Mock catalog (demo)</option>
              <option value="connect">Connect (API URL)</option>
            </select>
          </label>
          {ybaMode === 'connect' && (
            <label className="setup-field">
              YBA URL
              <input value={ybaUrl} onChange={(e) => setYbaUrl(e.target.value)} placeholder="https://yba.example.com" />
            </label>
          )}
          <div className="setup-actions">
            <button type="button" className="btn-primary" disabled={busy} onClick={syncYba}>
              {busy ? 'Syncing…' : 'Test & sync'}
            </button>
            <button type="button" className="btn-link" onClick={() => onOpenIntegrations?.()}>
              Open Integrations Hub
            </button>
          </div>
        </div>
      )}

      {(step === 'agents' || step === 'done') && (
        <div className="platform-card">
          <h3>Enroll platform agents</h3>
          <p className="platform-subtitle">
            Generate an enrollment token, then run the install command on each DB host.
          </p>
          <button type="button" className="btn-primary" disabled={busy} onClick={createEnroll}>
            Generate enroll token
          </button>
          {enroll && (
            <div className="setup-code-block">
              <code>{enroll.installCommand}</code>
            </div>
          )}
          {step === 'done' && (
            <button type="button" className="btn-primary" style={{ marginTop: '1rem' }} disabled={busy} onClick={finish}>
              Finish &amp; open console
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default SetupWizard
