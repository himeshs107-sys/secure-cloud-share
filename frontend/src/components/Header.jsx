import React, { useState } from 'react'
import { MdSearch, MdClose, MdNotifications, MdSecurity } from 'react-icons/md'
import './Header.css'

export default function Header({ title, subtitle, actions, onSearch, searchPlaceholder }) {
  const [searchValue, setSearchValue] = useState('')

  const handleChange = (e) => { setSearchValue(e.target.value); onSearch?.(e.target.value) }
  const handleClear  = () => { setSearchValue(''); onSearch?.('') }

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
        {subtitle && <p className="header-subtitle">{subtitle}</p>}
      </div>

      <div className="header-center">
        <div className="header-search">
          <MdSearch className="search-icon" size={16} />
          <input className="search-input" type="text"
            placeholder={searchPlaceholder || "Search files, users, logs..."}
            value={searchValue} onChange={handleChange} />
          {searchValue && (
            <button className="search-clear" onClick={handleClear}><MdClose size={14} /></button>
          )}
          <kbd className="search-kbd">⌘K</kbd>
        </div>
      </div>

      <div className="header-right">
        <button className="header-icon-btn" title="Notifications">
          <MdNotifications size={18} />
          <span className="notif-dot" />
        </button>
        <button className="header-icon-btn" title="Security Status">
          <MdSecurity size={18} />
        </button>
        {actions}
      </div>
    </header>
  )
}
