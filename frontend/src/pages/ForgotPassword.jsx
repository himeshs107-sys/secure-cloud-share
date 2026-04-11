import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MdLock, MdEmail, MdKey, MdCheck, MdWarning, MdArrowBack, MdSend } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function ForgotPassword() {
  const [step, setStep]               = useState(1)
  const [email, setEmail]             = useState('')
  const [code, setCode]               = useState('')
  const [newPass, setNewPass]         = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const { forgotPassword, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [fakeOtp] = useState('123456')

  const handleEmailSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (!email) { setError('Please enter your email.'); return }
    setLoading(true)
    const result = await forgotPassword(email)
    setLoading(false)
    if (!result.success) { setError(result.error); return }
    setStep(2)
  }

  const handleCodeSubmit = (e) => {
    e.preventDefault(); setError('')
    if (code !== fakeOtp) { setError('Invalid verification code. (Hint: 123456)'); return }
    setStep(3)
  }

  const handleReset = async (e) => {
    e.preventDefault(); setError('')
    if (!newPass) { setError('Please enter a new password.'); return }
    if (newPass !== confirmPass) { setError('Passwords do not match.'); return }
    if (newPass.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const result = await resetPassword(email, newPass)
    setLoading(false)
    if (!result.success) { setError(result.error); return }
    setStep(4)
    setTimeout(() => navigate('/login'), 2000)
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
          <div style={{ marginTop: 40 }}>
            <div className="forgot-steps">
              {['Enter Email', 'Verify Code', 'New Password'].map((s, i) => (
                <div key={i} className={`forgot-step ${step > i + 1 ? 'forgot-step--done' : step === i + 1 ? 'forgot-step--active' : ''}`}>
                  <div className="forgot-step-num">{step > i + 1 ? <MdCheck size={14} /> : i + 1}</div>
                  <div className="forgot-step-label">{s}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="auth-panel-footer" style={{ marginTop: 'auto' }}>
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

          {step === 1 && (
            <>
              <div className="auth-form-header">
                <h1 className="auth-form-title">Forgot Password</h1>
                <p className="auth-form-sub">Enter your email to receive a reset code</p>
              </div>
              {error && <div className="auth-error"><MdWarning size={15} /> {error}</div>}
              <form className="auth-form" onSubmit={handleEmailSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrap">
                    <span className="input-icon"><MdEmail size={17} /></span>
                    <input className="form-input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                  {loading ? <><span className="spinner" /> Sending...</> : <><MdSend size={15} /> Send Reset Code</>}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="auth-form-header">
                <h1 className="auth-form-title">Enter Code</h1>
                <p className="auth-form-sub">A 6-digit code was sent to <strong>{email}</strong></p>
              </div>
              <div className="auth-info-box">Demo hint: use code <strong>123456</strong></div>
              {error && <div className="auth-error"><MdWarning size={15} /> {error}</div>}
              <form className="auth-form" onSubmit={handleCodeSubmit}>
                <div className="form-group">
                  <label className="form-label">Verification Code</label>
                  <input className="form-input otp-input" type="text" placeholder="______" maxLength={6} value={code} onChange={e => setCode(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary auth-submit">
                  <MdCheck size={15} /> Verify Code
                </button>
              </form>
              <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', marginTop:8 }} onClick={() => setStep(1)}>
                <MdArrowBack size={15} /> Back
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="auth-form-header">
                <h1 className="auth-form-title">New Password</h1>
                <p className="auth-form-sub">Set a new password for your account</p>
              </div>
              {error && <div className="auth-error"><MdWarning size={15} /> {error}</div>}
              <form className="auth-form" onSubmit={handleReset}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="input-wrap">
                    <span className="input-icon"><MdKey size={17} /></span>
                    <input className="form-input" type="password" placeholder="Min. 6 characters" value={newPass} onChange={e => setNewPass(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-wrap">
                    <span className="input-icon"><MdLock size={17} /></span>
                    <input className="form-input" type="password" placeholder="Repeat password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                  {loading ? <><span className="spinner" /> Resetting...</> : <><MdLock size={15} /> Reset Password</>}
                </button>
              </form>
            </>
          )}

          {step === 4 && (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ fontSize:64, marginBottom:16, color:'var(--accent-green)' }}><MdCheck size={64} /></div>
              <div className="auth-form-title">Password Reset!</div>
              <p style={{ color:'var(--text-muted)', marginTop:8 }}>Redirecting to login...</p>
            </div>
          )}

          {step < 4 && (
            <p className="auth-switch" style={{ marginTop:24 }}>
              Remembered it? <Link to="/login" className="auth-link">Back to Login →</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
