import React, { useState } from 'react'
import { MdSave, MdCheck, MdLock } from 'react-icons/md'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import './Profile.css'

export default function Profile() {
  const { user } = useAuth()
  const isGuest = user?.role === 'guest'
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="page-content profile-page">
      <Header title="My Profile" subtitle="View and update your personal information" />

      <div className="profile-layout">
        <div className="profile-avatar-card card">
          <div className="profile-avatar-circle">{user?.avatar || 'U'}</div>
          <div className="profile-avatar-name">{user?.name}</div>
          <div className="profile-avatar-email">{user?.email}</div>
          <span
            className={`badge ${user?.role === 'admin' ? 'badge-cyan' : user?.role === 'guest' ? 'badge-amber' : 'badge-green'}`}
            style={{ marginTop: 8, textTransform: 'capitalize' }}
          >
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
              <span className="profile-meta-val">{user?.joinDate || '-'}</span>
            </div>
            <div className="profile-meta-row">
              <span className="profile-meta-label">Storage</span>
              <span className="profile-meta-val">{user?.storageUsed || 0} / {user?.storageTotal || 5} GB</span>
            </div>
          </div>
          <div className="progress-bar" style={{ marginTop: 12 }}>
            <div className="progress-fill" style={{ width: `${((user?.storageUsed || 0) / (user?.storageTotal || 5)) * 100}%` }} />
          </div>
        </div>

        <div className="profile-form-col">
          <div className="card">
            <div className="card-title" style={{ marginBottom: 24 }}>Personal Information</div>
            <form className="profile-form" onSubmit={handleSave}>
              <div className="settings-form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input
                    className="form-input"
                    value={user?.role || ''}
                    disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed', textTransform: 'capitalize' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Timezone</label>
                  <select className="form-input">
                    <option>Asia/Kolkata (IST, UTC+5:30)</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className={`btn ${saved ? 'btn-saved' : 'btn-primary'}`}>
                  {saved ? <><MdCheck size={15} /> Saved!</> : <><MdSave size={15} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>

          {!isGuest && (
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-title" style={{ marginBottom: 20 }}>Change Password</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input className="form-input" type="password" placeholder="********" />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" placeholder="Min. 8 characters" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input className="form-input" type="password" placeholder="Repeat new password" />
                </div>
                <div>
                  <button className="btn btn-primary"><MdLock size={15} /> Update Password</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
