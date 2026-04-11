import React, { useState, useRef } from 'react'
import { MdUpload, MdClose, MdCloudUpload, MdFileDownload, MdLock, MdCheck } from 'react-icons/md'
import './UploadModal.css'

export default function UploadModal({ onClose, onUploaded }) {
  const [dragOver, setDragOver]   = useState(false)
  const [files, setFiles]         = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState({})
  const [errors, setErrors]       = useState({})
  const [done, setDone]           = useState(false)
  const inputRef = useRef()

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles).map(f => ({
      file: f,
      id:   Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
    }))
    setFiles(prev => [...prev, ...arr])
  }

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }
  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id))

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const uploadOne = (fileEntry) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', fileEntry.file)

      const xhr = new XMLHttpRequest()
      const token = localStorage.getItem('vs_token')

      xhr.open('POST', '/api/files/upload')
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(prev => ({ ...prev, [fileEntry.id]: Math.round((e.loaded / e.total) * 100) }))
        }
      }

      xhr.onload = () => {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(prev => ({ ...prev, [fileEntry.id]: 100 }))
          resolve(data)
        } else {
          setErrors(prev => ({ ...prev, [fileEntry.id]: data.message || 'Upload failed' }))
          reject(new Error(data.message))
        }
      }

      xhr.onerror = () => {
        setErrors(prev => ({ ...prev, [fileEntry.id]: 'Network error' }))
        reject(new Error('Network error'))
      }

      xhr.send(formData)
    })
  }

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    setErrors({})

    for (const f of files) {
      try {
        await uploadOne(f)
      } catch {}
    }

    setUploading(false)
    setDone(true)
    setTimeout(() => {
      onUploaded?.()
      onClose()
    }, 1200)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title"><MdUpload size={16} style={{marginRight:6,verticalAlign:'middle'}} />Upload Files</div>
          <button className="modal-close" onClick={onClose}><MdClose size={16} /></button>
        </div>

        <div
          className={`drop-zone ${dragOver ? 'drop-zone--active' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
          <div className="drop-icon">
            {dragOver ? <MdFileDownload size={40} /> : <MdCloudUpload size={40} />}
          </div>
          <div className="drop-title">{dragOver ? 'Drop to upload' : 'Drag & drop files here'}</div>
          <div className="drop-sub">or click to browse your computer</div>
          <div className="drop-limits">Max 50MB per file · All formats supported · AES-256 encrypted</div>
        </div>

        {files.length > 0 && (
          <div className="upload-list">
            {files.map(f => (
              <div key={f.id} className="upload-item">
                <div className="upload-item-info">
                  <div className="upload-file-name">{f.name}</div>
                  <div className="upload-file-size">{formatSize(f.size)}</div>
                </div>
                {errors[f.id] ? (
                  <span style={{ fontSize: 11, color: 'var(--accent-red)', whiteSpace: 'nowrap' }}>{errors[f.id]}</span>
                ) : uploading || done ? (
                  <div className="upload-progress">
                    <div className="progress-bar" style={{ height: 4 }}>
                      <div className="progress-fill" style={{ width: `${progress[f.id] || 0}%` }} />
                    </div>
                    <span className="upload-pct">
                      {progress[f.id] === 100 ? <MdCheck size={14} color="var(--accent-green)" /> : `${progress[f.id] || 0}%`}
                    </span>
                  </div>
                ) : (
                  <button className="upload-remove" onClick={() => removeFile(f.id)}><MdClose size={14} /></button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="upload-enc-notice">
          <MdLock size={14} />
          <span>Files are encrypted with AES-256 before storage</span>
        </div>

        <div className="upload-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={uploading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={!files.length || uploading || done}>
            {uploading
              ? <><span className="spinner" /> Encrypting & Uploading…</>
              : done
              ? <><MdCheck size={15} /> Upload Complete!</>
              : <><MdUpload size={15} /> Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Files'}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
