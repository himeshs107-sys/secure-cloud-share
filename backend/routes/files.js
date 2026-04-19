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

// ── POST /api/files/upload ─────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: 'No file provided.' })

    const { originalname, mimetype, size } = req.file
    const cloudinaryUrl = req.file.path
    const cloudinaryId  = req.file.filename

    const user = await User.findById(req.user._id)
    if (user.storageUsed + size > user.storageTotal) {
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
      storagePath:   cloudinaryUrl,
      encryptedName: cloudinaryId,
      owner:         req.user._id,
      encrypted:     false,
      iv:            '',
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

// ── GET /api/files ─────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { search, sort = '-createdAt', page = 1, limit = 50 } = req.query
    const query = { owner: req.user._id, isDeleted: false }

    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { tags:  { $in: [new RegExp(search, 'i')] } },
      ]
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit)
    const total = await File.countDocuments(query)
    const files = await File.find(query).sort(sort).skip(skip).limit(parseInt(limit))

    res.json({
      success: true,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      files: files.map(f => formatFile(f, req.user)),
    })
  } catch (err) { next(err) }
})

// ── GET /api/files/stats ───────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user._id

    const [totalFiles, sharedFiles, totalDownloadsAgg, user] = await Promise.all([
      File.countDocuments({ owner: userId, isDeleted: false }),
      File.countDocuments({ owner: userId, isDeleted: false, shared: true }),
      File.aggregate([
        { $match: { owner: userId, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$downloads' } } },
      ]),
      User.findById(userId),
    ])

    const byType = await File.aggregate([
      { $match: { owner: userId, isDeleted: false } },
      { $group: { _id: '$extension', count: { $sum: 1 }, size: { $sum: '$size' } } },
      { $sort: { count: -1 } },
    ])

    res.json({
      success: true,
      stats: {
        totalFiles,
        sharedFiles,
        totalDownloads: totalDownloadsAgg[0]?.total || 0,
        storageUsed:    user?.storageUsed  || 0,
        storageTotal:   user?.storageTotal || 5 * 1024 * 1024 * 1024,
        byType,
      },
    })
  } catch (err) { next(err) }
})

// ── GET /api/files/:id ─────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: false })
    if (!file)
      return res.status(404).json({ success: false, message: 'File not found.' })
    res.json({ success: true, file: formatFile(file, req.user) })
  } catch (err) { next(err) }
})

// ── GET /api/files/:id/download ────────────────────────────────
router.get('/:id/download', async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: false })
    if (!file)
      return res.status(404).json({ success: false, message: 'File not found.' })

    const signedUrl = cloudinary.url(file.encryptedName, {
      resource_type: 'raw',
      type:          'upload',
      sign_url:      true,
      expires_at:    Math.floor(Date.now() / 1000) + 3600,
      attachment:    true,
    })

    await File.findByIdAndUpdate(file._id, { $inc: { downloads: 1 } })
    await log({ user: req.user._id, file: file._id, action: 'download', req, detail: file.originalName })

    res.redirect(signedUrl)
  } catch (err) { next(err) }
})

// ── PUT /api/files/:id ── rename / update tags ─────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { name, tags } = req.body
    const updates = {}
    if (name !== undefined) updates.name = name
    if (tags !== undefined) updates.tags = tags

    const file = await File.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    )
    if (!file)
      return res.status(404).json({ success: false, message: 'File not found.' })

    res.json({ success: true, file: formatFile(file, req.user) })
  } catch (err) { next(err) }
})

// ── DELETE /api/files/:id ──────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: false })
    if (!file)
      return res.status(404).json({ success: false, message: 'File not found.' })

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(file.encryptedName, { resource_type: 'raw' })
    } catch (e) { console.warn('Cloudinary delete warning:', e.message) }

    await file.softDelete()
    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: -file.size } })
    await log({ user: req.user._id, file: file._id, action: 'delete', req, detail: file.originalName })

    res.json({ success: true, message: 'File deleted.' })
  } catch (err) { next(err) }
})

// ── DELETE /api/files/:id/permanent ── admin only ──────────────
router.delete('/:id/permanent', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin only.' })

    const file = await File.findById(req.params.id)
    if (!file)
      return res.status(404).json({ success: false, message: 'File not found.' })

    try {
      await cloudinary.uploader.destroy(file.encryptedName, { resource_type: 'raw' })
    } catch (e) { console.warn('Cloudinary delete warning:', e.message) }

    await File.findByIdAndDelete(file._id)
    await User.findByIdAndUpdate(file.owner, { $inc: { storageUsed: -file.size } })

    res.json({ success: true, message: 'File permanently deleted.' })
  } catch (err) { next(err) }
})

// ── Helper ─────────────────────────────────────────────────────
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
