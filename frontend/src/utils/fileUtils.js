export const FILE_TYPES = {
  pdf:     { icon: 'PDF',  color: '#ff4560', label: 'PDF'        },
  docx:    { icon: 'DOC',  color: '#2196f3', label: 'Word'       },
  doc:     { icon: 'DOC',  color: '#2196f3', label: 'Word'       },
  xlsx:    { icon: 'XLS',  color: '#4caf50', label: 'Excel'      },
  xls:     { icon: 'XLS',  color: '#4caf50', label: 'Excel'      },
  pptx:    { icon: 'PPT',  color: '#ff9800', label: 'PowerPoint' },
  ppt:     { icon: 'PPT',  color: '#ff9800', label: 'PowerPoint' },
  jpg:     { icon: 'IMG',  color: '#9c27b0', label: 'Image'      },
  jpeg:    { icon: 'IMG',  color: '#9c27b0', label: 'Image'      },
  png:     { icon: 'IMG',  color: '#9c27b0', label: 'Image'      },
  gif:     { icon: 'GIF',  color: '#9c27b0', label: 'Image'      },
  mp4:     { icon: 'VID',  color: '#e91e63', label: 'Video'      },
  mov:     { icon: 'VID',  color: '#e91e63', label: 'Video'      },
  zip:     { icon: 'ZIP',  color: '#607d8b', label: 'Archive'    },
  rar:     { icon: 'RAR',  color: '#607d8b', label: 'Archive'    },
  txt:     { icon: 'TXT',  color: '#78909c', label: 'Text'       },
  js:      { icon: 'JS',   color: '#ffb800', label: 'JavaScript' },
  jsx:     { icon: 'JSX',  color: '#ffb800', label: 'React'      },
  ts:      { icon: 'TS',   color: '#3178c6', label: 'TypeScript' },
  json:    { icon: 'JSON', color: '#00e5ff', label: 'JSON'       },
  default: { icon: 'FILE', color: '#8faab8', label: 'File'       },
}

export const getFileType = (filename = '') => {
  const ext = filename.split('.').pop().toLowerCase()
  return FILE_TYPES[ext] || FILE_TYPES.default
}

export const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export const formatTime = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  if (diff < 60000)  return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const LOG_TYPES = {
  upload:     { label: 'Upload',      color: 'cyan'   },
  download:   { label: 'Download',    color: 'green'  },
  share:      { label: 'Share',       color: 'purple' },
  delete:     { label: 'Delete',      color: 'red'    },
  view:       { label: 'View',        color: 'amber'  },
  login:      { label: 'Login',       color: 'green'  },
  register:   { label: 'Register',    color: 'cyan'   },
  revoke:     { label: 'Revoke',      color: 'red'    },
  failedAuth: { label: 'Failed Auth', color: 'red'    },
}
