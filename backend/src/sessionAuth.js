import crypto from 'crypto'
import { config } from './config.js'

const SESSION_TTL_MS = 12 * 60 * 60 * 1000

function secret() {
  return config.sessionSecret || config.adminApiToken || 'yuno-dev-session-secret'
}

export function createSessionToken(user) {
  const payload = {
    sub: user.username,
    role: user.role || 'admin',
    name: user.name || user.username,
    exp: Date.now() + SESSION_TTL_MS
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifySessionToken(token) {
  if (!token || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  if (sig !== expected) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function extractBearer(req) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7).trim()
  return req.headers['x-session-token']?.trim() || ''
}

/** Demo users — replace with OIDC in production */
export const DEMO_USERS = {
  admin: { username: 'admin', password: 'admin', role: 'admin', name: 'Platform Admin' },
  dba: { username: 'dba', password: 'dba', role: 'dba', name: 'DBA' },
  viewer: { username: 'viewer', password: 'viewer', role: 'viewer', name: 'Viewer' }
}

export function authenticateDemoUser(username, password) {
  const user = DEMO_USERS[username]
  if (!user || user.password !== password) return null
  return { username: user.username, role: user.role, name: user.name }
}

export function requireSession(req, res, next) {
  if (config.authDisabled) return next()
  const token = extractBearer(req)
  const session = verifySessionToken(token)
  if (!session) {
    return res.status(401).json({ error: 'Login required', code: 'AUTH_REQUIRED' })
  }
  req.user = session
  next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (config.authDisabled) return next()
    if (!req.user) return res.status(401).json({ error: 'Login required' })
    if (roles.length && !roles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient role' })
    }
    next()
  }
}
