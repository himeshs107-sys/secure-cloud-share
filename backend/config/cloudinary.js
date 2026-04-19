const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Store encrypted file buffer directly to Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder:        'vaultshare/uploads',
      resource_type: 'raw',          // raw = any file type (not just images)
      public_id:     `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      use_filename:  false,
    }
  },
})

// Block only executables
const BLOCKED_TYPES = [
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-bat',
]

const fileFilter = (_req, file, cb) => {
  if (BLOCKED_TYPES.includes(file.mimetype)) {
    cb(new Error('Executable files are not allowed.'), false)
  } else {
    cb(null, true)
  }
}

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10)

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
})

module.exports = { upload, cloudinary }
