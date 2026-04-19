const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:        'vaultshare',
    resource_type: 'raw',   // allows ALL file types
    use_filename:  false,
    unique_filename: true,
  },
})

const BLOCKED = ['application/x-msdownload','application/x-msdos-program','application/x-bat']

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    BLOCKED.includes(file.mimetype)
      ? cb(new Error('Executable files not allowed'), false)
      : cb(null, true)
  },
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024 },
})

module.exports = { upload, cloudinary }
