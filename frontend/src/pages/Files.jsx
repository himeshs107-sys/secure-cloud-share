import React, { useState, useEffect, useCallback } from 'react'
import { MdUpload, MdDownload, MdDelete, MdShare, MdLock, MdKey, MdSearch, MdClose, MdFolder, MdCheck, MdViewList, MdGridView, MdRefresh } from 'react-icons/md'
import Header from '../components/Header'
import UploadModal from '../components/UploadModal'
import ShareModal from '../components/ShareModal'
import { getFileType, formatSize, formatTime } from '../utils/fileUtils'
import api from '../utils/api'
import './Files.css'

const FILTERS = ['All', 'Shared', 'Private', 'Encrypted']
const SORT_OPTIONS = ['Name', 'Size', 'Date', 'Downloads']

export default function Files() {
  const [files, setFiles]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('All')
  const [sort, setSort]             = useState('Date')
  const [viewMode, setViewMode]     = useState('list')
  const [showUpload, setShowUpload] = useState(false)
  const [shareFile, setShareFile]   = useState(null)
  const [selected, setSelected]     = useState(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const [search, setSearch]         = useState('')

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/files', { params: { search: search || undefined } })
      setFiles(res.data.files || [])
    } catch (err) {
      console.error('Files fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const filtered = files.filter(f => {
    if (filter === 'Shared')    return f.shared
    if (filter === 'Private')   return !f.shared
    if (filter === 'Encrypted') return f.encrypted
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'Name')      return a.name.localeCompare(b.name)
    if (sort === 'Size')      return b.size - a.size
    if (sort === 'Date')      return new Date(b.uploadedAt) - new Date(a.uploadedAt)
    if (sort === 'Downloads') return b.downloads - a.downloads
    return 0
  })

  const toggleSelect = (id) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    try {
      await api.delete(`/files/${id}`)
      setFiles(prev => prev.filter(f => f.id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    for (const id of selected) {
      try { await api.delete(`/files/${id}`) } catch {}
    }
    setFiles(prev => prev.filter(f => !selected.has(f.id)))
    setSelected(new Set())
  }

  const handleDownload = async (file) => {
    try {
      const token = localStorage.getItem('vs_token')
      const res = await fetch(`/api/files/${file.id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = file.name; a.click()
      URL.revokeObjectURL(url)
      fetchFiles()
    } catch (e) { alert('Download failed: ' + e.message) }
  }

  const totalSize = files.reduce((s, f) => s + (f.size || 0), 0)

  return (
    <div className="page-content files-page">
      <Header
        title="My Files"
        subtitle={`${files.length} file${files.length !== 1 ? 's' : ''} · ${formatSize(totalSize)} used`}
        onSearch={setSearch}
        searchPlaceholder="Search files, tags..."
        actions={
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost" onClick={fetchFiles}><MdRefresh size={15} /></button>
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
              <MdUpload size={15} /> Upload
            </button>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="files-toolbar">
        <div className="filter-tabs">
          {FILTERS.map(f => (
            <button key={f} className={`filter-tab ${filter === f ? 'filter-tab--active' : ''}`} onClick={() => setFilter(f)}>
              {f}
              {f === 'All' && <span className="filter-count">{files.length}</span>}
            </button>
          ))}
        </div>
        <div className="file-search-wrap">
          <span style={{fontSize:13,opacity:0.5}}><MdSearch size={15} /></span>
          <input className="file-search" placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="search-clear" onClick={() => setSearch('')}><MdClose size={13} /></button>}
        </div>
        <div className="toolbar-right">
          {selected.size > 0 && (
            <div className="bulk-actions">
              <span className="bulk-label">{selected.size} selected</span>
              <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}><MdDelete size={14} /> Delete</button>
            </div>
          )}
          <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o} value={o}>Sort: {o}</option>)}
          </select>
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'list' ? 'view-btn--active' : ''}`} onClick={() => setViewMode('list')}><MdViewList size={17} /></button>
            <button className={`view-btn ${viewMode === 'grid' ? 'view-btn--active' : ''}`} onClick={() => setViewMode('grid')}><MdGridView size={17} /></button>
          </div>
        </div>
      </div>

      {/* Files List / Grid */}
      {loading ? (
        <div className="card" style={{ padding: 24 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 44, background: 'var(--bg-hover)', borderRadius: 8, marginBottom: 10, opacity: 0.5 }} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><MdFolder size={52} style={{opacity:0.25}} /></div>
          <div className="empty-state-title">No files here</div>
          <div className="empty-state-desc">Upload your first file or change the filter</div>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}><MdUpload size={15} /> Upload File</button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox"
                    checked={selected.size === sorted.length && sorted.length > 0}
                    onChange={e => setSelected(e.target.checked ? new Set(sorted.map(f => f.id)) : new Set())}
                  />
                </th>
                <th>File Name</th><th>Size</th><th>Uploaded</th><th>Owner</th>
                <th>Status</th><th>Security</th><th>Downloads</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(f => {
                const ft = getFileType(f.name)
                return (
                  <tr key={f.id} className={selected.has(f.id) ? 'row--selected' : ''}>
                    <td><input type="checkbox" checked={selected.has(f.id)} onChange={() => toggleSelect(f.id)} /></td>
                    <td>
                      <div className="file-cell">
                        <span className="file-type-badge" style={{ background: `${ft.color}18`, color: ft.color, border: `1px solid ${ft.color}30` }}>{ft.icon}</span>
                        <div>
                          <div className="file-name">{f.name}</div>
                          {f.tags?.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                              {f.tags.map(t => <span key={t} className="tag">{t}</span>)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className="mono-text">{formatSize(f.size)}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatTime(f.uploadedAt)}</td>
                    <td style={{ fontSize: 12 }}>{typeof f.owner === 'object' ? f.owner?.name : f.owner}</td>
                    <td>
                      {f.shared
                        ? <span className="badge badge-cyan">Shared</span>
                        : <span className="badge badge-amber">Private</span>
                      }
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {f.encrypted && <MdLock size={15} title="Encrypted" style={{color:'var(--accent-cyan)',opacity:0.7}} />}
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{f.downloads}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" title="Share" onClick={() => setShareFile(f)}><MdShare size={15} /></button>
                        <button className="btn-icon" title="Download" onClick={() => handleDownload(f)}><MdDownload size={15} /></button>
                        <button className="btn-icon" title="Delete" onClick={() => setDeleteConfirm(f)} style={{ color: 'var(--accent-red)' }}><MdDelete size={15} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="files-grid">
          {sorted.map(f => {
            const ft = getFileType(f.name)
            return (
              <div key={f.id} className="file-card">
                <div className="file-card-top">
                  <div className="file-card-icon">
                    <span className="file-type-badge file-type-badge--lg" style={{ background: `${ft.color}18`, color: ft.color, border: `1px solid ${ft.color}30` }}>{ft.icon}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {f.encrypted && <MdLock size={15} title="Encrypted" style={{color:'var(--accent-cyan)',opacity:0.7}} />}
                  </div>
                </div>
                <div className="file-card-name">{f.name}</div>
                <div className="file-card-meta">
                  <span>{formatSize(f.size)}</span><span>·</span><span>{f.downloads} downloads</span>
                </div>
                {f.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                    {f.tags.slice(0,2).map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                )}
                <div className="file-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setShareFile(f)}><MdShare size={14} /> Share</button>
                  <button className="btn-icon" title="Download" onClick={() => handleDownload(f)}><MdDownload size={15} /></button>
                  <button className="btn-icon" title="Delete" onClick={() => setDeleteConfirm(f)}><MdDelete size={15} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><MdDelete size={16} style={{marginRight:6,verticalAlign:'middle'}} />Delete File</div>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}><MdClose size={16} /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Are you sure you want to delete:</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>"{deleteConfirm.name}"</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={fetchFiles} />}
      {shareFile && <ShareModal file={shareFile} onClose={() => { setShareFile(null); fetchFiles() }} onShared={fetchFiles} />}
    </div>
  )
}
