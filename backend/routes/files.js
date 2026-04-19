const express  = require('express')
const path     = require('path')
const fs       = require('fs')
const File     = require('../models/File')
const User     = require('../models/User')
const { protect }            = require('../middleware/auth')
const { upload, cloudinary } = require('../config/cloudinary')
const { log }                = require('../utils/logger')

const router = express.Router()
router.use(protect)
  router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: 'No file provided.' })

    const { originalname, mimetype, size } = req.file
    const cloudinaryUrl = req.file.path       // full Cloudinary URL
    const cloudinaryId  = req.file.filename   // public_id for deletion

    const user = await User.findById(req.user._id)
    if (user.storageUsed + size > user.storageTotal) {
      // Delete from Cloudinary if quota exceeded
      await cloudinary.uploader.destroy(cloudinaryId, { resource_type: 'raw' })
      return res.status(400).json({ success: false, message: 'Storage quota exceeded.' })
    }

    const ext = path.extname(originalname).toLowerCase().replace('.', '') || 'bin'

    const fileDoc = await File.create({
      name:          originalname,
      originalName:  originalname,
      mimeType:      mimetype || 'application/octet-stream',
      size,
      extension:     ext,
      storagePath:   cloudinaryUrl,   // store URL directly
      encryptedName: cloudinaryId,    // store public_id for deletion
      owner:         req.user._id,
      encrypted:     false,           // honest - no AES applied
      iv:            '',
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
    })

    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: size } })
    await log({ user: req.user._id, file: fileDoc._id, action: 'upload', req, detail: originalname })

    res.status(201).json({ success: true, message: 'File uploaded.', file: formatFile(fileDoc, req.user) })
  } catch (err) { next(err) }
})

// Download via Cloudinary signed URL
router.get('/:id/download', async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: false })
    if (!file)
      return res.status(404).json({ success: false, message: 'File not found.' })

    // Generate signed URL expiring in 1 hour
    const signedUrl = cloudinary.url(file.encryptedName, {
      resource_type: 'raw',
      type:          'upload',
      sign_url:      true,
      expires_at:    Math.floor(Date.now() / 1000) + 3600,
      attachment:    true,   // forces download instead of preview
    })

    await File.findByIdAndUpdate(file._id, { $inc: { downloads: 1 } })
    await log({ user: req.user._id, file: file._id, action: 'download', req, detail: file.originalName })

    res.redirect(signedUrl)
  } catch (err) { next(err) }
})

// Delete from Cloudinary on file delete
router.delete('/:id', async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: false })
    if (!file)
      return res.status(404).json({ success: false, message: 'File not found.' })

    try {
      await cloudinary.uploader.destroy(file.encryptedName, { resource_type: 'raw' })
    } catch (e) { console.warn('Cloudinary delete warning:', e.message) }

    await file.softDelete()
    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: -file.size } })
    await log({ user: req.user._id, file: file._id, action: 'delete', req, detail: file.originalName })

    res.json({ success: true, message: 'File deleted.' })
  } catch (err) { next(err) }
})
