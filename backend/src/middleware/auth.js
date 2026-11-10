import { config } from '../config.js'
import { getSettings } from '../store.js'

function extractToken(req) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7).trim()
  return req.headers['x-api-key']?.trim() || req.headers['x-enroll-token']?.trim() || ''
}

export async function requireAgentToken(req, res, next) {
  const token = extractToken(req)

  if (config.agentApiToken && token === config.agentApiToken) {
    req.agentAuth = 'agent-token'
    return next()
  }

  try {
    const settings = await getSettings()
    const enrollment = settings.agentEnrollment
    if (
      enrollment?.token &&
      token === enrollment.token &&
      (!enrollment.expiresAt || new Date(enrollment.expiresAt).getTime() > Date.now())
    ) {
      req.agentAuth = 'enroll-token'
      return next()
    }
  } catch {
    /* ignore */
  }

  // Local demo convenience when no agent token configured
  if (!config.agentApiToken && (config.authDisabled || config.demoMode)) {
    req.agentAuth = 'demo-open'
    return next()
  }

  if (!config.agentApiToken) {
    return res.status(503).json({ error: 'AGENT_API_TOKEN not configured on server' })
  }
  return res.status(401).json({ error: 'Invalid or missing agent API token' })
}

export function requireAdminToken(req, res, next) {
  if (!config.adminApiToken) {
    return res.status(503).json({ error: 'ADMIN_API_TOKEN not configured on server' })
  }
  const token = extractToken(req)
  if (token !== config.adminApiToken) {
    return res.status(401).json({ error: 'Invalid or missing admin API token' })
  }
  next()
}

export function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
}
