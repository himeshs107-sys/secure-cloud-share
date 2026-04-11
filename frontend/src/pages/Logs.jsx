import React, { useState, useEffect, useCallback } from 'react'
import { MdDownload, MdWarning, MdAssignment, MdDateRange, MdSecurity, MdSearch, MdSettings, MdPerson, MdRefresh } from 'react-icons/md'
import Header from '../components/Header'
import { LOG_TYPES, formatTime } from '../utils/fileUtils'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './Logs.css'

const ALL_ACTIONS = ['All', 'upload', 'download', 'share', 'delete', 'view', 'login', 'register', 'revoke']

export default function Logs() {
  const { user }     = useAuth()
  const isAdmin      = user?.role === 'admin'
  const [logs, setLogs]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [typeFilter, setTypeFilter] = useState('All')
  const [search, setSearch]         = useState('')
  const [expanded, setExpanded]     = useState(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const endpoint = isAdmin ? '/logs/all' : '/logs'
      const res = await api.get(endpoint, { params: { limit: 100, action: typeFilter !== 'All' ? typeFilter : undefined } })
      setLogs(res.data.logs || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, typeFilter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const filtered = logs.filter(log => {
    if (!search) return true
    const q = search.toLowerCase()
    const userName  = log.user?.name  || log.user?.email || ''
    const fileName  = log.file?.name  || ''
    const ip        = log.ip          || ''
    return userName.toLowerCase().includes(q) || fileName.toLowerCase().includes(q) || ip.includes(q)
  })

  const failed    = logs.filter(l => l.status === 'failed' || l.status === 'denied').length
  const todayLogs = logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length
  const downloads = logs.filter(l => l.action === 'download').length

  const stats = [
    { label: 'Total Events',     value: logs.length, icon: <MdAssignment size={20} />, color: 'var(--accent-cyan)'   },
    { label: "Today's Activity", value: todayLogs,   icon: <MdDateRange size={20} />,  color: 'var(--accent-green)'  },
    { label: 'Downloads',        value: downloads,   icon: <MdDownload size={20} />,   color: 'var(--accent-purple)' },
    { label: 'Security Alerts',  value: failed,      icon: <MdSecurity size={20} />,   color: 'var(--accent-red)'    },
  ]

  return (
    <div className="page-content logs-page">
      <Header
        title="Access Logs"
        subtitle="Complete audit trail of all vault activity"
        onSearch={setSearch}
        searchPlaceholder="Search by user, file, or IP..."
        actions={<button className="btn btn-ghost" onClick={fetchLogs}><MdRefresh size={15} /></button>}
      />

      {failed > 0 && (
        <div className="security-alert">
          <MdWarning className="alert-icon" size={22} style={{color:'var(--accent-red)',flexShrink:0}} />
          <div className="alert-body">
            <div className="alert-title">{failed} Security Alert{failed > 1 ? 's' : ''} Detected</div>
            <div className="alert-sub">Failed or denied access attempts found. Review the logs below.</div>
          </div>
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
          {ALL_ACTIONS.map(t => (
            <button key={t} className={`log-filter-btn ${typeFilter === t ? 'log-filter-btn--active' : ''}`} onClick={() => setTypeFilter(t)}>
              {t === 'All' ? 'All Events' : (LOG_TYPES[t]?.label || t)}
            </button>
          ))}
        </div>
        <div className="log-search-wrap">
          <MdSearch size={15} style={{opacity:0.4,flexShrink:0}} />
          <input className="log-search" type="text" placeholder="Search by user, file, or IP..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 44, background: 'var(--bg-hover)', borderRadius: 8, marginBottom: 10, opacity: 0.5 }} />
            ))}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th><th>User</th><th>File</th>
                <th>IP Address</th><th>Time</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const t = LOG_TYPES[log.action] || { label: log.action, color: 'cyan' }
                const isAlert = log.status === 'failed' || log.status === 'denied'
                const userName = log.user?.name || log.user?.email || 'System'
                const userInitial = userName[0]?.toUpperCase() || 'S'
                return (
                  <tr
                    key={log._id}
                    className={`log-row ${isAlert ? 'log-row--alert' : ''} ${expanded === log._id ? 'log-row--expanded' : ''}`}
                    onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                  >
                    <td>
                      <div className="log-event-cell">
                        <span className={`log-event-badge log-event-badge--${t.color}`}>{t.label}</span>
                      </div>
                    </td>
                    <td>
                      <div className="log-user-cell">
                        <div className="log-user-avatar">{userInitial}</div>
                        <span className="log-user-email">{userName}</span>
                      </div>
                    </td>
                    <td>
                      {log.file?.name
                        ? <span className="log-file">{log.file.name}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                      }
                    </td>
                    <td><span className="log-ip">{log.ip || '—'}</span></td>
                    <td><span className="log-time">{formatTime(log.createdAt)}</span></td>
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
        )}
        {!loading && filtered.length === 0 && (
          <div className="empty-state" style={{ padding: '60px 40px' }}>
            <div className="empty-state-icon"><MdAssignment size={52} style={{opacity:0.22}} /></div>
            <div className="empty-state-title">No log entries found</div>
            <div className="empty-state-desc">Try adjusting your filters or perform some actions first</div>
          </div>
        )}
      </div>
    </div>
  )
}
