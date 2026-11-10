import React, { useState, useEffect, useCallback } from 'react'
import {
  getAdminToken,
  setAdminToken,
  fetchTlsStatus,
  uploadTlsCertificate,
  fetchServiceStatus,
  restartServices,
  fetchAuthSettings,
  saveAuthSettings,
  fetchFinanceSettings,
  saveFinanceSettings
} from '../services/settingsService'
import { reloadPlatformData } from '../services/dataService'
import { DEFAULT_FINANCE_POLICY } from '../services/financePolicy'
import PlatformHealthView from './PlatformHealthView'
import AuditView from './AuditView'
import IntegrationsHub from './IntegrationsHub'
import './Settings.css'

const SECTIONS = [
  { id: 'integrations', label: 'Integrations', description: 'YBA, Prometheus, security connectors' },
  { id: 'health', label: 'Platform health', description: 'Control plane components' },
  { id: 'audit', label: 'Audit', description: 'Immutable operation log' },
  { id: 'services', label: 'Platform services', description: 'systemd units & restarts' },
  { id: 'tls', label: 'TLS certificate', description: 'Corporate PKI / nginx' },
  { id: 'finance', label: 'Finance', description: 'Cost rate card & licensing' },
  { id: 'ldap', label: 'LDAP / SSO', description: 'Corporate identity login' }
]

const ADMIN_SECTIONS = new Set(['services', 'tls', 'finance', 'ldap'])

const defaultAuth = {
  ldapEnabled: false,
  ssoEnabled: false,
  provider: 'ldap',
  ldapUrl: '',
  bindDn: '',
  baseDn: '',
  userSearchFilter: '(uid={{username}})'
}

const defaultFinance = DEFAULT_FINANCE_POLICY

const RateField = ({ label, hint, value, onChange, step = '0.01' }) => (
  <label>
    {label}
    <input
      type="number"
      min="0"
      step={step}
      value={value ?? ''}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    {hint && <span className="settings-hint">{hint}</span>}
  </label>
)

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

