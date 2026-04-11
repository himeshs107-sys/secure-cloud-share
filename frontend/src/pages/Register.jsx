import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MdPerson, MdEmail, MdKey, MdLock, MdVisibility, MdVisibilityOff, MdCheck, MdWarning } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import './Auth.css'
import './AuthExtra.css'

export default function Register() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const { register, isLoading } = useAuth()
  const navigate                = useNavigate()

  const strength = (pw) => {
    let s = 0
    if (pw.length >= 8)          s++
    if (/[A-Z]/.test(pw))        s++
    if (/[0-9]/.test(pw))        s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
  }

  const strengthLabel = ['', 'Weak', 'Fair', 'Strong', 'Very Strong']
  const strengthColor = ['', 'var(--accent-red)', 'var(--accent-amber)', 'var(--accent-cyan)', 'var(--accent-green)']
  const pwStrength = strength(password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name || !email || !password) return setError('All fields are required.')
    if (password !== confirm)          return setError('Passwords do not match.')
    if (pwStrength < 2)                return setError('Please choose a stronger password.')
    const result = await register(name, email, password)
    if (result.success) navigate('/dashboard')
    else setError(result.error)
  }

  return (
    <div className="auth-root">
      <div className="auth-panel-left">
        <div className="auth-brand-wrap">
          <div className="auth-logo">
            <span className="auth-logo-icon"><MdLock size={40} style={{filter:'drop-shadow(0 0 18px rgba(0,229,255,0.5))',color:'var(--accent-cyan)'}} /></span>
            <div>
              <div className="auth-logo-name">VAULT<span>SHARE</span></div>
              <div className="auth-logo-tagline">Secure Cloud File Sharing</div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, color:'var(--text-primary)', marginBottom:12, lineHeight:1.4 }}>
              Your files deserve<br/>
              <span style={{ color:'var(--accent-cyan)' }}>enterprise-grade</span> security
            </h2>
            <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.7 }}>
              Join teams using VaultShare to share sensitive files securely with encrypted links, access controls, and complete audit trails.
            </p>
          </div>

          <div className="auth-plan-card">
            <div className="plan-header">
              <span className="plan-badge">FREE PLAN</span>
              <span className="plan-price">$0<small>/month</small></span>
            </div>
            <div className="plan-features">
              {['5 GB Storage','100 Shares/month','AES-256 Encryption','Access Logs','7-day Link Expiry'].map(f => (
                <div key={f} className="plan-feature">
                  <MdCheck size={14} style={{color:'var(--accent-green)',flexShrink:0}} /> {f}
                </div>
              ))}
            </div>
          </div>

          <div className="auth-panel-footer">
            <div className="auth-enc-status">
              <span className="enc-dot" />
              <span>256-bit encryption active</span>
            </div>
          </div>
        </div>
        <div className="auth-grid-bg" />
      </div>

      <div className="auth-panel-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Create account</h1>
            <p className="auth-form-sub">Set up your secure vault in seconds</p>
          </div>

          {error && <div className="auth-error"><MdWarning size={15} /> {error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-wrap">
                <span className="input-icon"><MdPerson size={17} /></span>
                <input className="form-input" type="text" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon"><MdEmail size={17} /></span>
                <input className="form-input" type="email" placeholder="jane@company.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrap">
                <span className="input-icon"><MdKey size={17} /></span>
                <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" className="input-action" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <MdVisibilityOff size={17} /> : <MdVisibility size={17} />}
                </button>
              </div>
              {password && (
                <div className="strength-indicator">
                  <div className="strength-bars">
                    {[1,2,3,4].map(n => (
                      <div key={n} className="strength-bar" style={{ background: n <= pwStrength ? strengthColor[pwStrength] : 'var(--bg-hover)' }} />
                    ))}
                  </div>
                  <span style={{ fontSize:11, color: strengthColor[pwStrength] }}>{strengthLabel[pwStrength]}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-wrap">
                <span className="input-icon"><MdLock size={17} /></span>
                <input className="form-input" type="password" placeholder="Repeat password"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  style={{ borderColor: confirm && confirm !== password ? 'var(--accent-red)' : undefined }} />
                {confirm && confirm === password && (
                  <span className="input-action" style={{ color:'var(--accent-green)' }}><MdCheck size={17} /></span>
                )}
              </div>
            </div>

            <div className="auth-terms">
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>I agree to the <a href="#" className="auth-link">Terms</a> and <a href="#" className="auth-link">Privacy Policy</a></span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
              {isLoading ? <><span className="spinner" /> Creating Account...</> : <><MdLock size={15} /> Create Secure Account</>}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login" className="auth-link">Sign in →</Link>
          </p>

          <div className="auth-trust">
            <MdLock size={12} /><span>VaultShare</span><span>•</span>
            <span>SOC 2 Compliant</span><span>•</span>
            <span>GDPR Ready</span>
          </div>
        </div>
      </div>
    </div>
  )
}
