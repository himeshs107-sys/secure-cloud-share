const express   = require('express')
const fs        = require('fs')
const crypto    = require('crypto')
const File      = require('../models/File')
const ShareLink = require('../models/ShareLink')
const { protect, optionalAuth } = require('../middleware/auth')
const { decryptFileToStream }   = require('../utils/encryption')
const { log }                   = require('../utils/logger')

const router = express.Router()

// ── POST /api/share ── Generate a new share link ───────────────
router.post('/', protect, async (req, res, next) => {
  try {
    const {
      fileId,
      permission   = 'view',
      expiryDays   = 7,
      maxDownloads = null,
      password     = null,
    } = req.body

    if (!fileId) return res.status(400).json({ success: false, message: 'fileId is required.' })

    const file = await File.findOne({ _id: fileId, owner: req.user._id, isDeleted: false })
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' })

    // Build expiry date
    let expiresAt = null
    if (expiryDays && parseInt(expiryDays) > 0) {
      expiresAt = new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000)
    }

    // Generate a URL-safe token
    const token = crypto.randomBytes(16).toString('base64url')

    const shareData = {
      token,
      file:       file._id,
      createdBy:  req.user._id,
      permission,
      expiresAt,
      maxDownloads: maxDownloads ? parseInt(maxDownloads) : null,
      passwordProtected: !!password,
    }

    if (password) {
      shareData.passwordHash = password   // will be hashed by pre-save hook
    }

    const shareLink = await ShareLink.create(shareData)

    // Mark file as shared + increment count
    await File.findByIdAndUpdate(file._id, { shared: true, $inc: { shareCount: 1 } })

    await log({
      user:      req.user._id,
      file:      file._id,
      shareLink: shareLink._id,
      action:    'share',
      req,
      detail:    `Token: ${token}`,
    })

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const shareUrl    = `${frontendUrl}/s/${token}`

    res.status(201).json({
      success: true,
      shareUrl,
      shareLink: formatLink(shareLink),
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/share ── List all share links created by user ─────
router.get('/', protect, async (req, res, next) => {
  try {
    const links = await ShareLink.find({ createdBy: req.user._id, revoked: false })
      .populate('file', 'name size extension mimeType downloads')
      .sort('-createdAt')

    res.json({
      success: true,
      links: links.map(formatLink),
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/share/:token/info ── Public: get link metadata ────
router.get('/:token/info', optionalAuth, async (req, res, next) => {
  try {
    const shareLink = await ShareLink.findOne({ token: req.params.token })
      .populate('file', 'name size extension mimeType encrypted')

    if (!shareLink) {
      return res.status(404).json({ success: false, message: 'Share link not found.' })
    }
    if (!shareLink.isValid()) {
      return res.status(410).json({ success: false, message: 'This link has expired or been revoked.' })
    }

    res.json({
      success: true,
      info: {
        fileName:          shareLink.file?.name,
        fileSize:          shareLink.file?.size,
        fileExtension:     shareLink.file?.extension,
        permission:        shareLink.permission,
        passwordProtected: shareLink.passwordProtected,
        expiresAt:         shareLink.expiresAt,
        maxDownloads:      shareLink.maxDownloads,
        downloadCount:     shareLink.downloadCount,
        encrypted:         shareLink.file?.encrypted,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/share/:token/access ── Public: unlock with password
router.post('/:token/access', optionalAuth, async (req, res, next) => {
  try {
    const shareLink = await ShareLink.findOne({ token: req.params.token })
      .select('+passwordHash')
      .populate('file', 'name size extension mimeType')

    if (!shareLink) {
      return res.status(404).json({ success: false, message: 'Share link not found.' })
    }
    if (!shareLink.isValid()) {
      return res.status(410).json({ success: false, message: 'This link has expired, been revoked, or reached its download limit.' })
    }

    if (shareLink.passwordProtected) {
      const { password } = req.body
      if (!password) {
        return res.status(401).json({ success: false, message: 'Password required.' })
      }
      const valid = await shareLink.verifyPassword(password)
      if (!valid) {
        await log({
          user:      req.user?._id || null,
          file:      shareLink.file._id,
          shareLink: shareLink._id,
          action:    'view',
          req,
          status:    'denied',
          detail:    'Wrong share link password',
        })
        return res.status(401).json({ success: false, message: 'Incorrect password.' })
      }
    }

    await log({
      user:      req.user?._id || null,
      file:      shareLink.file._id,
      shareLink: shareLink._id,
      action:    'view',
      req,
      detail:    `Accessed via token: ${shareLink.token}`,
    })

    res.json({
      success: true,
      permission: shareLink.permission,
      file: {
        name:      shareLink.file.name,
        size:      shareLink.file.size,
        extension: shareLink.file.extension,
        mimeType:  shareLink.file.mimeType,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/share/:token/download ── Public: download via link
router.get('/:token/download', optionalAuth, async (req, res, next) => {
  try {
    const shareLink = await ShareLink.findOne({ token: req.params.token })
      .select('+passwordHash')
      .populate('file')

    if (!shareLink) {
      return res.status(404).json({ success: false, message: 'Share link not found.' })
    }
    if (!shareLink.isValid()) {
      return res.status(410).json({ success: false, message: 'This link has expired or reached its download limit.' })
    }
    if (!['download', 'edit'].includes(shareLink.permission)) {
      return res.status(403).json({ success: false, message: 'Download not permitted for this link.' })
    }
    if (shareLink.passwordProtected) {
      // Password must be passed as query param for direct download links
      const password = req.query.password || req.headers['x-share-password']
      if (!password) {
        return res.status(401).json({ success: false, message: 'Password required.' })
      }
      const valid = await shareLink.verifyPassword(password)
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Incorrect password.' })
      }
    }

    const file = shareLink.file
    if (!file || file.isDeleted || !require('fs').existsSync(file.storagePath)) {
      return res.status(404).json({ success: false, message: 'File data not found.' })
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`)
    res.setHeader('Content-Type', file.mimeType)

    await decryptFileToStream(file.storagePath, file.iv, res)

    // Increment counters
    await ShareLink.findByIdAndUpdate(shareLink._id, { $inc: { downloadCount: 1 } })
    await File.findByIdAndUpdate(file._id, { $inc: { downloads: 1 } })

    await log({
      user:      req.user?._id || null,
      file:      file._id,
      shareLink: shareLink._id,
      action:    'download',
      req,
      detail:    `Via token: ${shareLink.token}`,
    })
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/share/:id/revoke ── Revoke a share link ────────
router.delete('/:id/revoke', protect, async (req, res, next) => {
  try {
    const shareLink = await ShareLink.findOne({ _id: req.params.id, createdBy: req.user._id })
    if (!shareLink) return res.status(404).json({ success: false, message: 'Share link not found.' })

    shareLink.revoked = true
    await shareLink.save()

    // If no more active links for the file, mark it as not shared
    const activeLinks = await ShareLink.countDocuments({ file: shareLink.file, revoked: false })
    if (activeLinks === 0) {
      await File.findByIdAndUpdate(shareLink.file, { shared: false })
    }

    await log({
      user:      req.user._id,
      file:      shareLink.file,
      shareLink: shareLink._id,
      action:    'revoke',
      req,
    })

    res.json({ success: true, message: 'Share link revoked.' })
  } catch (err) {
    next(err)
  }
})

// ── Helper ─────────────────────────────────────────────────────
function formatLink(link) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  return {
    id:                link._id,
    token:             link.token,
    shareUrl:          `${frontendUrl}/s/${link.token}`,
    file:              link.file,
    permission:        link.permission,
    passwordProtected: link.passwordProtected,
    expiresAt:         link.expiresAt,
    maxDownloads:      link.maxDownloads,
    downloadCount:     link.downloadCount,
    revoked:           link.revoked,
    createdAt:         link.createdAt,
  }
}

module.exports = router
