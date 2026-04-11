import React, { useState, useRef } from 'react'
import { MdLink, MdClose, MdVisibility, MdDownload, MdEdit, MdLock, MdCheck, MdContentCopy, MdAccessTime, MdKey, MdArrowBack } from 'react-icons/md'
import api from '../utils/api'
import './ShareModal.css'

export default function ShareModal({ file, onClose, onShared }) {
  const [step, setStep]               = useState(1)
  const [expiry, setExpiry]           = useState('7')
  const [maxDownloads, setMaxDownloads] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword]       = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [permissions, setPermissions] = useState('view')
  const [copied, setCopied]           = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError]             = useState('')
  const generatedLinkRef              = useRef('')

  const handleGenerate = async () => {
    if (usePassword && !password.trim()) {
      setError('Please enter a password or disable password protection.')
      return
    }
    setError('')
    setIsGenerating(true)
    try {
      const res = await api.post('/share', {
        fileId:       file.id,
        permission:   permissions,
        expiryDays:   parseInt(expiry) || 0,
        maxDownloads: maxDownloads ? parseInt(maxDownloads) : null,
        password:     usePassword ? password : null,
      })
      generatedLinkRef.current = res.data.shareUrl
      setStep(2)
      // Fix 6: notify parent immediately so stats refresh
      onShared?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate share link.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLinkRef.current).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const permIcons = {
    view:     <MdVisibility size={16} />,
    download: <MdDownload size={16} />,
    edit:     <MdEdit size={16} />,
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <div className="modal-title"><MdLink size={16} style={{marginRight:6,verticalAlign:'middle'}} />Share File</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{file?.name}</div>
          </div>
          <button className="modal-close" onClick={onClose}><MdClose size={16} /></button>
        </div>

        {step === 1 && (
          <div className="share-config">
            {error && (
              <div style={{ background:'var(--accent-red)15', border:'1px solid var(--accent-red)30', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'var(--accent-red)' }}>
                {error}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Access Permission</label>
              <div className="perm-grid">
                {['view', 'download', 'edit'].map(p => (
                  <button key={p} className={`perm-btn ${permissions === p ? 'perm-btn--active' : ''}`} onClick={() => setPermissions(p)}>
                    {permIcons[p]}
                    <span style={{ textTransform: 'capitalize' }}>{p}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Link Expiration</label>
              <div className="expiry-grid">
                {[{label:'1 Day',val:'1'},{label:'7 Days',val:'7'},{label:'30 Days',val:'30'},{label:'Never',val:'0'}].map(opt => (
                  <button key={opt.val} className={`expiry-btn ${expiry === opt.val ? 'expiry-btn--active' : ''}`} onClick={() => setExpiry(opt.val)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Max Downloads (optional)</label>
              <input className="form-input" type="number" placeholder="Unlimited" min="1" value={maxDownloads} onChange={e => setMaxDownloads(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password Protection</label>
              <div className="toggle-row">
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Require a password to access</span>
                <button className={`toggle ${usePassword ? 'toggle--on' : ''}`} onClick={() => setUsePassword(!usePassword)}>
                  <span className="toggle-thumb" />
                </button>
              </div>
              {usePassword && (
                <div className="password-field">
                  <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Set access password" value={password} onChange={e => setPassword(e.target.value)} />
                  <button className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <MdVisibility size={16} /> : <MdKey size={16} />}
                  </button>
                </div>
              )}
            </div>
            <div className="share-info-row">
              <MdLock size={14} />
              <span>All shared links use AES-256 encryption and access control</span>
            </div>
            <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:8 }} onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? <><span className="spinner" /> Generating Secure Link…</> : <><MdLink size={15} /> Generate Secure Link</>}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="share-result">
            <div className="share-success-icon"><MdCheck size={28} color="var(--accent-green)" /></div>
            <div className="share-success-title">Secure Link Generated</div>
            <div className="share-success-sub">Your file is ready to share with the configured restrictions.</div>
            <div className="link-box">
              <span className="link-text">{generatedLinkRef.current}</span>
              <button className={`copy-btn ${copied ? 'copy-btn--copied' : ''}`} onClick={handleCopy}>
                {copied ? <><MdCheck size={13} /> Copied!</> : <><MdContentCopy size={13} /> Copy</>}
              </button>
            </div>
            <div className="share-meta-grid">
              <div className="share-meta-item"><MdAccessTime className="meta-icon" size={18} /><div><div className="meta-label">Expires</div><div className="meta-val">{expiry === '0' ? 'Never' : `In ${expiry} day(s)`}</div></div></div>
              <div className="share-meta-item"><MdLock className="meta-icon" size={18} /><div><div className="meta-label">Password</div><div className="meta-val">{usePassword ? 'Protected' : 'None'}</div></div></div>
              <div className="share-meta-item"><MdVisibility className="meta-icon" size={18} /><div><div className="meta-label">Permission</div><div className="meta-val" style={{ textTransform:'capitalize' }}>{permissions}</div></div></div>
              <div className="share-meta-item"><MdDownload className="meta-icon" size={18} /><div><div className="meta-label">Max Downloads</div><div className="meta-val">{maxDownloads || 'Unlimited'}</div></div></div>
            </div>
            <div className="share-result-actions">
              <button className="btn btn-ghost" onClick={() => setStep(1)}><MdArrowBack size={15} /> Edit Settings</button>
              <button className="btn btn-primary" onClick={onClose}><MdCheck size={15} /> Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
