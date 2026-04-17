import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  MdAccessTime,
  MdArrowBack,
  MdCheckCircle,
  MdDownload,
  MdErrorOutline,
  MdKey,
  MdLock,
  MdRefresh,
  MdShield,
} from 'react-icons/md'
import { formatSize } from '../utils/fileUtils'
import './SharedAccess.css'

const INFO_STATUS = {
  idle: 'idle',
  loading: 'loading',
  ready: 'ready',
  error: 'error',
}

export default function SharedAccess() {
  const { token } = useParams()
  const [infoStatus, setInfoStatus] = useState(INFO_STATUS.loading)
  const [info, setInfo] = useState(null)
  const [access, setAccess] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const needsPassword = !!info?.passwordProtected
  const canDownload = ['download', 'edit'].includes(access?.permission || info?.permission)
  const statusTone = useMemo(() => {
    if (error) return 'error'
    if (access) return 'success'
    return 'default'
  }, [access, error])

  const fetchInfo = async () => {
    setInfoStatus(INFO_STATUS.loading)
    setError('')
    setAccess(null)

    try {
      const res = await fetch(`/api/share/${token}/info`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Unable to load share link.')
      }

      setInfo(data.info)
      setInfoStatus(INFO_STATUS.ready)

      if (!data.info.passwordProtected) {
        await unlockLink('')
      }
    } catch (err) {
      setInfo(null)
      setInfoStatus(INFO_STATUS.error)
      setError(err.message || 'Unable to load share link.')
    }
  }

  useEffect(() => {
    fetchInfo()
  }, [token])

  const unlockLink = async (providedPassword) => {
    setIsUnlocking(true)
    setError('')

    try {
      const res = await fetch(`/api/share/${token}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providedPassword ? { password: providedPassword } : {}),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Unable to access this share link.')
      }

      setAccess(data)
    } catch (err) {
      setAccess(null)
      setError(err.message || 'Unable to access this share link.')
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleUnlock = async (e) => {
    e.preventDefault()
    await unlockLink(password)
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    setError('')

    try {
      const url = needsPassword && password
        ? `/api/share/${token}/download?password=${encodeURIComponent(password)}`
        : `/api/share/${token}/download`

      const res = await fetch(url)
      if (!res.ok) {
        let message = 'Download failed.'
        try {
          const data = await res.json()
          message = data.message || message
        } catch {}
        throw new Error(message)
      }

      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = access?.file?.name || info?.fileName || 'shared-file'
      a.click()
      URL.revokeObjectURL(objectUrl)
    } catch (err) {
      setError(err.message || 'Download failed.')
    } finally {
      setIsDownloading(false)
    }
  }

  const expiresLabel = !info?.expiresAt
    ? 'Never expires'
    : new Date(info.expiresAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })

  return (
    <div className="shared-access-page">
      <div className="shared-access-shell">
        <div className="shared-access-topbar">
          <Link to="/login" className="shared-access-back">
            <MdArrowBack size={16} />
            <span>Back to VaultShare</span>
          </Link>
          <button className="shared-access-refresh" onClick={fetchInfo} type="button">
            <MdRefresh size={16} />
          </button>
        </div>

        <div className="shared-access-card">
          <div className="shared-access-hero">
            <div className={`shared-access-icon shared-access-icon--${statusTone}`}>
              {error ? <MdErrorOutline size={28} /> : access ? <MdCheckCircle size={28} /> : <MdShield size={28} />}
            </div>
            <div>
              <div className="shared-access-eyebrow">Secure Share Link</div>
              <h1 className="shared-access-title">
                {info?.fileName || access?.file?.name || 'Shared file'}
              </h1>
              <p className="shared-access-subtitle">
                {access
                  ? 'Access granted. You can use the actions below based on the link permissions.'
                  : 'This is a public access page for a VaultShare file.'}
              </p>
            </div>
          </div>

          {infoStatus === INFO_STATUS.loading && (
            <div className="shared-access-state">Loading share link…</div>
          )}

          {infoStatus === INFO_STATUS.error && (
            <div className="shared-access-message shared-access-message--error">{error}</div>
          )}

          {infoStatus === INFO_STATUS.ready && info && (
            <>
              <div className="shared-access-meta">
                <div className="shared-access-meta-item">
                  <span className="shared-access-meta-label">File size</span>
                  <span className="shared-access-meta-value">{formatSize(info.fileSize)}</span>
                </div>
                <div className="shared-access-meta-item">
                  <span className="shared-access-meta-label">Permission</span>
                  <span className="shared-access-meta-value" style={{ textTransform: 'capitalize' }}>{info.permission}</span>
                </div>
                <div className="shared-access-meta-item">
                  <span className="shared-access-meta-label">Encryption</span>
                  <span className="shared-access-meta-value">{info.encrypted ? 'AES protected' : 'Not specified'}</span>
                </div>
                <div className="shared-access-meta-item">
                  <span className="shared-access-meta-label">Downloads</span>
                  <span className="shared-access-meta-value">
                    {info.downloadCount || 0}
                    {info.maxDownloads ? ` / ${info.maxDownloads}` : ''}
                  </span>
                </div>
              </div>

              <div className="shared-access-flags">
                <div className="shared-access-flag">
                  <MdAccessTime size={15} />
                  <span>{expiresLabel}</span>
                </div>
                <div className="shared-access-flag">
                  <MdLock size={15} />
                  <span>{needsPassword ? 'Password required' : 'No password required'}</span>
                </div>
              </div>

              {error && infoStatus === INFO_STATUS.ready && (
                <div className="shared-access-message shared-access-message--error">{error}</div>
              )}

              {!access && needsPassword && (
                <form className="shared-access-form" onSubmit={handleUnlock}>
                  <label className="shared-access-label" htmlFor="share-password">
                    Enter password to unlock this file
                  </label>
                  <div className="shared-access-input-row">
                    <div className="shared-access-input-wrap">
                      <MdKey size={16} className="shared-access-input-icon" />
                      <input
                        id="share-password"
                        type="password"
                        className="shared-access-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Share password"
                        autoComplete="current-password"
                      />
                    </div>
                    <button className="shared-access-primary" type="submit" disabled={isUnlocking || !password.trim()}>
                      {isUnlocking ? 'Unlocking…' : 'Unlock'}
                    </button>
                  </div>
                </form>
              )}

              {access && (
                <div className="shared-access-actions">
                  <div className="shared-access-message shared-access-message--success">
                    Link unlocked with <strong>{access.permission}</strong> permission.
                  </div>
                  {canDownload ? (
                    <button className="shared-access-primary" type="button" onClick={handleDownload} disabled={isDownloading}>
                      <MdDownload size={16} />
                      <span>{isDownloading ? 'Downloading…' : 'Download File'}</span>
                    </button>
                  ) : (
                    <div className="shared-access-message">
                      This link allows viewing metadata only. Download is disabled for this share link.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
