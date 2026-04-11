import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  MdDashboard, MdFolder, MdLink, MdAssignment, MdPerson,
  MdGroup, MdSettings, MdLock, MdLogout, MdClose, MdMoreVert
} from 'react-icons/md'
import './Sidebar.css'

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)

  const isAdmin = user?.role === 'admin'

  const NAV_ITEMS = [
    { path: '/dashboard', icon: <MdDashboard />, label: 'Dashboard'    },
    { path: '/files',     icon: <MdFolder />,    label: 'My Files'     },
    { path: '/shared',    icon: <MdLink />,       label: 'Shared Links' },
    { path: '/logs',      icon: <MdAssignment />, label: 'Access Logs'  },
    { path: '/profile',   icon: <MdPerson />,     label: 'My Profile'   },
    ...(isAdmin ? [
      { path: '/users',    icon: <MdGroup />,    label: 'Users',    adminBadge: true },
      { path: '/settings', icon: <MdSettings />, label: 'Settings', adminBadge: true },
    ] : []),
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }
  const handleNav = () => { if (onClose) onClose() }

  // Determine avatar display: base64 image OR initials
  const isImageAvatar = user?.avatar?.startsWith('data:')
  const storageUsedBytes  = user?.storageUsed  || 0
  const storageTotalBytes = user?.storageTotal || 5 * 1024 * 1024 * 1024
  const storagePercent    = Math.min(100, (storageUsedBytes / storageTotalBytes) * 100)
  const storageUsedGB     = (storageUsedBytes  / (1024 ** 3)).toFixed(2)
  const storageTotalGB    = (storageTotalBytes / (1024 ** 3)).toFixed(0)

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon"><MdLock size={17} /></div>
        <div className="brand-text">
          <span className="brand-name">VAULT</span>
          <span className="brand-sub">SHARE</span>
        </div>
        <button className="sidebar-close-btn" onClick={onClose}><MdClose size={15} /></button>
      </div>

      <div className="encryption-badge">
        <span className="enc-dot" />
        <span className="enc-label">End-to-End Encrypted</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">MAIN MENU</div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNav}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.adminBadge && <span className="nav-admin-badge">ADMIN</span>}
          </NavLink>
        ))}
      </nav>

      {/* Storage */}
      <div className="sidebar-storage">
        <div className="storage-header">
          <span className="storage-label">Storage</span>
          <span className="storage-amount">{storageUsedGB} / {storageTotalGB} GB</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${storagePercent}%` }} />
        </div>
      </div>

      {/* User */}
      <div className="sidebar-user" onClick={() => setShowDropdown(!showDropdown)}>
        <div className="user-avatar" style={{
          padding:    isImageAvatar ? 0 : undefined,
          overflow:   isImageAvatar ? 'hidden' : undefined,
          fontSize:   isImageAvatar ? 0 : undefined,
        }}>
          {isImageAvatar
            ? <img src={user.avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
            : (user?.avatar || 'U')
          }
        </div>
        <div className="user-info">
          <div className="user-name">{user?.name || 'User'}</div>
          <div className="user-role" style={{
            color: user?.role === 'admin' ? 'var(--accent-cyan)'
                 : user?.role === 'guest' ? 'var(--accent-amber)'
                 : 'var(--text-muted)'
          }}>
            {user?.role === 'admin' ? '★ Admin' : user?.role === 'guest' ? '⏱ Guest' : 'User'}
          </div>
        </div>
        <button className="user-menu-btn"><MdMoreVert size={18} /></button>

        {showDropdown && (
          <div className="user-dropdown">
            <button className="dropdown-item" onClick={() => { navigate('/profile'); handleNav(); setShowDropdown(false) }}>
              <MdPerson size={15} /> My Profile
            </button>
            {isAdmin && (
              <button className="dropdown-item" onClick={() => { navigate('/settings'); handleNav(); setShowDropdown(false) }}>
                <MdSettings size={15} /> Settings
              </button>
            )}
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
            <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
              <MdLogout size={15} /> {user?.role === 'guest' ? 'End Session' : 'Logout'}
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
