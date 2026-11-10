import React, { useState } from 'react'
import {
  CLOUDS,
  ENVIRONMENTS,
  YB_VERSIONS,
  VM_SIZES,
  REGIONS,
  PROVISION_STEPS
} from '../services/dataService'
import { DemoBanner, PageHeader, StatusBadge } from './shared/PlatformUI'

const WIZARD_STEPS = [
  'Basic Information',
  'Cloud & Environment',
  'Capacity',
  'YugabyteDB',
  'Security',
  'Backup & Monitoring',
  'Review & Submit'
]

const defaultForm = {
  name: '',
  owner: '',
  description: '',
  cloud: 'AWS',
  environment: 'DEV',
  region: 'us-east-1',
  nodeCount: 3,
  vmSize: 'm5.2xlarge',
  diskGb: 1024,
  ybVersion: '2.25.1.0',
  replicationFactor: 3,
  encryption: true,
  tls: true,
  securityAgent: true,
  backup: true,
  monitoring: true,
  backupRetention: 7,
  certSource: 'Enterprise CA'
}

const ProvisionWizard = () => {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(defaultForm)
  const [phase, setPhase] = useState('form')
  const [progressStep, setProgressStep] = useState(-1)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [approved, setApproved] = useState(false)

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleCloudChange = (cloud) => {
    update('cloud', cloud)
    update('region', REGIONS[cloud][0])
    update('vmSize', VM_SIZES[cloud][1])
  }

  const handleSubmit = () => {
    const isProd = form.environment === 'PROD'
    if (isProd) {
      setNeedsApproval(true)
      setPhase('approval')
    } else {
      startProvisioning()
    }
  }

  const startProvisioning = () => {
    setPhase('provisioning')
    setProgressStep(0)
    let i = 0
    const interval = setInterval(() => {
      i += 1
      setProgressStep(i)
      if (i >= PROVISION_STEPS.length) {
        clearInterval(interval)
        setPhase('complete')
      }
    }, 600)
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <div className="form-group">
              <label>Universe Name</label>
              <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="payments-uat" />
            </div>
            <div className="form-group">
              <label>Owner / Team</label>
              <input value={form.owner} onChange={(e) => update('owner', e.target.value)} placeholder="Payments Team" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} placeholder="Purpose of this universe..." />
            </div>
          </>
        )
      case 1:
        return (
          <>
            <div className="form-group">
              <label>Cloud</label>
              <div className="radio-group">
                {CLOUDS.map((c) => (
                  <label key={c}>
                    <input type="radio" checked={form.cloud === c} onChange={() => handleCloudChange(c)} />
                    {c}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Environment</label>
              <div className="radio-group">
                {ENVIRONMENTS.map((e) => (
                  <label key={e}>
                    <input type="radio" checked={form.environment === e} onChange={() => update('environment', e)} />
                    {e}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Region</label>
              <select value={form.region} onChange={(e) => update('region', e.target.value)}>
                {REGIONS[form.cloud].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </>
        )
      case 2:
        return (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Node Count</label>
                <input type="number" min={3} value={form.nodeCount} onChange={(e) => update('nodeCount', +e.target.value)} />
              </div>
              <div className="form-group">
                <label>VM Size</label>
                <select value={form.vmSize} onChange={(e) => update('vmSize', e.target.value)}>
                  {VM_SIZES[form.cloud].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Disk Size (GB)</label>
              <input type="number" value={form.diskGb} onChange={(e) => update('diskGb', +e.target.value)} />
            </div>
          </>
        )
      case 3:
        return (
          <>
            <div className="form-group">
              <label>YugabyteDB Version</label>
              <select value={form.ybVersion} onChange={(e) => update('ybVersion', e.target.value)}>
                {YB_VERSIONS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Replication Factor</label>
              <select value={form.replicationFactor} onChange={(e) => update('replicationFactor', +e.target.value)}>
                <option value={3}>3</option>
                <option value={5}>5</option>
              </select>
            </div>
          </>
        )
      case 4:
        return (
          <>
            <div className="form-group">
              <label>Encryption at Rest</label>
              <div className="radio-group">
                <label><input type="radio" checked={form.encryption} onChange={() => update('encryption', true)} /> Enabled</label>
                <label><input type="radio" checked={!form.encryption} onChange={() => update('encryption', false)} /> Disabled</label>
              </div>
            </div>
            <div className="form-group">
              <label>TLS</label>
              <div className="radio-group">
                <label><input type="radio" checked={form.tls} onChange={() => update('tls', true)} /> Enabled</label>
                <label><input type="radio" checked={!form.tls} onChange={() => update('tls', false)} /> Disabled</label>
              </div>
            </div>
            <div className="form-group">
              <label>Security Agent</label>
              <div className="radio-group">
                <label><input type="radio" checked={form.securityAgent} onChange={() => update('securityAgent', true)} /> Required</label>
              </div>
            </div>
            <div className="form-group">
              <label>Certificate Source</label>
              <select value={form.certSource} onChange={(e) => update('certSource', e.target.value)}>
                <option>Enterprise CA</option>
                <option>Internal CA</option>
                <option>Dev CA</option>
              </select>
            </div>
          </>
        )
      case 5:
        return (
          <>
            <div className="form-group">
              <label>Backup</label>
              <div className="radio-group">
                <label><input type="radio" checked={form.backup} onChange={() => update('backup', true)} /> Enabled</label>
                <label><input type="radio" checked={!form.backup} onChange={() => update('backup', false)} /> Disabled</label>
              </div>
            </div>
            <div className="form-group">
              <label>Monitoring</label>
              <div className="radio-group">
                <label><input type="radio" checked={form.monitoring} onChange={() => update('monitoring', true)} /> Enabled</label>
                <label><input type="radio" checked={!form.monitoring} onChange={() => update('monitoring', false)} /> Disabled</label>
              </div>
            </div>
            <div className="form-group">
              <label>Backup Retention (days)</label>
              <input type="number" value={form.backupRetention} onChange={(e) => update('backupRetention', +e.target.value)} />
            </div>
          </>
        )
      case 6:
        return (
          <div className="platform-card compact">
            <h3>Review Request</h3>
            <table className="platform-table">
              <tbody>
                <tr><td>Universe</td><td><strong>{form.name || '(not set)'}</strong></td></tr>
                <tr><td>Owner</td><td>{form.owner || '—'}</td></tr>
                <tr><td>Cloud / Env / Region</td><td>{form.cloud} · {form.environment} · {form.region}</td></tr>
                <tr><td>Nodes / VM / Disk</td><td>{form.nodeCount} × {form.vmSize} · {form.diskGb} GB</td></tr>
                <tr><td>YB Version</td><td>{form.ybVersion} (RF {form.replicationFactor})</td></tr>
                <tr><td>Encryption / TLS</td><td>{form.encryption ? 'Yes' : 'No'} / {form.tls ? 'Yes' : 'No'}</td></tr>
                <tr><td>Security Agent</td><td>{form.securityAgent ? 'Required' : 'No'}</td></tr>
                <tr><td>Backup / Monitoring</td><td>{form.backup ? 'Yes' : 'No'} / {form.monitoring ? 'Yes' : 'No'}</td></tr>
                <tr><td>Certificate</td><td>{form.certSource}</td></tr>
              </tbody>
            </table>
            {form.environment === 'PROD' && (
              <div className="platform-banner" style={{ marginTop: '1rem' }}>
                PROD requests require approval before provisioning begins.
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  if (phase === 'approval') {
    return (
      <div className="platform-page">
        <PageHeader title="Provision Universe" subtitle="Approval required for PROD" />
        <DemoBanner />
        <div className="platform-card" style={{ maxWidth: 520 }}>
          <h3>Approval Required</h3>
          <p style={{ fontSize: '0.85rem', color: '#486581', marginBottom: '1rem' }}>
            Universe <strong>{form.name}</strong> in {form.cloud} PROD requires platform admin approval.
          </p>
          {!approved ? (
            <div className="action-bar">
              <button type="button" className="btn btn-primary" onClick={() => { setApproved(true); startProvisioning() }}>
                Approve & Provision
              </button>
              <button type="button" className="btn btn-danger" onClick={() => { setPhase('form'); setNeedsApproval(false) }}>
                Reject
              </button>
            </div>
          ) : (
            <StatusBadge status="PROVISIONING" />
          )}
        </div>
      </div>
    )
  }

  if (phase === 'provisioning' || phase === 'complete') {
    return (
      <div className="platform-page">
        <PageHeader title={`Provisioning ${form.name || 'universe'}`} subtitle="Orchestrated workflow — idempotent steps" />
        <DemoBanner />
        <div className="provision-progress">
          <h3 style={{ marginBottom: '1rem', color: '#243b53' }}>
            {phase === 'complete' ? (
              <>Universe: {form.name} · <StatusBadge status="HEALTHY" /> READY</>
            ) : (
              'Workflow in progress...'
            )}
          </h3>
          {PROVISION_STEPS.map((s, i) => {
            let cls = 'pending'
            if (i < progressStep) cls = 'done'
            else if (i === progressStep) cls = phase === 'complete' ? 'done' : 'running'
            return (
              <div key={s} className={`provision-step-item ${cls}`}>
                <span>{cls === 'done' ? '✓' : cls === 'running' ? '◉' : '○'}</span>
                <span>{s}</span>
              </div>
            )
          })}
          {phase === 'complete' && (
            <div className="action-bar" style={{ marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-primary" onClick={() => { setPhase('form'); setStep(0); setForm(defaultForm); setProgressStep(-1) }}>
                Create Another
              </button>
            </div>
          )}
        </div>

        {phase === 'complete' && (
          <div className="platform-card compact" style={{ marginTop: '1rem', maxWidth: 520 }}>
            <h3>Simulated Failure Recovery</h3>
            <p style={{ fontSize: '0.82rem', color: '#627d98', marginBottom: '0.75rem' }}>
              If a step fails, operators can retry without reprovisioning from scratch:
            </p>
            <div style={{ padding: '0.75rem', background: '#fef9f9', borderRadius: 8, border: '1px solid #fad4d4', fontSize: '0.85rem' }}>
              Step 13 FAILED — Create universe
              <div className="action-bar" style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-sm btn-primary">Retry</button>
                <button type="button" className="btn btn-sm">Rollback</button>
                <button type="button" className="btn btn-sm btn-danger">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="platform-page">
      <PageHeader title="Provision Universe" subtitle="Self-service YugabyteDB universe creation" />
      <DemoBanner />

      <div className="wizard-steps">
        {WIZARD_STEPS.map((label, i) => (
          <div key={label} className={`wizard-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
            {i + 1}. {label}
          </div>
        ))}
      </div>

      <div className="wizard-form">
        {renderStep()}
        <div className="action-bar" style={{ marginTop: '1.25rem' }}>
          {step > 0 && (
            <button type="button" className="btn" onClick={() => setStep(step - 1)}>Back</button>
          )}
          {step < WIZARD_STEPS.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>Next</button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>
              {form.environment === 'PROD' ? 'Submit for Approval' : 'Create Universe'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProvisionWizard
