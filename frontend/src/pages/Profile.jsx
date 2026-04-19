import React, { useState, useRef } from 'react'
import { MdSave, MdCheck, MdLock, MdAddAPhoto, MdPerson } from 'react-icons/md'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { formatSize } from '../utils/fileUtils'
import './Profile.css'

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth()
  const [name, setName]         = useState(user?.name     || '')
  const [location, setLocation] = useState(user?.location || '')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [profileError, setProfileError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar?.startsWith('data:') ? user.avatar : null
  )
  const [avatarData, setAvatarData] = useState(null)
  const fileRef = useRef()

  const [currentPw, setCurrentPw]   = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [pwSaving, setPwSaving]     = useState(false)
  const [pwSaved, setPwSaved]       = useState(false)
  const [pwError, setPwError]       = useState('')

  // Fix 9: Profile picture - convert to base64 and store in avatar field
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setProfileError('Please select an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Profile photo must be under 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result)
      setAvatarData(ev.target.result)  // base64 data URL
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setProfileError('')
    const updates = { name, location }
    if (avatarData) updates.avatar = avatarData
    const res = await updateProfile(updates)
    setSaving(false)
    if (res.success) {
      setAvatarData(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      setProfileError(res.error || 'Failed to update profile.')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return }
    if (newPw.length < 6)   { setPwError('Password must be at least 6 characters.'); return }
    setPwSaving(true)
    const res = await changePassword(currentPw, newPw)
    setPwSaving(false)
    if (res.success) {
      setPwSaved(true)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => setPwSaved(false), 2500)
    } else {
      setPwError(res.error || 'Failed to change password.')
    }
  }

  const storagePercent = Math.min(100, ((user?.storageUsed || 0) / (user?.storageTotal || 1)) * 100)
  const storageUsedGB  = ((user?.storageUsed  || 0) / (1024 ** 3)).toFixed(2)
  const storageTotalGB = ((user?.storageTotal || 1) / (1024 ** 3)).toFixed(0)

  const displayAvatar = avatarPreview || (user?.avatar?.startsWith('data:') ? user.avatar : null)
  const initials      = user?.avatar?.startsWith('data:') ? null : (user?.avatar || 'U')

  return (
    <div className="page-content profile-page">
      <Header title="My Profile" subtitle="View and update your personal information" />

      <div className="profile-layout">
        {/* Avatar card */}
        <div className="profile-avatar-card card">

          {/* Clickable avatar with camera overlay */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
            <div
              className="profile-avatar-circle"
              onClick={() => fileRef.current?.click()}
              style={{
                cursor: 'pointer',
                overflow: 'hidden',
                padding: displayAvatar ? 0 : undefined,
                fontSize: displayAvatar ? 0 : undefined,
              }}
              title="Click to change photo"
            >
              {displayAvatar
                ? <img src={displayAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : initials
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                position: 'absolute', bottom: 4, right: 4,
                background: 'var(--accent-cyan)', border: 'none', borderRadius: '50%',
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#000',
              }}
              title="Upload photo"
            >
              <MdAddAPhoto size={14} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>

          <div className="profile-avatar-name">{user?.name}</div>
          <div className="profile-avatar-email">{user?.email}</div>
          <span className={`badge ${user?.role === 'admin' ? 'badge-cyan' : user?.role === 'guest' ? 'badge-amber' : 'badge-green'}`}
            style={{ marginTop: 8, textTransform: 'capitalize' }}>
            {user?.role}
          </span>
          <div className="divider" />
          <div className="profile-meta-list">
            <div className="profile-meta-row">
              <span className="profile-meta-label">Plan</span>
              <span className="profile-meta-val">{user?.plan || 'Free'}</span>
            </div>
            <div className="profile-meta-row">
              <span className="profile-meta-label">Member Since</span>
              <span className="profile-meta-val">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
                  : '—'}
              </span>
            </div>
            <div className="profile-meta-row">
              <span className="profile-meta-label">Storage</span>
              <span className="profile-meta-val">{storageUsedGB} / {storageTotalGB} GB</span>
            </div>
          </div>
          <div className="progress-bar" style={{ marginTop: 12 }}>
            <div className="progress-fill" style={{ width: `${storagePercent}%` }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
            Click photo to change
          </p>
        </div>

        <div className="profile-form-col">
          {/* Personal info */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 24 }}>Personal Information</div>
            {profileError && (
              <div style={{ background:'var(--accent-red)15', border:'1px solid var(--accent-red)30', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'var(--accent-red)' }}>
                {profileError}
              </div>
            )}
            <form className="profile-form" onSubmit={handleSaveProfile}>
              <div className="settings-form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" value={user?.email || ''} disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input className="form-input" value={user?.role || ''} disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed', textTransform: 'capitalize' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Rajkot, India" />
                </div>
              </div>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className={`btn ${saved ? 'btn-saved' : 'btn-primary'}`} disabled={saving}>
                  {saving ? 'Saving…' : saved ? <><MdCheck size={15} /> Saved!</> : <><MdSave size={15} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>

          {/* Change password */}
          {user?.role !== 'guest' && (
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-title" style={{ marginBottom: 20 }}>Change Password</div>
              {pwError && (
                <div style={{ background:'var(--accent-red)15', border:'1px solid var(--accent-red)30', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'var(--accent-red)' }}>
                  {pwError}
                </div>
              )}
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input className="form-input" type="password" placeholder="••••••••" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" placeholder="Min. 6 characters" value={newPw} onChange={e => setNewPw(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input className="form-input" type="password" placeholder="Repeat new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required />
                </div>
                <div>
                  <button type="submit" className={`btn ${pwSaved ? 'btn-saved' : 'btn-primary'}`} disabled={pwSaving}>
                    {pwSaving ? 'Updating…' : pwSaved ? <><MdCheck size={15} /> Updated!</> : <><MdLock size={15} /> Update Password</>}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
