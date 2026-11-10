const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'
const ADMIN_TOKEN_KEY = 'yuno_admin_token'

export function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || ''
}

export function setAdminToken(token) {
  if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
  else sessionStorage.removeItem(ADMIN_TOKEN_KEY)
}

async function adminFetch(path, options = {}) {
  const session = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('yuno_session') : ''
  const token = getAdminToken() || session
  if (!token) throw new Error('Admin API token or login session required')

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.detail || res.statusText)
  return data
}

export async function fetchTlsStatus() {
  return adminFetch('/admin/tls/status')
}

export async function uploadTlsCertificate(certificate, privateKey) {
  return adminFetch('/admin/tls', {
    method: 'POST',
    body: JSON.stringify({ certificate, privateKey })
  })
}

export async function fetchServiceStatus() {
  return adminFetch('/admin/services/status')
}

export async function restartServices(service = 'all') {
  return adminFetch('/admin/services/restart', {
    method: 'POST',
    body: JSON.stringify({ service })
  })
}

export async function fetchAuthSettings() {
  return adminFetch('/admin/settings/auth')
}

export async function saveAuthSettings(auth) {
  return adminFetch('/admin/settings/auth', {
    method: 'PUT',
    body: JSON.stringify(auth)
  })
}

export async function fetchFinanceSettings() {
  return adminFetch('/admin/settings/finance')
}

export async function saveFinanceSettings(finance) {
  return adminFetch('/admin/settings/finance', {
    method: 'PUT',
    body: JSON.stringify(finance)
  })
}

export async function fetchPlatformSettings() {
  const res = await fetch(`${API_BASE}/settings`)
  if (!res.ok) throw new Error('Failed to load settings')
  return res.json()
}
