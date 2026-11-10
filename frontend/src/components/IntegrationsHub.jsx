import React, { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../services/authService'
import { PageHeader, StatusBadge } from './shared/PlatformUI'
import './IntegrationsHub.css'

const CARDS = [
  { id: 'yba', title: 'Yugabyte Anywhere', blurb: 'Discover universes & topology' },
  { id: 'prometheus', title: 'Prometheus', blurb: 'Golden metrics Connect / Push' },
  { id: 'nessus', title: 'Nessus / Tenable', blurb: 'Vulnerability Push or Connect' },
  { id: 'tanium', title: 'Tanium / Patch', blurb: 'Patch job status Push' },
  { id: 'usage', title: 'Usage / FinOps', blurb: 'Consumer usage for chargeback' },
  { id: 'notifications', title: 'Notifications', blurb: 'Email / Slack / webhook' }
]

const IntegrationsHub = () => {
  const [integrations, setIntegrations] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    const data = await apiFetch('/integrations')
    setIntegrations(data)
  }, [])

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [load])

  const save = async (id, patch) => {
    setBusy(id)
    setError('')
    try {
      const data = await apiFetch(`/integrations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patch)
      })
      setIntegrations((prev) => ({ ...prev, [id]: data.integration }))
      setMessage(`${id} saved`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const runAction = async (id, action) => {
    setBusy(`${id}-${action}`)
    setError('')
    setMessage('')
    try {
      if (id === 'yba' && action === 'sync') {
        const result = await apiFetch('/integrations/yba/sync', {
          method: 'POST',
          body: JSON.stringify({ mode: integrations.yba?.mode || 'mock' })
        })
        setMessage(`YBA sync ok — ${JSON.stringify(result.summary || result)}`)
      } else if (id === 'prometheus' && action === 'sync') {
        const result = await apiFetch('/integrations/prometheus/sync', {
          method: 'POST',
          body: JSON.stringify({ mode: integrations.prometheus?.mode || 'mock' })
        })
        setMessage(`Prometheus sync @ ${result.syncedAt}`)
      } else if (id === 'nessus' && action === 'sync') {
        const result = await apiFetch('/integrations/nessus/sync', {
          method: 'POST',
          body: JSON.stringify({ mode: integrations.nessus?.mode || 'mock' })
        })
        setMessage(`Nessus sync @ ${result.syncedAt}`)
      } else if (id === 'tanium' && action === 'sync') {
        const result = await apiFetch('/integrations/tanium/sync', {
          method: 'POST',
          body: JSON.stringify({ mode: integrations.tanium?.mode || 'mock' })
        })
        setMessage(`Tanium sync @ ${result.syncedAt}`)
      } else if (id === 'notifications' && action === 'test') {
        await apiFetch('/notifications/test', { method: 'POST', body: '{}' })
        setMessage('Notification test recorded')
      } else if (action === 'recompute') {
        const result = await apiFetch('/platform/recompute', { method: 'POST', body: '{}' })
        setMessage(`Recomputed — ${result.insightCount} insights`)
      }
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="platform-page integrations-hub">
      <PageHeader
        title="Integrations Hub"
        subtitle="Connect and Push connectors — status, test, sync"
      />
      {error && <div className="setup-banner bad">{error}</div>}
      {message && <div className="setup-banner ok">{message}</div>}

      <div className="integrations-grid">
        {CARDS.map((card) => {
          const cfg = integrations[card.id] || {}
          const enabled = Boolean(cfg.enabled)
          return (
            <div key={card.id} className="platform-card integration-card">
              <div className="integration-card-head">
                <h3>{card.title}</h3>
                <StatusBadge status={enabled ? 'HEALTHY' : 'WARNING'} />
              </div>
              <p className="platform-subtitle">{card.blurb}</p>
              <label className="setup-field">
                Mode
                <select
                  value={cfg.mode || 'push'}
                  onChange={(e) =>
                    setIntegrations((prev) => ({
                      ...prev,
                      [card.id]: { ...cfg, mode: e.target.value }
                    }))
                  }
                >
                  <option value="mock">Mock</option>
                  <option value="connect">Connect</option>
                  <option value="push">Push</option>
                </select>
              </label>
              {(card.id === 'yba' || card.id === 'prometheus' || card.id === 'nessus') && (
                <label className="setup-field">
                  URL
                  <input
                    value={cfg.url || ''}
                    placeholder="https://…"
                    onChange={(e) =>
                      setIntegrations((prev) => ({
                        ...prev,
                        [card.id]: { ...cfg, url: e.target.value }
                      }))
                    }
                  />
                </label>
              )}
              <div className="integration-actions">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={Boolean(busy)}
                  onClick={() => save(card.id, { ...cfg, enabled: true })}
                >
                  {busy === card.id ? 'Saving…' : 'Save & enable'}
                </button>
                {card.id === 'yba' && (
                  <button type="button" className="btn-link" disabled={Boolean(busy)} onClick={() => runAction('yba', 'sync')}>
                    Sync now
                  </button>
                )}
                {card.id === 'prometheus' && (
                  <button type="button" className="btn-link" disabled={Boolean(busy)} onClick={() => runAction('prometheus', 'sync')}>
                    Sync metrics
                  </button>
                )}
                {card.id === 'nessus' && (
                  <button type="button" className="btn-link" disabled={Boolean(busy)} onClick={() => runAction('nessus', 'sync')}>
                    Sync findings
                  </button>
                )}
                {card.id === 'tanium' && (
                  <button type="button" className="btn-link" disabled={Boolean(busy)} onClick={() => runAction('tanium', 'sync')}>
                    Sync patches
                  </button>
                )}
                {card.id === 'notifications' && (
                  <button type="button" className="btn-link" disabled={Boolean(busy)} onClick={() => runAction('notifications', 'test')}>
                    Test channel
                  </button>
                )}
              </div>
              {cfg.lastSync?.at && (
                <div className="integration-meta">Last sync: {cfg.lastSync.at}</div>
              )}
            </div>
          )
        })}
      </div>

      <div className="platform-card compact" style={{ marginTop: '1rem' }}>
        <h3>Platform recompute</h3>
        <p className="platform-subtitle">Refresh health, KPIs, and ranked insights from current estate data.</p>
        <button type="button" className="btn-primary" disabled={Boolean(busy)} onClick={() => runAction('platform', 'recompute')}>
          Recompute now
        </button>
      </div>
    </div>
  )
}

export default IntegrationsHub