const Settings = ({ open, onClose, initialSection = 'health' }) => {
  const [activeSection, setActiveSection] = useState(initialSection)
  const [adminToken, setAdminTokenState] = useState(getAdminToken())
  const [unlocked, setUnlocked] = useState(Boolean(getAdminToken()))
  const [tlsStatus, setTlsStatus] = useState(null)
  const [services, setServices] = useState([])
  const [auth, setAuth] = useState(defaultAuth)
  const [finance, setFinance] = useState(defaultFinance)
  const [certFile, setCertFile] = useState(null)
  const [keyFile, setKeyFile] = useState(null)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const sectionMeta = SECTIONS.find((s) => s.id === activeSection)

  const loadAdminData = useCallback(async () => {
    if (!getAdminToken()) return
    try {
      const [tls, svc, authSettings, financeSettings] = await Promise.all([
        fetchTlsStatus(),
        fetchServiceStatus(),
        fetchAuthSettings(),
        fetchFinanceSettings()
      ])
      setTlsStatus(tls)
      setServices(svc.services || [])
      setAuth({ ...defaultAuth, ...authSettings })
      setFinance({
        ...defaultFinance,
        ...financeSettings,
        rates: { ...defaultFinance.rates, ...(financeSettings.rates || {}) }
      })
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    if (open) setActiveSection(initialSection)
  }, [open, initialSection])

  useEffect(() => {
    if (open && unlocked && ADMIN_SECTIONS.has(activeSection)) loadAdminData()
  }, [open, unlocked, activeSection, loadAdminData])

  const handleUnlock = () => {
    setAdminToken(adminToken)
    setUnlocked(Boolean(adminToken))
    setMessage('Admin session unlocked for this browser tab')
  }

  const handleTlsUpload = async (e) => {
    e.preventDefault()
    if (!certFile || !keyFile) {
      setError('Select both certificate and private key files')
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const certificate = await readFileAsText(certFile)
      const privateKey = await readFileAsText(keyFile)
      const result = await uploadTlsCertificate(certificate, privateKey)
      setMessage(result.message || 'TLS updated and nginx restarted')
      await loadAdminData()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleAuthSave = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await saveAuthSettings(auth)
      setMessage('LDAP/SSO settings saved')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleFinanceSave = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const result = await saveFinanceSettings(finance)
      setFinance({
        ...defaultFinance,
        ...result.finance,
        rates: { ...defaultFinance.rates, ...(result.finance?.rates || {}) }
      })
      await reloadPlatformData()
      setMessage('Finance rate card saved — universe costs recomputed from policy')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const updateRate = (key, value) => {
    setFinance((prev) => ({
      ...prev,
      rates: { ...prev.rates, [key]: value }
    }))
  }

  const handleRestart = async (service) => {
    setBusy(true)
    setError(null)
    try {
      const result = await restartServices(service)
      setMessage(`Restarted ${service}: ${result.ok ? 'success' : 'see service status'}`)
      await loadAdminData()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const requiresUnlock = ADMIN_SECTIONS.has(activeSection)
  const showUnlockGate = requiresUnlock && !unlocked

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <div>
          <p className="settings-eyebrow">Platform configuration</p>
          <h2>Settings</h2>
          <p className="settings-subtitle">
            Internal platform health, audit trail, services, TLS, finance, and identity.
          </p>
        </div>
        <button type="button" className="settings-back-button" onClick={onClose}>
          ← Back to platform
        </button>
      </div>

      <div className="settings-page-body">
        <aside className="settings-nav">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => {
                setActiveSection(section.id)
                setMessage(null)
                setError(null)
              }}
            >
              <span className="settings-nav-label">{section.label}</span>
              <span className="settings-nav-description">{section.description}</span>
            </button>
          ))}
        </aside>

        <section className="settings-main">
          <div className="settings-main-toolbar">
            <div>
              <h3>{sectionMeta?.label}</h3>
              <p>{sectionMeta?.description}</p>
            </div>
            {requiresUnlock && !unlocked && (
              <span className="settings-admin-badge">Admin token required</span>
            )}
          </div>

          {showUnlockGate ? (
            <div className="settings-unlock-card">
              <h3>Administrator access</h3>
              <p className="platform-subtitle">
                Configuration changes require <code>ADMIN_API_TOKEN</code> from{' '}
                <code>/etc/yuno/secrets.env</code> (production) or{' '}
                <code>packaging/mac/config/secrets.env</code> (Mac dev).
              </p>
              <div className="settings-row">
                <input
                  type="password"
                  className="settings-input"
                  placeholder="Admin API token"
                  value={adminToken}
                  onChange={(e) => setAdminTokenState(e.target.value)}
                />
                <button type="button" className="btn-primary" onClick={handleUnlock}>
                  Unlock settings
                </button>
              </div>
            </div>
          ) : (
            <>
              {message && <div className="settings-banner success">{message}</div>}
              {error && <div className="settings-banner error">{error}</div>}

              {activeSection === 'integrations' && <IntegrationsHub />}
              {activeSection === 'health' && <PlatformHealthView embedded />}

              {activeSection === 'audit' && <AuditView embedded />}

              {activeSection === 'services' && (
              <>
                <p className="platform-subtitle">
                  Linux systemd units — restart after configuration changes.
                </p>
                <table className="platform-table compact">
                  <thead>
                    <tr><th>Service</th><th>State</th><th /></tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.unit}>
                        <td><code>{s.unit}</code></td>
                        <td>{s.state}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-link"
                            disabled={busy}
                            onClick={() => handleRestart(s.unit)}
                          >
                            Restart
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => handleRestart('all')}
                  style={{ marginTop: '1rem' }}
                >
                  Restart all platform services
                </button>
              </>
            )}

            {activeSection === 'tls' && (
              <>
                <p className="platform-subtitle">
                  Replace the self-signed certificate with your corporate CA or PKI cert.
                  Nginx restarts automatically.
                </p>
                {tlsStatus && (
                  <div className="settings-meta">
                    <div>Certificate: {tlsStatus.certificatePresent ? 'present' : 'missing'}</div>
                    {tlsStatus.subject && <div>Subject: {tlsStatus.subject}</div>}
                    {tlsStatus.expires && <div>Expires: {tlsStatus.expires}</div>}
                  </div>
                )}
                <form onSubmit={handleTlsUpload} className="settings-form">
                  <label>
                    Certificate file (.crt / .pem)
                    <input
                      type="file"
                      accept=".crt,.pem,.cer"
                      onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <label>
                    Private key file (.key)
                    <input
                      type="file"
                      accept=".key,.pem"
                      onChange={(e) => setKeyFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <button type="submit" className="btn-primary" disabled={busy}>
                    Upload certificate &amp; restart nginx
                  </button>
                </form>
              </>
            )}

            {activeSection === 'finance' && (
              <>
                <p className="platform-subtitle">
                  Unit rates used by the API to compute universe monthly costs from node topology
                  and metrics. Consumer chargeback (Model B) uses ingested database usage via{' '}
                  <code>/ingest/consumer-usage</code>.
                </p>
                <form onSubmit={handleFinanceSave} className="settings-form settings-form-grid">
                  <RateField
                    label="License ($ / vCPU / month)"
                    hint="Yugabyte / enterprise licensing per vCPU"
                    value={finance.rates?.licensePerVcpuMonth}
                    onChange={(v) => updateRate('licensePerVcpuMonth', v)}
                  />
                  <RateField
                    label="Compute ($ / vCPU / hour)"
                    hint="VM compute from instance vCPU × hours"
                    value={finance.rates?.computePerVcpuHour}
                    onChange={(v) => updateRate('computePerVcpuHour', v)}
                    step="0.001"
                  />
                  <RateField
                    label="Storage ($ / GB / month)"
                    hint="Provisioned storage per node"
                    value={finance.rates?.storagePerGbMonth}
                    onChange={(v) => updateRate('storagePerGbMonth', v)}
                    step="0.01"
                  />
                  <RateField
                    label="Network ($ / GB egress)"
                    value={finance.rates?.networkPerGb}
                    onChange={(v) => updateRate('networkPerGb', v)}
                    step="0.01"
                  />
                  <RateField
                    label="Backup (% of storage)"
                    value={finance.rates?.backupPctOfStorage}
                    onChange={(v) => updateRate('backupPctOfStorage', v)}
                    step="1"
                  />
                  <RateField
                    label="Platform overhead (%)"
                    hint="Support / monitoring markup on subtotal"
                    value={finance.rates?.platformOverheadPct}
                    onChange={(v) => updateRate('platformOverheadPct', v)}
                    step="1"
                  />
                  <RateField
                    label="Default storage (GB / node)"
                    value={finance.rates?.defaultStorageGbPerNode}
                    onChange={(v) => updateRate('defaultStorageGbPerNode', v)}
                    step="10"
                  />
                  <RateField
                    label="Network baseline (GB / node / month)"
                    value={finance.rates?.networkGbPerNodeMonth}
                    onChange={(v) => updateRate('networkGbPerNodeMonth', v)}
                    step="10"
                  />
                  <RateField
                    label="Hours per month"
                    value={finance.hoursPerMonth}
                    onChange={(v) => setFinance((prev) => ({ ...prev, hoursPerMonth: v }))}
                    step="1"
                  />
                  <button type="submit" className="btn-primary settings-span-2" disabled={busy}>
                    Save finance rate card
                  </button>
                </form>
              </>
            )}

            {activeSection === 'ldap' && (
              <>
                <p className="platform-subtitle">
                  Corporate login for platform users (Entra ID, Active Directory, Okta).
                </p>
                <form onSubmit={handleAuthSave} className="settings-form">
                  <label className="settings-check">
                    <input
                      type="checkbox"
                      checked={auth.ldapEnabled}
                      onChange={(e) => setAuth({ ...auth, ldapEnabled: e.target.checked })}
                    />
                    Enable LDAP
                  </label>
                  <label className="settings-check">
                    <input
                      type="checkbox"
                      checked={auth.ssoEnabled}
                      onChange={(e) => setAuth({ ...auth, ssoEnabled: e.target.checked })}
                    />
                    Enable SSO (OIDC/SAML gateway)
                  </label>
                  <label>
                    Provider
                    <select
                      value={auth.provider || 'ldap'}
                      onChange={(e) => setAuth({ ...auth, provider: e.target.value })}
                    >
                      <option value="ldap">LDAP / Active Directory</option>
                      <option value="oidc">OIDC</option>
                      <option value="saml">SAML</option>
                    </select>
                  </label>
                  <label>
                    LDAP URL
                    <input
                      type="url"
                      value={auth.ldapUrl || ''}
                      onChange={(e) => setAuth({ ...auth, ldapUrl: e.target.value })}
                      placeholder="ldaps://idp.example.com:636"
                    />
                  </label>
                  <label>
                    Bind DN
                    <input
                      type="text"
                      value={auth.bindDn || ''}
                      onChange={(e) => setAuth({ ...auth, bindDn: e.target.value })}
                      placeholder="cn=yuno,ou=services,dc=example,dc=com"
                    />
                  </label>
                  <label>
                    Base DN
                    <input
                      type="text"
                      value={auth.baseDn || ''}
                      onChange={(e) => setAuth({ ...auth, baseDn: e.target.value })}
                      placeholder="dc=example,dc=com"
                    />
                  </label>
                  <label>
                    User search filter
                    <input
                      type="text"
                      value={auth.userSearchFilter || ''}
                      onChange={(e) => setAuth({ ...auth, userSearchFilter: e.target.value })}
                    />
                  </label>
                  <button type="submit" className="btn-primary" disabled={busy}>
                    Save LDAP / SSO settings
                  </button>
                </form>
              </>
            )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default Settings
