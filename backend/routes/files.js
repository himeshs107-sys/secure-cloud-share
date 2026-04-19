const path       = require('path')
const crypto     = require('crypto')
const File       = require('../models/File')
const User       = require('../models/User')
const { protect }              = require('../middleware/auth')
const { upload, cloudinary }   = require('../config/cloudinary')
const { encryptString, decryptString } = require('../utils/encryption')
const { log }                  = require('../utils/logger')
const express = require('express')
const router  = express.Router()

router.use(protect)

// ── POST /api/files/upload ─────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: 'No file provided.' })

    const { originalname, mimetype, size } = req.file

    // Cloudinary gives us a public URL and public_id
    const cloudinaryUrl    = req.file.path       // full URL
    const cloudinaryId     = req.file.filename   // public_id

    // Check storage quota
    const user = await User.findById(req.user._id)
    if (user.storageUsed + size > user.storageTotal)
      return res.status(400).json({ success: false, message: 'Storage quota exceeded.' })

    const ext = path.extname(originalname).toLowerCase().replace('.', '') || 'bin'

    // Encrypt the Cloudinary URL so it's not exposed in DB plaintext
    const encryptedUrl = encryptString(cloudinaryUrl)

    const fileDoc = await File.create({
      name:          originalname,
      originalName:  originalname,
      mimeType:      mimetype || 'application/octet-stream',
      size,
      extension:     ext,
      storagePath:   encryptedUrl,    // stores encrypted Cloudinary URL
      encryptedName: cloudinaryId,    // stores Cloudinary public_id
      owner:         req.user._id,
      encrypted:     true,
      iv:            'cloudinary',    // marker - actual encryption via encryptString
      tags:          req.body.tags ? JSON.parse(req.body.tags) : [],
    })

    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: size } })
    await log({ user: req.user._id, file: fileDoc._id, action: 'upload', req, detail: originalname })

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully.',
      file:    formatFile(fileDoc, req.user),
    })
  } catch (err) { next(err) }
})

// ── GET /api/files/:id/download ────────────────────────────────
router.get('/:id/download', async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: false })
    if (!file)
      return res.status(404).json({ success: false, message: 'File not found.' })

    // Decrypt the Cloudinary URL
    const cloudinaryUrl = decryptString(file.storagePath)

    // Redirect to a signed Cloudinary URL (expires in 1 hour)
    const signedUrl = cloudinary.url(file.encryptedName, {
      resource_type: 'raw',
      type:          'upload',
      sign_url:      true,
      expires_at:    Math.floor(Date.now() / 1000) + 3600,
    })

    await File.findByIdAndUpdate(file._id, { $inc: { downloads: 1 } })
    await log({ user: req.user._id, file: file._id, action: 'download', req, detail: file.originalName })

    // Redirect browser to signed download URL
    res.redirect(signedUrl)
  } catch (err) { next(err) }
})

// ── DELETE /api/files/:id ──────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: false })
    if (!file)
      return res.status(404).json({ success: false, message: 'File not found.' })

    // Delete from Cloudinary too
    try {
      await cloudinary.uploader.destroy(file.encryptedName, { resource_type: 'raw' })
    } catch (e) {
      console.warn('Cloudinary delete warning:', e.message)
    }

    await file.softDelete()
    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: -file.size } })
    await log({ user: req.user._id, file: file._id, action: 'delete', req, detail: file.originalName })

    res.json({ success: true, message: 'File deleted.' })
  } catch (err) { next(err) }
})

// Keep all other routes the same (GET /, GET /stats, GET /:id, PUT /:id)
// ... paste them from the existing files.js below this line

function formatFile(file, user) {
  return {
    id:           file._id,
    name:         file.name,
    originalName: file.originalName,
    mimeType:     file.mimeType,
    size:         file.size,
    extension:    file.extension,
    owner:        user?.name || file.owner,
    encrypted:    file.encrypted,
    shared:       file.shared,
    shareCount:   file.shareCount,
    downloads:    file.downloads,
    tags:         file.tags,
    uploadedAt:   file.createdAt,
    updatedAt:    file.updatedAt,
  }
}

module.exports = router
