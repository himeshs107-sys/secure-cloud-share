import React, { useState, useEffect, useCallback } from 'react'
import { MdLink, MdDownload, MdKey, MdAccessTime, MdLock, MdCheck, MdContentCopy, MdRefresh, MdBlock, MdClose } from 'react-icons/md'
import Header from '../components/Header'
import { getFileType, formatSize, formatTime } from '../utils/fileUtils'
import api from '../utils/api'
import './Shared.css'

export default function Shared() {
  const [links, setLinks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState(null)
  const [revokeId, setRevokeId] = useState(null)
  const [revoking, setRevoking] = useState(false)

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/share')
      setLinks(res.data.links || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  const copyLink = (id, shareUrl) => {
    navigator.clipboard.writeText(shareUrl).catch(() => {})
    setCopied(id)
    setTimeout(() => setCopied(null), 2500)
  }

  const revokeLink = async (id) => {
    setRevoking(true)
    try {
      await api.delete(`/share/${id}/revoke`)
      setLinks(prev => prev.filter(l => l.id !== id))
      setRevokeId(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke link')
    } finally {
      setRevoking(false)
    }
  }

  const isExpired      = (date) => date && new Date(date) < new Date()
  const isExpiringSoon = (date) => date && !isExpired(date) && new Date(date) < new Date(Date.now() + 7 * 86400000)

  const activeLinks = links.filter(l => !l.revoked)

  const stats = [
    { label: 'Active Links',       value: activeLinks.length,                                          icon: <MdLink size={20} />,       color: 'var(--accent-cyan)'   },
    { label: 'Total Downloads',    value: activeLinks.reduce((s, l) => s + (l.downloadCount || 0), 0), icon: <MdDownload size={20} />,   color: 'var(--accent-green)'  },
    { label: 'Password Protected', value: activeLinks.filter(l => l.passwordProtected).length,         icon: <MdKey size={20} />,        color: 'var(--accent-amber)'  },
    { label: 'Expiring Soon',      value: activeLinks.filter(l => isExpiringSoon(l.expiresAt)).length, icon: <MdAccessTime size={20} />, color: 'var(--accent-red)'    },
  ]

  return (
    <div className="page-content shared-page">
      <Header
        title="Shared Links"
        subtitle={`${activeLinks.length} active share links`}
        actions={<button className="btn btn-ghost" onClick={fetchLinks}><MdRefresh size={15} /></button>}
      />

      <div className="shared-stats">
        {stats.map((s, i) => (
          <div key={i} className="shared-stat" style={{ borderColor: `${s.color}20`, background: `${s.color}05` }}>
            <span className="shared-stat-icon" style={{ color: s.color }}>{s.icon}</span>
            <div>
              <div className="shared-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="shared-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ padding: 24 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 44, background: 'var(--bg-hover)', borderRadius: 8, marginBottom: 10, opacity: 0.5 }} />
          ))}
        </div>
      ) : activeLinks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><MdLink size={52} style={{opacity:0.22}} /></div>
          <div className="empty-state-title">No active share links</div>
          <div className="empty-state-desc">Go to My Files and share a file to get started</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>File</th><th>Share Link</th><th>Permission</th>
                <th>Security</th><th>Expiry</th><th>Downloads</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeLinks.map(l => {
                const fileName = l.file?.name || 'Unknown'
                const ft = getFileType(fileName)
                const expired = isExpired(l.expiresAt)
                const expiringSoon = isExpiringSoon(l.expiresAt)
                return (
                  <tr key={l.id} className={expired ? 'row--expired' : ''}>
                    <td>
                      <div className="file-cell">
                        <span className="file-type-badge" style={{ background: `${ft.color}18`, color: ft.color, border: `1px solid ${ft.color}30` }}>{ft.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{fileName}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatSize(l.file?.size)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="link-cell">
                        <span className="link-preview">{l.shareUrl}</span>
                        <button className={`copy-mini-btn ${copied === l.id ? 'copy-mini-btn--ok' : ''}`} onClick={() => copyLink(l.id, l.shareUrl)}>
                          {copied === l.id ? <MdCheck size={13} /> : <MdContentCopy size={13} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${l.permission === 'view' ? 'badge-amber' : l.permission === 'download' ? 'badge-cyan' : 'badge-purple'}`} style={{ textTransform: 'capitalize' }}>
                        {l.permission}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <MdLock size={15} title="Encrypted" style={{color:'var(--accent-cyan)',opacity:0.7}} />
                        {l.passwordProtected && <MdKey size={15} title="Password Protected" style={{color:'var(--accent-amber)',opacity:0.8}} />}
                      </div>
                    </td>
                    <td>
                      {!l.expiresAt ? (
                        <span className="badge badge-green">Never</span>
                      ) : expired ? (
                        <span className="badge badge-red">Expired</span>
                      ) : expiringSoon ? (
                        <span className="badge badge-amber"><MdAccessTime size={11} /> {formatTime(l.expiresAt)}</span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatTime(l.expiresAt)}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700 }}>{l.downloadCount || 0}</span>
                        {l.maxDownloads && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ {l.maxDownloads}</span>}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>dl</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" onClick={() => copyLink(l.id, l.shareUrl)}>
                          {copied === l.id ? <MdCheck size={15} /> : <MdContentCopy size={15} />}
                        </button>
                        <button className="btn-icon" title="Revoke" style={{ color: 'var(--accent-red)' }} onClick={() => setRevokeId(l.id)}>
                          <MdBlock size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {revokeId && (
        <div className="modal-overlay" onClick={() => setRevokeId(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><MdBlock size={16} style={{marginRight:6,verticalAlign:'middle',color:'var(--accent-red)'}} />Revoke Link</div>
              <button className="modal-close" onClick={() => setRevokeId(null)}><MdClose size={16} /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              This will permanently disable this share link. Anyone who has it will no longer be able to access the file.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setRevokeId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => revokeLink(revokeId)} disabled={revoking}>
                {revoking ? 'Revoking…' : 'Revoke Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
