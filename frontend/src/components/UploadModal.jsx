import React, { useState, useRef } from 'react'
import { MdUpload, MdClose, MdCloudUpload, MdFileDownload, MdLock, MdCheck, MdWarning } from 'react-icons/md'
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

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id))

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const uploadOne = (fileEntry) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', fileEntry.file)

      const xhr   = new XMLHttpRequest()
      const token = localStorage.getItem('vs_token')

      // Use absolute URL in production, relative in dev
      const baseUrl = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('/api', '')
        : ''
      xhr.open('POST', `${baseUrl}/api/files/upload`)

      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

      // Timeout: 5 minutes for large files going to Cloudinary
      xhr.timeout = 5 * 60 * 1000

      // Track upload progress
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          // Cap at 90% while Cloudinary processes — jumps to 100 on success
          const pct = Math.min(90, Math.round((e.loaded / e.total) * 100))
          setProgress(prev => ({ ...prev, [fileEntry.id]: pct }))
        }
      }

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText)
          if (xhr.status >= 200 && xhr.status < 300) {
            // Set to 100% on success
            setProgress(prev => ({ ...prev, [fileEntry.id]: 100 }))
            resolve(data)
          } else {
            setErrors(prev => ({ ...prev, [fileEntry.id]: data.message || `Upload failed (${xhr.status})` }))
            reject(new Error(data.message || 'Upload failed'))
          }
        } catch {
          setErrors(prev => ({ ...prev, [fileEntry.id]: 'Server error' }))
          reject(new Error('Server error'))
        }
      }

      xhr.onerror = () => {
        setErrors(prev => ({ ...prev, [fileEntry.id]: 'Network error' }))
        reject(new Error('Network error'))
      }

      xhr.ontimeout = () => {
        setErrors(prev => ({ ...prev, [fileEntry.id]: 'Upload timed out — try a smaller file' }))
        reject(new Error('Timeout'))
      }

      xhr.send(formData)
    })
  }

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    setErrors({})

    let anySuccess = false
    for (const f of files) {
      try {
        await uploadOne(f)
        anySuccess = true
      } catch {
        // error already set in state, continue with next file
      }
    }

    setUploading(false)

    if (anySuccess) {
      setDone(true)
      setTimeout(() => {
        onUploaded?.()
        onClose()
      }, 1200)
    }
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !uploading && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">
            <MdUpload size={16} style={{marginRight:6,verticalAlign:'middle'}} />
            Upload Files
          </div>
          <button className="modal-close" onClick={onClose} disabled={uploading}>
            <MdClose size={16} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          className={`drop-zone ${dragOver ? 'drop-zone--active' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={e => addFiles(e.target.files)}
          />
          <div className="drop-icon">
            {dragOver ? <MdFileDownload size={40} /> : <MdCloudUpload size={40} />}
          </div>
          <div className="drop-title">{dragOver ? 'Drop to upload' : 'Drag & drop files here'}</div>
          <div className="drop-sub">or click to browse your computer</div>
          <div className="drop-limits">Max 50MB · All formats supported · Stored securely on cloud</div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="upload-list">
            {files.map(f => (
              <div key={f.id} className="upload-item">
                <div className="upload-item-info">
                  <div className="upload-file-name">{f.name}</div>
                  <div className="upload-file-size">{formatSize(f.size)}</div>
                </div>

                {errors[f.id] ? (
                  <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--accent-red)', fontSize:11 }}>
                    <MdWarning size={13} />
                    <span>{errors[f.id]}</span>
                  </div>
                ) : uploading || done ? (
                  <div className="upload-progress">
                    <div className="progress-bar" style={{ height: 4 }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${progress[f.id] || 0}%`,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <span className="upload-pct">
                      {progress[f.id] === 100
                        ? <MdCheck size={14} color="var(--accent-green)" />
                        : `${progress[f.id] || 0}%`
                      }
                    </span>
                  </div>
                ) : (
                  <button className="upload-remove" onClick={() => removeFile(f.id)}>
                    <MdClose size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info notice */}
        <div className="upload-enc-notice">
          <MdLock size={14} />
          <span>Files are stored securely on Cloudinary with access control</span>
        </div>

        {/* Actions */}
        <div className="upload-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!files.length || uploading || done}
          >
            {uploading
              ? <><span className="spinner" /> Uploading to cloud…</>
              : done
              ? <><MdCheck size={15} /> {hasErrors ? 'Done (some failed)' : 'Upload Complete!'}</>
              : <><MdUpload size={15} /> Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : ''}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
