import React, { useMemo, useState } from 'react'
import {
  GLOBAL_OVERVIEW,
  GLOBAL_KPIS,
  CRITICAL_ISSUES,
  INSIGHTS,
  AGENT_SUMMARY,
  CLOUDS,
  ENVIRONMENTS,
  FINANCE_KPIS,
  UNIVERSE_COSTS,
  PLATFORM_LINKS,
  UNIVERSES,
  AUDIT_LOG
} from '../services/dataService'
import {
  DemoBanner,
  PageHeader,
  KpiCard,
  StatusDot,
  StatusBadge
} from './shared/PlatformUI'
import './OverviewDashboard.css'

const fmtUsd = (n) => `$${(n ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
const fmtPct = (n) => `${(n ?? 0).toFixed(1)}%`

const PERSONA_QUESTIONS = {
  admin: 'What needs attention across the estate right now?',
  dba: 'Which universes are unhealthy or drifting?',
  security: 'Where are critical vulns and expiring certificates?',
  operations: 'Which agents are down and what is on fire?',
  developer: 'Is my app’s database healthy?',
  viewer: 'What is the overall platform status?'
}

const OverviewDashboard = ({ onNavigate, onFilterUniverses, persona = 'admin' }) => {
  const [view, setView] = useState('summary')
  const financeReady = FINANCE_KPIS?.totalMonthlySpend != null

  const insights = useMemo(
    () => [...(INSIGHTS || [])].sort((a, b) => {
      const rank = { CRITICAL: 0, WARNING: 1, HEALTHY: 2 }
      return (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9)
    }),
    []
  )
  const criticalCount = insights.filter((i) => i.severity === 'CRITICAL').length

  const topUniverses = useMemo(
    () => [...UNIVERSE_COSTS].sort((a, b) => b.totalMonthly - a.totalMonthly).slice(0, 5),
    []
  )

  const spendByCloud = useMemo(() => {
    const map = {}
    for (const row of UNIVERSE_COSTS) {
      map[row.cloud] = (map[row.cloud] || 0) + row.totalMonthly
    }
    return map
  }, [])

  const overviewWithSpend = useMemo(() => {
    return GLOBAL_OVERVIEW.map((row) => {
      const spend = UNIVERSE_COSTS.filter(
        (u) => u.cloud === row.cloud && u.environment === row.env
      ).reduce((s, u) => s + u.totalMonthly, 0)
      return { ...row, monthlySpend: spend }
    })
  }, [])

  const recentActivity = useMemo(() => {
    const fromAudit = (AUDIT_LOG || []).slice(0, 4).map((e) => ({
      when: e.time || e.timestamp || '',
      detail: e.detail || `${e.actor || ''} ${e.action || ''} ${e.resourceType || ''}`.trim()
    }))
    if (fromAudit.length) return fromAudit
    return [
      { when: '10:31 AM', detail: 'jsmith approved provisioning for payments-prod' },
      { when: '09:15 AM', detail: 'Drift detected: security agent STOPPED on analytics-prod/node-01' },
      { when: '08:42 AM', detail: 'Certificate scan: 1 critical expiry within 15 days' },
      { when: 'Yesterday', detail: 'customer-prod-01 upgraded to YB 2.25.1.0' }
    ]
  }, [])

  const openExternal = (kind, universeId) => {
    const u = UNIVERSES.find((x) => x.id === universeId)
    const tpl =
      kind === 'yba'
        ? PLATFORM_LINKS?.ybaUrlTemplate || 'https://yba.example.com/universes/{id}'
        : PLATFORM_LINKS?.grafanaUrlTemplate || 'https://grafana.example.com/d/yb/{id}'
    const url = tpl
      .replace('{id}', encodeURIComponent(universeId || ''))
      .replace('{name}', encodeURIComponent(u?.name || ''))
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const avgPerUniverse = UNIVERSE_COSTS.length
    ? (FINANCE_KPIS.totalMonthlySpend || 0) / UNIVERSE_COSTS.length
    : 0
  const topSpender = topUniverses[0]

  return (
    <div className="platform-page">
      <PageHeader
        title="Global Overview"
        subtitle="Health, operations, and finance across AWS & Azure"
      />
      <DemoBanner />

      <div className="overview-segment" role="tablist" aria-label="Overview views">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'summary'}
          className={`overview-segment-btn ${view === 'summary' ? 'active' : ''}`}
          onClick={() => setView('summary')}
        >
          Summary
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'attention'}
          className={`overview-segment-btn ${view === 'attention' ? 'active' : ''}`}
          onClick={() => setView('attention')}
        >
          Attention
          {insights.length > 0 && (
            <span className={`overview-segment-count ${criticalCount > 0 ? 'hot' : ''}`}>
              {insights.length}
            </span>
          )}
        </button>
      </div>

      {view === 'summary' && (
        <>
          <div className="platform-kpi-row six">
            <KpiCard label="Universes" value={GLOBAL_KPIS.totalUniverses} />
            <KpiCard label="Nodes" value={GLOBAL_KPIS.totalNodes} />
            <KpiCard label="Healthy" value={GLOBAL_KPIS.healthy} tone="good" />
            <KpiCard label="Warning" value={GLOBAL_KPIS.warning} tone="warn" />
            <KpiCard label="Critical" value={GLOBAL_KPIS.critical} tone="bad" />
            <KpiCard
              label="Certs < 30d"
              value={GLOBAL_KPIS.certsExpiring30d}
              tone="warn"
              hint="Expiring soon"
            />
          </div>

          {insights.length > 0 && (
            <div className="overview-attention-callout">
              <div>
                <strong>{insights.length} ranked insight{insights.length === 1 ? '' : 's'}</strong>
                <span>
                  {criticalCount > 0 ? `${criticalCount} critical` : 'Review Why · Impact · What to do'}
                  {' · '}
                  {AGENT_SUMMARY.connected}/{AGENT_SUMMARY.total} agents connected
                </span>
              </div>
              <button type="button" className="btn-link" onClick={() => setView('attention')}>
                Open Attention →
              </button>
            </div>
          )}

          {financeReady && (
            <div className="overview-finance-block">
              <div className="overview-section-header">
                <div>
                  <h3>Finance &amp; chargeback</h3>
                  <p className="platform-subtitle">
                    Model B — {fmtPct(FINANCE_KPIS.avgUtilization)} avg utilization
                    {' · '}{FINANCE_KPIS.period || 'current period'}
                  </p>
                </div>
                <button type="button" className="btn-link" onClick={() => onNavigate?.('finance')}>
                  Open Finance tab →
                </button>
              </div>

              <div className="platform-kpi-row fit">
                <KpiCard label="Total spend" value={fmtUsd(FINANCE_KPIS.totalMonthlySpend)} hint="all universes" />
                <KpiCard label="Active pool" value={fmtUsd(FINANCE_KPIS.activePool)} tone="good" hint="allocated to DBs" />
                <KpiCard
                  label="Idle / reserved"
                  value={fmtUsd(FINANCE_KPIS.idlePool)}
                  tone="warn"
                  hint="unallocated capacity"
                />
                <KpiCard label="Avg utilization" value={fmtPct(FINANCE_KPIS.avgUtilization)} />
                <KpiCard label="Consumers" value={FINANCE_KPIS.consumerCount} hint="database teams" />
              </div>

              <div className="platform-grid-2">
                <div className="platform-card compact">
                  <h3>Top spend — universes</h3>
                  <table className="platform-table">
                    <thead>
                      <tr>
                        <th>Universe</th>
                        <th>Cloud</th>
                        <th>Env</th>
                        <th>Monthly</th>
                        <th>Util %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topUniverses.map((u) => (
                        <tr
                          key={u.universeId || u.id}
                          className="clickable"
                          onClick={() => onNavigate?.('universes', { universeId: u.universeId || u.id })}
                        >
                          <td>{u.name || u.universeName}</td>
                          <td>{u.cloud}</td>
                          <td>{u.environment || u.env}</td>
                          <td>{fmtUsd(u.totalMonthly)}</td>
                          <td>{fmtPct(u.utilizationPct ?? u.avgUtilization)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="platform-card compact">
                  <h3>Spend by cloud</h3>
                  <ul className="issue-list">
                    {Object.entries(spendByCloud).map(([cloud, spend]) => (
                      <li key={cloud}>
                        <strong>{cloud}</strong>
                        <span style={{ marginLeft: 'auto', color: '#486581' }}>{fmtUsd(spend)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="platform-subtitle" style={{ marginTop: '0.75rem' }}>
                    Top spender: {topSpender?.name || topSpender?.universeName || '—'}
                    {' · '}Avg per universe: {fmtUsd(avgPerUniverse)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="platform-grid-2" style={{ marginTop: '0.85rem' }}>
            <div className="platform-card">
              <h3>Cloud × environment</h3>
              <table className="platform-table">
                <thead>
                  <tr>
                    <th>Cloud</th>
                    <th>Environment</th>
                    <th>Universes</th>
                    <th>Nodes</th>
                    <th>Healthy</th>
                    <th>Warning</th>
                    <th>Critical</th>
                    {financeReady && <th>Monthly spend</th>}
                  </tr>
                </thead>
                <tbody>
                  {overviewWithSpend.map((row) => (
                    <tr
                      key={`${row.cloud}-${row.env}`}
                      className="clickable"
                      onClick={() => onFilterUniverses?.(row.cloud, row.env)}
                    >
                      <td>{row.cloud}</td>
                      <td>{row.env}</td>
                      <td>{row.universes}</td>
                      <td>{row.nodes}</td>
                      <td><span className="platform-pill ok">{row.healthy}</span></td>
                      <td><span className="platform-pill warn">{row.warning}</span></td>
                      <td><span className="platform-pill bad">{row.critical}</span></td>
                      {financeReady && <td>{fmtUsd(row.monthlySpend)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="platform-card">
              <h3>Critical Issues</h3>
              <ul className="issue-list">
                {(CRITICAL_ISSUES || []).map((issue, i) => (
                  <li
                    key={i}
                    className="clickable"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onNavigate?.('universes', { universeId: issue.universeId })}
                  >
                    <StatusDot status={issue.severity} />
                    <div>
                      <strong>{issue.universe}</strong>
                      <span style={{ color: '#627d98', marginLeft: 8, fontSize: '0.78rem' }}>
                        {issue.cloud} · {issue.env}
                      </span>
                      <div style={{ color: '#486581', marginTop: 2 }}>{issue.message}</div>
                    </div>
                  </li>
                ))}
                {!(CRITICAL_ISSUES || []).length && (
                  <li style={{ color: '#627d98' }}>No critical issues recorded.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="platform-grid-2" style={{ marginTop: '0.85rem' }}>
            {CLOUDS.map((cloud) => {
              const rows = GLOBAL_OVERVIEW.filter((r) => r.cloud === cloud)
              const total = rows.reduce((s, r) => s + r.universes, 0)
              const worst = rows.some((r) => r.critical > 0)
                ? 'CRITICAL'
                : rows.some((r) => r.warning > 0)
                  ? 'WARNING'
                  : 'HEALTHY'
              return (
                <div key={cloud} className="cloud-card">
                  <h4>
                    {cloud}{' '}
                    <StatusBadge status={worst} />
                    <span style={{ float: 'right', fontWeight: 400, fontSize: '0.85rem', color: '#627d98' }}>
                      {total} universes
                    </span>
                  </h4>
                  {ENVIRONMENTS.map((env) => {
                    const row = rows.find((r) => r.env === env)
                    if (!row) return null
                    const envStatus =
                      row.critical > 0 ? 'CRITICAL' : row.warning > 0 ? 'WARNING' : 'HEALTHY'
                    return (
                      <div
                        key={env}
                        className="env-row"
                        onClick={() => onFilterUniverses?.(cloud, env)}
                      >
                        <span>{env}</span>
                        <span>
                          <StatusDot status={envStatus} />
                          {row.universes} universes · {row.healthy}/{row.nodes} healthy
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <div className="platform-card compact" style={{ marginTop: '0.85rem' }}>
            <h3>Recent Activity</h3>
            <table className="platform-table">
              <tbody>
                {recentActivity.map((row, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: 'nowrap', color: '#627d98', width: '8rem' }}>
                      {typeof row.when === 'string' && row.when.includes('T')
                        ? new Date(row.when).toLocaleString()
                        : row.when}
                    </td>
                    <td>{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === 'attention' && (
        <div className="platform-card">
          <div className="overview-section-header">
            <div>
              <h3>Needs attention</h3>
              <p className="platform-subtitle">
                {PERSONA_QUESTIONS[persona] || PERSONA_QUESTIONS.admin}
                {' · '}Why · Impact · What to do
              </p>
            </div>
          </div>
          {insights.length === 0 ? (
            <p className="platform-subtitle">
              No ranked insights yet — sync YBA or run recompute from Settings → Integrations.
            </p>
          ) : (
            <ul className="insight-list">
              {insights.slice(0, 20).map((ins) => (
                <li key={ins.id} className="insight-item">
                  <div className="insight-head">
                    <StatusBadge status={ins.severity} />
                    <strong
                      className="clickable"
                      onClick={() => onNavigate?.('universes', { universeId: ins.universeId })}
                    >
                      {ins.title}
                    </strong>
                  </div>
                  <div className="insight-body">
                    <div><span className="insight-label">Why</span> {ins.why}</div>
                    <div><span className="insight-label">Impact</span> {ins.impact}</div>
                    <div><span className="insight-label">What to do</span> {ins.whatToDo}</div>
                  </div>
                  <div className="insight-actions">
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => onNavigate?.('universes', { universeId: ins.universeId })}
                    >
                      Open universe
                    </button>
                    <button type="button" className="btn-link" onClick={() => openExternal('yba', ins.universeId)}>
                      Open in YBA
                    </button>
                    <button type="button" className="btn-link" onClick={() => openExternal('grafana', ins.universeId)}>
                      Open in Grafana
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default OverviewDashboard
