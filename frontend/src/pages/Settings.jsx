import React, { useState } from 'react'
import { MdManageAccounts, MdSecurity, MdNotifications, MdSave, MdCheck, MdWarning } from 'react-icons/md'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import './Settings.css'

const Section = ({ title, desc, children }) => (
  <div className="settings-section">
    <div className="settings-section-header">
      <div className="settings-section-title">{title}</div>
      {desc && <div className="settings-section-desc">{desc}</div>}
    </div>
    <div className="settings-section-body">{children}</div>
  </div>
)

const Toggle = ({ label, desc, checked, onChange }) => (
  <div className="setting-row">
    <div className="setting-info">
      <div className="setting-label">{label}</div>
      {desc && <div className="setting-desc">{desc}</div>}
    </div>
    <button className={`toggle ${checked ? 'toggle--on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="toggle-thumb" />
    </button>
  </div>
)

export default function Settings() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [saved, setSaved] = useState(false)

  const [defaultView, setDefaultView] = useState('list')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [compactMode, setCompactMode] = useState(false)
  const [showFilePreviews, setShowFilePreviews] = useState(true)

  const [twoFA, setTwoFA] = useState(true)
  const [loginAlerts, setLoginAlerts] = useState(true)
  const [ipLogging, setIpLogging] = useState(true)
  const [forceEncrypt, setForceEncrypt] = useState(true)
  const [autoExpire, setAutoExpire] = useState(false)
  const [autoExpireDays, setAutoExpireDays] = useState('30')

  const [emailOnShare, setEmailOnShare] = useState(true)
  const [emailOnDownload, setEmailOnDownload] = useState(false)
  const [emailOnLogin, setEmailOnLogin] = useState(true)
  const [emailOnExpiry, setEmailOnExpiry] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(false)

  const handleSave = async () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const planFeatures = isAdmin
    ? ['100 GB Storage', '10,000 Shares/mo', 'AES-256 Encryption', 'Full Access Logs', 'Role-Based Access', 'Priority Support']
    : ['5 GB Storage', '100 Shares/mo', 'AES-256 Encryption', 'Basic Access Logs', 'Preference Controls', 'Email Alerts']

  return (
    <div className="page-content settings-page">
      <Header
        title="Settings"
        subtitle={isAdmin ? 'Manage platform security and preferences' : 'Manage your account preferences'}
        actions={
          <button className={`btn ${saved ? 'btn-saved' : 'btn-primary'}`} onClick={handleSave}>
            {saved ? <><MdCheck size={15} /> Saved!</> : <><MdSave size={15} /> Save Changes</>}
          </button>
        }
      />

      <div className="settings-layout">
        <div className="settings-main">
          <Section
            title={<span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><MdManageAccounts size={16} />User Preferences</span>}
            desc="Control how VaultShare looks and behaves for your account"
          >
            <div className="settings-form-grid">
              <div className="form-group">
                <label className="form-label">Default File View</label>
                <select className="form-input" value={defaultView} onChange={e => setDefaultView(e.target.value)}>
                  <option value="list">List View</option>
                  <option value="grid">Grid View</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Timezone</label>
                <select className="form-input" value={timezone} onChange={e => setTimezone(e.target.value)}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
            </div>
            <div className="divider" style={{ margin: '16px 0' }} />
            <Toggle label="Compact Mode" desc="Reduce spacing in tables and cards" checked={compactMode} onChange={setCompactMode} />
            <div className="divider" style={{ margin: '8px 0' }} />
            <Toggle label="Show File Previews" desc="Display thumbnails and quick previews where available" checked={showFilePreviews} onChange={setShowFilePreviews} />
          </Section>

          <Section
            title={<span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><MdSecurity size={16} />Security</span>}
            desc="Control how your vault is protected"
          >
            <Toggle label="Two-Factor Authentication" desc="Require a verification code on every login" checked={twoFA} onChange={setTwoFA} />
            <div className="divider" style={{ margin: '8px 0' }} />
            <Toggle label="Login Alerts" desc="Get notified when someone signs into your account" checked={loginAlerts} onChange={setLoginAlerts} />
            <div className="divider" style={{ margin: '8px 0' }} />
            <Toggle label="IP Address Logging" desc="Record the IP address of every file access" checked={ipLogging} onChange={setIpLogging} />
            <div className="divider" style={{ margin: '8px 0' }} />
            <Toggle label="Force Encryption on Upload" desc="Automatically encrypt all uploaded files with AES-256" checked={forceEncrypt} onChange={setForceEncrypt} />
            <div className="divider" style={{ margin: '8px 0' }} />
            <Toggle label="Auto-expire Share Links" desc="Automatically expire all new share links" checked={autoExpire} onChange={setAutoExpire} />
            {autoExpire && (
              <div className="form-group" style={{ marginTop: 12, maxWidth: 200 }}>
                <label className="form-label">Default Expiry (days)</label>
                <input className="form-input" type="number" min="1" max="365" value={autoExpireDays} onChange={e => setAutoExpireDays(e.target.value)} />
              </div>
            )}
            <div className="divider" style={{ margin: '16px 0' }} />
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">Change Password</div>
                <div className="setting-desc">Update your login password</div>
              </div>
              <button className="btn btn-ghost btn-sm">Change -&gt;</button>
            </div>
            <div className="setting-row" style={{ marginTop: 8 }}>
              <div className="setting-info">
                <div className="setting-label">Active Sessions</div>
                <div className="setting-desc">Manage and revoke logged-in devices</div>
              </div>
              <button className="btn btn-ghost btn-sm">Manage -&gt;</button>
            </div>
          </Section>

          <Section
            title={<span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><MdNotifications size={16} />Notifications</span>}
            desc="Choose what alerts you receive"
          >
            <Toggle label="Email on Share" desc="When someone accesses your shared link" checked={emailOnShare} onChange={setEmailOnShare} />
            <div className="divider" style={{ margin: '8px 0' }} />
            <Toggle label="Email on Download" desc="When a file is downloaded" checked={emailOnDownload} onChange={setEmailOnDownload} />
            <div className="divider" style={{ margin: '8px 0' }} />
            <Toggle label="Email on Login" desc="When a new login is detected" checked={emailOnLogin} onChange={setEmailOnLogin} />
            <div className="divider" style={{ margin: '8px 0' }} />
            <Toggle label="Link Expiry Alerts" desc="When a share link is about to expire" checked={emailOnExpiry} onChange={setEmailOnExpiry} />
            <div className="divider" style={{ margin: '8px 0' }} />
            <Toggle label="Weekly Activity Report" desc="Summary email every Monday" checked={weeklyReport} onChange={setWeeklyReport} />
          </Section>
        </div>

        <div className="settings-side">
          <div className="card plan-card">
            <div className="plan-card-header">
              <span className={`badge ${isAdmin ? 'badge-cyan' : 'badge-green'}`}>{isAdmin ? 'PRO PLAN' : `${(user?.plan || 'Free').toUpperCase()} PLAN`}</span>
              <div className="plan-price-big">{isAdmin ? '$12' : '$0'}<span>/mo</span></div>
            </div>
            <div className="plan-features-list">
              {planFeatures.map(feature => (
                <div key={feature} className="plan-feature-item">
                  <MdCheck size={14} style={{ color: 'var(--accent-green)', flexShrink: 0 }} /><span>{feature}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
              {isAdmin ? 'Upgrade to Team ->' : 'Upgrade Plan ->'}
            </button>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>Security Score</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, color: 'var(--accent-green)', textShadow: '0 0 30px rgba(0,255,163,0.3)' }}>94</span>
              <span style={{ color: 'var(--text-muted)' }}>/ 100</span>
            </div>
            <div className="progress-bar" style={{ marginBottom: 16 }}><div className="progress-fill" style={{ width: '94%' }} /></div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enable IP Whitelisting to reach 100%</div>
          </div>

          {isAdmin && (
            <div className="card danger-zone" style={{ marginTop: 20 }}>
              <div className="card-title" style={{ color: 'var(--accent-red)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MdWarning size={16} /> Danger Zone
              </div>
              <button className="btn btn-danger btn-sm" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}>Delete All Share Links</button>
              <button className="btn btn-danger btn-sm" style={{ width: '100%', justifyContent: 'center' }}>Delete Account</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
