const multer = require('multer')
const path   = require('path')
const crypto = require('crypto')
const fs     = require('fs')

const UPLOAD_DIR = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, _file, cb) => {
    const uid = crypto.randomUUID()
    cb(null, `${uid}.enc`)
  },
})

// Allow ALL file types — we encrypt everything server-side anyway
// Only block truly dangerous executables
const BLOCKED_TYPES = [
  'application/x-msdownload',    // .exe
  'application/x-msdos-program', // .com
  'application/x-bat',           // .bat
]

const fileFilter = (_req, file, cb) => {
  if (BLOCKED_TYPES.includes(file.mimetype)) {
    cb(new Error(`Executable files (.exe, .bat, .com) are not allowed for security reasons.`), false)
  } else {
    cb(null, true)
  }
}

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '200', 10)

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
})

module.exports = { upload, UPLOAD_DIR }
