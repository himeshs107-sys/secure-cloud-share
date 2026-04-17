import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { MdLock } from 'react-icons/md'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Files from './pages/Files'
import Shared from './pages/Shared'
import Logs from './pages/Logs'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Users from './pages/Users'
import SharedAccess from './pages/SharedAccess'
import './App.css'

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <div className="mobile-topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
            <span /><span /><span />
          </button>
          <div className="mobile-brand">
            <MdLock size={14} />
            <span className="mobile-brand-name">VAULTSHARE</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

function Protected({ children, adminOnly = false }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--accent-cyan)', gap:12 }}>
      <span className="spinner" style={{ width:20, height:20, borderWidth:2 }} />
      <span style={{ fontSize:14, opacity:0.7 }}>Loading VaultShare…</span>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <AppLayout>{children}</AppLayout>
}

function AppRoutes() {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  return (
    <Routes>
      <Route path="/"                element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="/s/:token"        element={<SharedAccess />} />
      <Route path="/login"           element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register"        element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/files"     element={<Protected><Files /></Protected>} />
      <Route path="/shared"    element={<Protected><Shared /></Protected>} />
      <Route path="/logs"      element={<Protected><Logs /></Protected>} />
      <Route path="/profile"   element={<Protected><Profile /></Protected>} />
      <Route path="/settings"  element={<Protected adminOnly><Settings /></Protected>} />
      <Route path="/users"     element={<Protected adminOnly><Users /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

