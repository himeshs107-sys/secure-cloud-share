import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MdLock, MdEmail, MdKey, MdVisibility, MdVisibilityOff, MdSecurity, MdAccessTime, MdPeople, MdAssignment, MdWarning } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const { login, loginAsGuest, isLoading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    const result = await login(email, password)
    if (result.success) navigate('/dashboard')
    else setError(result.error)
  }

  const handleGuest = async () => {
    setError('')
    const result = await loginAsGuest()
    if (result.success) navigate('/dashboard')
  }

  const features = [
    { icon: <MdLock size={20} />,      title: 'End-to-End Encrypted',  desc: 'AES-256 encryption keeps your files safe'  },
    { icon: <MdAccessTime size={20} />, title: 'Expiring Share Links',  desc: 'Links auto-expire for added security'      },
    { icon: <MdSecurity size={20} />,  title: 'Role-Based Access',     desc: 'Fine-grained permissions per user'         },
    { icon: <MdAssignment size={20} />,title: 'Audit Trail',           desc: 'Complete access logs for compliance'       },
  ]

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
          <div className="auth-features">
            {features.map((f, i) => (
              <div key={i} className="auth-feature-item" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="auth-feature-icon">{f.icon}</div>
                <div>
                  <div className="auth-feature-title">{f.title}</div>
                  <div className="auth-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
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
            <h1 className="auth-form-title">Welcome back</h1>
            <p className="auth-form-sub">Sign in to access your secure vault</p>
          </div>

          {error && <div className="auth-error"><MdWarning size={15} /> {error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon"><MdEmail size={17} /></span>
                <input className="form-input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label className="form-label">Password</label>
                <Link to="/forgot-password" className="auth-link" style={{ fontSize: 12 }}>Forgot password?</Link>
              </div>
              <div className="input-wrap">
                <span className="input-icon"><MdKey size={17} /></span>
                <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="••••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" className="input-action" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <MdVisibilityOff size={17} /> : <MdVisibility size={17} />}
                </button>
              </div>
            </div>

            <div className="auth-remember">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me for 30 days</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
              {isLoading ? <><span className="spinner" /> Authenticating...</> : <><MdLock size={15} /> Sign In Securely</>}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <button className="btn btn-ghost auth-demo-btn" onClick={handleGuest} disabled={isLoading}>
            <MdPeople size={15} /> Try with Demo / Guest Account
          </button>

          <p className="auth-switch">
            Don't have an account? <Link to="/register" className="auth-link">Create one →</Link>
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
