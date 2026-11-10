import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { Router } from 'express'
import { requireAdminToken } from './middleware/auth.js'
import { config } from './config.js'
import { upsertSetting, getSettings } from './store.js'
import { DEFAULT_FINANCE_POLICY, mergeFinancePolicy } from './financePolicy.js'

const execFileAsync = promisify(execFile)
const router = Router()
router.use(requireAdminToken)

function tlsDir() {
  return path.dirname(config.tlsCertPath || path.join(config.installRoot, 'tls', 'server.crt'))
}

function tlsCertPath() {
  return config.tlsCertPath || path.join(tlsDir(), 'server.crt')
}

function tlsKeyPath() {
  return config.tlsKeyPath || path.join(tlsDir(), 'server.key')
}

async function runSystemctl(action, unit) {
  try {
    const { stdout, stderr } = await execFileAsync('sudo', ['systemctl', action, unit], { timeout: 30000 })
    return { ok: true, unit, action, output: (stdout || stderr || '').trim() }
  } catch (err) {
    return { ok: false, unit, action, error: err.message, output: err.stderr || err.stdout || '' }
  }
}

export async function restartPlatformServices(which = 'all') {
  const results = []
  const units = which === 'all' ? ['nginx', 'yuno-api'] : [which]
  for (const unit of units) {
    results.push(await runSystemctl('restart', unit))
  }
  return results
}

router.get('/tls/status', async (_req, res) => {
  const certPath = tlsCertPath()
  const keyPath = tlsKeyPath()
  const certExists = fs.existsSync(certPath)
  const keyExists = fs.existsSync(keyPath)
  let subject = null
  let expires = null

  if (certExists) {
    try {
      const { stdout } = await execFileAsync('openssl', [
        'x509', '-in', certPath, '-noout', '-subject', '-enddate'
      ])
      const lines = stdout.split('\n')
      subject = lines.find((l) => l.startsWith('subject='))?.replace('subject=', '') || null
      expires = lines.find((l) => l.startsWith('notAfter='))?.replace('notAfter=', '') || null
    } catch {
      /* openssl optional in dev */
    }
  }

  res.json({
    enabled: config.tlsEnabled,
    certificatePath: certPath,
    privateKeyPath: keyPath,
    certificatePresent: certExists,
    privateKeyPresent: keyExists,
    subject,
    expires,
    selfSigned: subject?.includes('Yugabyte Platform') || false
  })
})

router.post('/tls', async (req, res) => {
  const { certificate, privateKey } = req.body || {}
  if (!certificate || !privateKey) {
    return res.status(400).json({ error: 'certificate and privateKey PEM strings are required' })
  }
  if (!certificate.includes('BEGIN CERTIFICATE') || !privateKey.includes('PRIVATE KEY')) {
    return res.status(400).json({ error: 'Invalid PEM format' })
  }

  const dir = tlsDir()
  fs.mkdirSync(dir, { recursive: true })
  const certPath = tlsCertPath()
  const keyPath = tlsKeyPath()

  fs.writeFileSync(certPath, certificate.trim() + '\n', { mode: 0o644 })
  fs.writeFileSync(keyPath, privateKey.trim() + '\n', { mode: 0o600 })

  const restartResults = []
  try {
    await execFileAsync('sudo', ['nginx', '-t'], { timeout: 15000 })
    restartResults.push(...(await restartPlatformServices('nginx')))
  } catch (err) {
    return res.status(400).json({
      error: 'TLS files saved but nginx config test failed',
      detail: err.stderr || err.message,
      certificatePath: certPath
    })
  }

  await upsertSetting('tls', {
    certificatePath: certPath,
    updatedAt: new Date().toISOString(),
    updatedVia: 'settings-ui'
  })

  res.json({
    ok: true,
    message: 'TLS certificate installed and nginx restarted',
    certificatePath: certPath,
    services: restartResults
  })
})

router.post('/services/restart', async (req, res) => {
  const which = req.body?.service || req.query?.service || 'all'
  if (!['nginx', 'yuno-api', 'all'].includes(which)) {
    return res.status(400).json({ error: 'service must be nginx, yuno-api, or all' })
  }
  const results = await restartPlatformServices(which)
  res.json({ ok: results.every((r) => r.ok), services: results })
})

router.get('/services/status', async (_req, res) => {
  const units = ['yuno-api', 'nginx', 'postgresql']
  const status = []
  for (const unit of units) {
    try {
      const { stdout } = await execFileAsync('systemctl', ['is-active', unit], { timeout: 5000 })
      status.push({ unit, state: stdout.trim() })
    } catch (err) {
      status.push({ unit, state: err.stdout?.trim() || 'unknown' })
    }
  }
  res.json({ services: status })
})

router.put('/settings/auth', async (req, res) => {
  const payload = {
    ldapEnabled: Boolean(req.body.ldapEnabled),
    ssoEnabled: Boolean(req.body.ssoEnabled),
    provider: req.body.provider || null,
    ldapUrl: req.body.ldapUrl || null,
    bindDn: req.body.bindDn || null,
    baseDn: req.body.baseDn || null,
    userSearchFilter: req.body.userSearchFilter || '(uid={{username}})',
    configuredVia: 'settings-ui',
    updatedAt: new Date().toISOString()
  }
  await upsertSetting('auth', payload)
  res.json({ ok: true, auth: payload })
})

router.get('/settings/auth', async (_req, res) => {
  const settings = await getSettings()
  res.json(settings.auth || { ldapEnabled: false, ssoEnabled: false })
})

router.get('/settings/finance', async (_req, res) => {
  const settings = await getSettings()
  res.json(mergeFinancePolicy(settings.finance))
})

router.put('/settings/finance', async (req, res) => {
  const body = req.body || {}
  const payload = mergeFinancePolicy({
    currency: body.currency || DEFAULT_FINANCE_POLICY.currency,
    period: body.period || DEFAULT_FINANCE_POLICY.period,
    allocationModel: body.allocationModel || DEFAULT_FINANCE_POLICY.allocationModel,
    hoursPerMonth: Number(body.hoursPerMonth) || DEFAULT_FINANCE_POLICY.hoursPerMonth,
    rates: { ...DEFAULT_FINANCE_POLICY.rates, ...(body.rates || {}) },
    instanceVcpus: { ...DEFAULT_FINANCE_POLICY.instanceVcpus, ...(body.instanceVcpus || {}) },
    cloudOverrides: body.cloudOverrides || DEFAULT_FINANCE_POLICY.cloudOverrides,
    environmentOverrides: body.environmentOverrides || DEFAULT_FINANCE_POLICY.environmentOverrides,
    configuredVia: 'settings-ui',
    updatedAt: new Date().toISOString()
  })
  await upsertSetting('finance', payload)
  res.json({ ok: true, finance: payload })
})

export default router
