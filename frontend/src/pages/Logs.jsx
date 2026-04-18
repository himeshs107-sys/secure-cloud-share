import React, { useState } from 'react'
import { MdDownload, MdWarning, MdAssignment, MdDateRange, MdSecurity, MdSearch, MdSettings, MdPerson } from 'react-icons/md'
import Header from '../components/Header'
import { mockLogs, LOG_TYPES, formatTime } from '../utils/mockData'
import { useAuth } from '../context/AuthContext'
import './Logs.css'

const ALL_TYPES = ['All', ...Object.keys(LOG_TYPES)]

// Map log type keys to react-icons; types without a good match keep their text icon
const LOG_ICONS = {
  upload:     <MdDownload size={12} style={{transform:'rotate(180deg)'}} />,
  download:   <MdDownload size={12} />,
  share:      null,
  delete:     null,
  view:       null,
  login:      null,
  logout:     null,
  failedAuth: <MdWarning size={12} />,
  expire:     null,
}

export default function Logs() {
  const { user }   = useAuth()
  const isAdmin    = user?.role === 'admin'
  const [typeFilter, setTypeFilter] = useState('All')
  const [search, setSearch]         = useState('')

  const allLogs = isAdmin ? mockLogs : []
  const filtered = allLogs.filter(log => {
    if (typeFilter !== 'All' && log.type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return log.user.toLowerCase().includes(q) || (log.file || '').toLowerCase().includes(q) || log.ip.includes(q)
    }
    return true
  })

  const failed    = allLogs.filter(l => l.status === 'failed').length
  const today     = allLogs.filter(l => new Date(l.time).toDateString() === new Date().toDateString()).length
  const downloads = allLogs.filter(l => l.type === 'download').length

  const stats = [
    { label: 'Total Events',      value: allLogs.length, icon: <MdAssignment size={20} />, color: 'var(--accent-cyan)'   },
    { label: "Today's Activity",  value: today,           icon: <MdDateRange size={20} />,  color: 'var(--accent-green)'  },
    { label: 'Downloads',         value: downloads,       icon: <MdDownload size={20} />,   color: 'var(--accent-purple)' },
    { label: 'Security Alerts',   value: failed,          icon: <MdSecurity size={20} />,   color: 'var(--accent-red)'    },
  ]

  return (
    <div className="page-content logs-page">
      <Header
        title="Access Logs"
        subtitle="Complete audit trail of all vault activity"
        onSearch={setSearch}
        searchPlaceholder="Search by user, file, or IP..."
        actions={
          <button className="btn btn-ghost"><MdDownload size={14} /> Export CSV</button>
        }
      />

      {failed > 0 && (
        <div className="security-alert">
          <MdWarning className="alert-icon" size={22} style={{color:'var(--accent-red)',flexShrink:0}} />
          <div className="alert-body">
            <div className="alert-title">{failed} Failed Authentication Attempt{failed > 1 ? 's' : ''} Detected</div>
            <div className="alert-sub">Suspicious activity detected from unknown IP addresses. Review the logs below.</div>
          </div>
          <button className="btn btn-danger btn-sm">View Threats</button>
        </div>
      )}

      <div className="log-stats">
        {stats.map((s, i) => (
          <div key={i} className="log-stat-card" style={{ borderColor: `${s.color}20` }}>
            <span style={{ color: s.color }}>{s.icon}</span>
            <div>
              <div className="log-stat-val" style={{ color: s.color }}>{s.value}</div>
              <div className="log-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="logs-toolbar">
        <div className="log-type-filters">
          {ALL_TYPES.map(t => {
            const info = LOG_TYPES[t]
            return (
              <button key={t} className={`log-filter-btn ${typeFilter === t ? 'log-filter-btn--active' : ''}`} onClick={() => setTypeFilter(t)}>
                {info && LOG_ICONS[t] && <span>{LOG_ICONS[t]}</span>}
                {t === 'All' ? 'All Events' : info?.label}
              </button>
            )
          })}
        </div>
        <div className="log-search-wrap">
          <MdSearch size={15} style={{opacity:0.4,flexShrink:0}} />
          <input className="log-search" type="text" placeholder="Search by user, file, or IP..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card logs-table-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Event</th><th>User</th><th>File</th>
              <th>IP Address</th><th>Location</th><th>Time</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => {
              const t = LOG_TYPES[log.type]
              const isAlert = log.status === 'failed'
              return (
                <tr key={log.id} className={`log-row ${isAlert ? 'log-row--alert' : ''}`}>
                  <td>
                    <div className="log-event-cell">
                      <span className={`log-event-badge log-event-badge--${t.color}`}>
                        {LOG_ICONS[log.type] || null} {t.label}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="log-user-cell">
                      <div className="log-user-avatar">
                        {log.user === 'system' ? <MdSettings size={12} /> : log.user === 'unknown' ? <MdPerson size={12} /> : log.user[0].toUpperCase()}
                      </div>
                      <span className="log-user-email">{log.user}</span>
                    </div>
                  </td>
                  <td>
                    {log.file ? <span className="log-file">{log.file}</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>-</span>}
                  </td>
                  <td><span className="log-ip">{log.ip}</span></td>
                  <td><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{log.geo}</span></td>
                  <td><span className="log-time">{formatTime(log.time)}</span></td>
                  <td>
                    <span className={`badge ${log.status === 'success' ? 'badge-green' : log.status === 'failed' ? 'badge-red' : 'badge-amber'}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty-state" style={{ padding: '60px 40px' }}>
            <div className="empty-state-icon"><MdAssignment size={52} style={{opacity:0.22}} /></div>
            <div className="empty-state-title">No log entries found</div>
            <div className="empty-state-desc">Try adjusting your filters</div>
          </div>
        )}
      </div>

      <div className="logs-mobile-list">
        {filtered.map(log => {
          const t = LOG_TYPES[log.type]
          const isAlert = log.status === 'failed'
          return (
            <div key={log.id} className={`card log-mobile-card ${isAlert ? 'log-mobile-card--alert' : ''}`}>
              <div className="log-mobile-top">
                <span className={`log-event-badge log-event-badge--${t.color}`}>
                  {LOG_ICONS[log.type] || null} {t.label}
                </span>
                <span className={`badge ${log.status === 'success' ? 'badge-green' : log.status === 'failed' ? 'badge-red' : 'badge-amber'}`}>
                  {log.status}
                </span>
              </div>

              <div className="log-mobile-user">
                <div className="log-user-avatar">
                  {log.user === 'system' ? <MdSettings size={12} /> : log.user === 'unknown' ? <MdPerson size={12} /> : log.user[0].toUpperCase()}
                </div>
                <div className="log-mobile-user-copy">
                  <div className="log-mobile-label">User</div>
                  <div className="log-user-email">{log.user}</div>
                </div>
              </div>

              <div className="log-mobile-grid">
                <div className="log-mobile-item">
                  <div className="log-mobile-label">File</div>
                  <div className="log-mobile-value">{log.file ? <span className="log-file log-file--mobile">{log.file}</span> : '-'}</div>
                </div>
                <div className="log-mobile-item">
                  <div className="log-mobile-label">IP Address</div>
                  <div className="log-mobile-value"><span className="log-ip">{log.ip}</span></div>
                </div>
                <div className="log-mobile-item">
                  <div className="log-mobile-label">Location</div>
                  <div className="log-mobile-value">{log.geo}</div>
                </div>
                <div className="log-mobile-item">
                  <div className="log-mobile-label">Time</div>
                  <div className="log-mobile-value"><span className="log-time">{formatTime(log.time)}</span></div>
                </div>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="card">
            <div className="empty-state" style={{ padding: '60px 24px' }}>
              <div className="empty-state-icon"><MdAssignment size={52} style={{opacity:0.22}} /></div>
              <div className="empty-state-title">No log entries found</div>
              <div className="empty-state-desc">Try adjusting your filters</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
