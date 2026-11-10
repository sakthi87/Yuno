const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'
const SESSION_KEY = 'yuno_session'
const USER_KEY = 'yuno_user'

export function getSessionToken() {
  return sessionStorage.getItem(SESSION_KEY) || ''
}

export function getSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export function setSession(token, user) {
  if (token) sessionStorage.setItem(SESSION_KEY, token)
  else sessionStorage.removeItem(SESSION_KEY)
  if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  else sessionStorage.removeItem(USER_KEY)
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Login failed')
  setSession(data.token, data.user)
  return data
}

export async function fetchMe() {
  const token = getSessionToken()
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}/auth/me`, { headers })
  if (res.status === 401) return { authenticated: false }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { authenticated: false }
  return data
}

export async function apiFetch(path, options = {}) {
  const token = getSessionToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) {
    const err = new Error(data.error || 'Login required')
    err.code = 'AUTH_REQUIRED'
    throw err
  }
  if (!res.ok) throw new Error(data.error || data.detail || res.statusText)
  return data
}
