import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Login from './components/Login'
import { initPlatformData } from './services/dataService'
import { fetchMe, getSessionToken, getSessionUser } from './services/authService'
import './index.css'

function renderLoading(message) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      color: '#486581'
    }}>
      {message}
    </div>
  )
}

function renderError(error) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <div style={{
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      color: '#9b1c1c',
      maxWidth: 560,
      margin: '4rem auto'
    }}>
      <h2>Failed to load platform data</h2>
      <p>{error.message}</p>
      <p style={{ color: '#486581', fontSize: '0.9rem' }}>
        Start the API with <code>cd backend && npm run dev</code>, or set{' '}
        <code>VITE_USE_MOCK=true</code> in frontend/.env.development
      </p>
    </div>
  )
}

function renderLogin(onSuccess) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <Login onSuccess={onSuccess} />
    </React.StrictMode>
  )
}

async function loadApp(user) {
  renderLoading('Loading platform data…')
  try {
    const { source } = await initPlatformData()
    window.__PLATFORM_DATA_SOURCE__ = source
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App dataSource={source} user={user} />
      </React.StrictMode>
    )
  } catch (err) {
    console.error(err)
    if (err.code === 'AUTH_REQUIRED') {
      renderLogin(async (result) => loadApp(result.user))
      return
    }
    renderError(err)
  }
}

async function bootstrap() {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await loadApp({ username: 'mock', role: 'admin', name: 'Mock Admin' })
    return
  }

  renderLoading('Checking session…')
  try {
    const me = await fetchMe()
    if (me.authDisabled || me.authenticated) {
      await loadApp(me.user || getSessionUser() || { username: 'local', role: 'admin', name: 'Local' })
      return
    }
  } catch {
    /* fall through to login */
  }

  if (!getSessionToken()) {
    renderLogin(async (result) => loadApp(result.user))
    return
  }

  await loadApp(getSessionUser())
}

bootstrap()
