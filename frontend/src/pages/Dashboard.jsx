import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MdFolder, MdLink, MdDownload, MdSecurity, MdWarning, MdUpload, MdShare, MdCheck, MdClose, MdRefresh } from 'react-icons/md'
import Header from '../components/Header'
import UploadModal from '../components/UploadModal'
import ShareModal from '../components/ShareModal'
import { getFileType, formatSize, formatTime, LOG_TYPES } from '../utils/fileUtils'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './Dashboard.css'

const Skeleton = ({ width = '100%', height = 16, radius = 6, style = {} }) => (
  <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />
)

const StatCard = ({ icon, label, value, sub, accent, delay, loading }) => (
  <div className="stat-card" style={{ animationDelay: `${delay}s` }}>
    <div className="stat-icon" style={{ background: `${accent}14`, border: `1px solid ${accent}25`, color: accent }}>
      {icon}
    </div>
    <div className="stat-body">
      {loading
        ? <><Skeleton width={60} height={28} style={{ marginBottom: 8 }} /><Skeleton width={80} height={12} /></>
        : <><div className="stat-value">{value}</div><div className="stat-label">{label}</div>{sub && <div className="stat-sub">{sub}</div>}</>
      }
    </div>
  </div>
)

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading]       = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [shareFile, setShareFile]   = useState(null)
  const [search, setSearch]         = useState('')

  // Real data states
  const [stats, setStats]           = useState({ totalFiles: 0, activeLinks: 0, totalDownloads: 0, storageUsed: 0, storageTotal: 0 })
  const [recentFiles, setRecentFiles] = useState([])
  const [recentLogs, setRecentLogs]   = useState([])

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const [filesRes, logsRes, shareRes] = await Promise.all([
        api.get('/files/stats'),
        api.get('/logs?limit=6'),
        api.get('/share'),
      ])

      const fs = filesRes.data.stats || {}
      setStats({
        totalFiles:     fs.totalFiles     || 0,
        activeLinks:    (shareRes.data.links || []).filter(l => !l.revoked).length,
        totalDownloads: fs.totalDownloads || 0,
        storageUsed:    fs.storageUsed    || 0,
        storageTotal:   fs.storageTotal   || (user?.storageTotal || 5 * 1024 * 1024 * 1024),
      })
      setRecentLogs(logsRes.data.logs || [])

      const filesListRes = await api.get('/files?limit=5&sort=-createdAt')
      setRecentFiles(filesListRes.data.files || [])
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const storageUsedGB   = (stats.storageUsed / (1024 ** 3)).toFixed(2)
  const storageTotalGB  = (stats.storageTotal / (1024 ** 3)).toFixed(0)
  const storageFreeGB   = ((stats.storageTotal - stats.storageUsed) / (1024 ** 3)).toFixed(2)
  const storagePercent  = stats.storageTotal > 0
    ? Math.min(100, ((stats.storageUsed / stats.storageTotal) * 100)).toFixed(1)
    : 0

  const filteredFiles = search
    ? recentFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : recentFiles

  const filteredLogs = search
    ? recentLogs.filter(l => (l.user?.name || l.action || '').toLowerCase().includes(search.toLowerCase()))
    : recentLogs

  const handleDownload = async (file) => {
    try {
      const token = localStorage.getItem('vs_token')
      const url = `/api/files/${file.id}/download`
      const a = document.createElement('a')
      a.href = url
      a.setAttribute('download', file.name)
      // Pass auth via fetch + blob
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const blob = await res.blob()
      a.href = URL.createObjectURL(blob)
      a.click()
      URL.revokeObjectURL(a.href)
      fetchDashboard()
    } catch (e) { console.error(e) }
  }

  return (
    <div className="page-content dashboard-page">
      <Header
        title={`Welcome, ${user?.name?.split(' ')[0] || 'User'} `}
        subtitle="Here's what's happening with your vault today"
        onSearch={setSearch}
        searchPlaceholder="Search files, activity..."
        actions={
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost" onClick={fetchDashboard} title="Refresh">
              <MdRefresh size={15} />
            </button>
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
              <MdUpload size={15} /> Upload File
            </button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="dash-stats">
        <StatCard loading={loading} icon={<MdFolder size={20} />}   label="Total Files"     value={stats.totalFiles}     sub="All encrypted"       accent="var(--accent-cyan)"   delay={0}    />
        <StatCard loading={loading} icon={<MdLink size={20} />}     label="Active Links"    value={stats.activeLinks}    sub="Shared & accessible" accent="var(--accent-purple)" delay={0.05} />
        <StatCard loading={loading} icon={<MdDownload size={20} />} label="Total Downloads" value={stats.totalDownloads} sub="Across all files"    accent="var(--accent-green)"  delay={0.1}  />
        <StatCard loading={loading} icon={<MdSecurity size={20} />} label="Security Score"  value={stats.totalFiles > 0 ? '98%' : '—'} sub="Your rating" accent="var(--accent-green)" delay={0.15} />
        <StatCard loading={loading} icon={<MdWarning size={20} />}  label="Blocked Attempts" value={0}                  sub="Past 24 hours"       accent="var(--accent-red)"    delay={0.2}  />
      </div>

      <div className="dash-row">
        {/* Storage Ring */}
        <div className="card dash-storage-card">
          <div className="card-title">Storage Overview</div>
          {loading ? (
            <><Skeleton width={130} height={130} radius={65} style={{ margin: '8px auto 20px' }} /><Skeleton height={12} style={{ marginBottom: 8 }} /><Skeleton height={12} style={{ marginBottom: 8 }} /></>
          ) : (
            <>
              <div className="storage-ring-wrap">
                <svg className="storage-ring" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-hover)" strokeWidth="10"/>
                  <circle cx="60" cy="60" r="50" fill="none"
                    stroke="var(--accent-cyan)" strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - storagePercent / 100)}`}
                    strokeLinecap="round" transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 1s ease', filter: 'drop-shadow(0 0 6px var(--accent-cyan))' }}
                  />
                </svg>
                <div className="storage-ring-label">
                  <div className="storage-pct">{storagePercent}%</div>
                  <div className="storage-pct-sub">used</div>
                </div>
              </div>
              <div className="storage-details">
                <div className="storage-row"><span>Used</span><span className="storage-val">{storageUsedGB} GB</span></div>
                <div className="storage-row"><span>Free</span><span className="storage-val">{storageFreeGB} GB</span></div>
                <div className="storage-row"><span>Total</span><span className="storage-val">{storageTotalGB} GB</span></div>
              </div>
            </>
          )}
        </div>

        {/* Security Status */}
        <div className="card dash-security-card">
          <div className="card-title">Security Status</div>
          {loading ? (
            <><Skeleton width={100} height={56} style={{ marginBottom: 16 }} />{[...Array(6)].map((_, i) => <Skeleton key={i} height={14} style={{ marginBottom: 10 }} />)}</>
          ) : (
            <>
              <div className="security-score-wrap">
                <div className="security-score" style={{ color: 'var(--accent-green)' }}>98</div>
                <div className="security-score-label">/ 100</div>
                <div className="badge badge-green" style={{ marginLeft:'auto' }}>Excellent</div>
              </div>
              <div className="security-checks">
                {[
                  { label: 'AES-256 Encryption',      ok: true  },
                  { label: 'JWT Authentication',       ok: true  },
                  { label: 'Password-Protected Links', ok: true  },
                  { label: 'Access Logging',           ok: true  },
                  { label: 'IP Whitelisting',          ok: false },
                  { label: 'Expiring Links Active',    ok: true  },
                ].map((c, i) => (
                  <div key={i} className="security-check-row">
                    <span className={`check-icon ${c.ok ? 'check-ok' : 'check-warn'}`}>{c.ok ? <MdCheck size={11} /> : <MdClose size={11} />}</span>
                    <span className="check-label">{c.label}</span>
                    <span className={`check-status ${c.ok ? 'check-status--ok' : 'check-status--warn'}`}>{c.ok ? 'Active' : 'Off'}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card dash-logs-card">
          <div className="card-title-row">
            <div className="card-title">Recent Activity</div>
            <Link to="/logs" className="card-link">View all →</Link>
          </div>
          {loading ? (
            [...Array(5)].map((_, i) => <Skeleton key={i} height={40} style={{ marginBottom: 10, borderRadius: 8 }} />)
          ) : filteredLogs.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon"><MdDownload size={48} style={{opacity:0.3}} /></div>
              <div className="empty-state-title" style={{ fontSize: 14 }}>No activity yet</div>
              <div className="empty-state-desc">Actions you take will appear here</div>
            </div>
          ) : (
            <div className="activity-list">
              {filteredLogs.map(log => {
                const t = LOG_TYPES[log.action] || { label: log.action, color: 'cyan' }
                return (
                  <div key={log._id} className="activity-item">
                    <div className={`activity-dot activity-dot--${t.color}`} />
                    <div className="activity-body">
                      <div className="activity-desc">
                        <span className="activity-type">{t.label}</span>
                        {log.file?.name && <> — <span className="activity-file">{log.file.name}</span></>}
                      </div>
                      <div className="activity-meta">{log.user?.name || 'System'} · {log.ip || '—'}</div>
                    </div>
                    <div className="activity-time">{formatTime(log.createdAt)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Files */}
      <div className="card" style={{ marginTop: 28 }}>
        <div className="card-title-row" style={{ marginBottom: 20 }}>
          <div className="card-title">Recent Files</div>
          <Link to="/files" className="card-link">View all →</Link>
        </div>
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} height={44} style={{ marginBottom: 10, borderRadius: 8 }} />)
        ) : filteredFiles.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0' }}>
            <div className="empty-state-icon"><MdFolder size={48} style={{opacity:0.3}} /></div>
            <div className="empty-state-title" style={{ fontSize: 14 }}>No files yet</div>
            <div className="empty-state-desc">Upload your first file to get started</div>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowUpload(true)}>
              <MdUpload size={15} /> Upload File
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>File</th><th>Size</th><th>Uploaded</th><th>Status</th><th>Downloads</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredFiles.map(f => {
                const ft = getFileType(f.name)
                return (
                  <tr key={f.id}>
                    <td>
                      <div className="file-cell">
                        <span className="file-type-badge" style={{ background: `${ft.color}18`, color: ft.color, border: `1px solid ${ft.color}30` }}>{ft.icon}</span>
                        <div>
                          <div style={{ color:'var(--text-primary)', fontWeight:600, fontSize:13 }}>{f.name}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Encrypted</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatSize(f.size)}</td>
                    <td>{formatTime(f.uploadedAt)}</td>
                    <td>{f.shared ? <span className="badge badge-cyan">Shared</span> : <span className="badge badge-amber">Private</span>}</td>
                    <td><span style={{ color:'var(--text-primary)', fontWeight:600 }}>{f.downloads}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn-icon" onClick={() => setShareFile(f)}><MdShare size={15} /></button>
                        <button className="btn-icon" onClick={() => handleDownload(f)}><MdDownload size={15} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={fetchDashboard} />}
      {shareFile && <ShareModal file={shareFile} onClose={() => { setShareFile(null); fetchDashboard() }} onShared={fetchDashboard} />}
    </div>
  )
}
