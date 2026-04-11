const express   = require('express')
const AccessLog = require('../models/AccessLog')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()
router.use(protect)

// ── GET /api/logs ── Current user's own logs ───────────────────
router.get('/', async (req, res, next) => {
  try {
    const { action, page = 1, limit = 100 } = req.query
    const query = { user: req.user._id }
    if (action && action !== 'All') query.action = action

    const skip  = (parseInt(page) - 1) * parseInt(limit)
    const total = await AccessLog.countDocuments(query)
    const logs  = await AccessLog.find(query)
      .populate('file',      'name extension')
      .populate('shareLink', 'token')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), logs })
  } catch (err) { next(err) }
})

// ── GET /api/logs/all ── Admin: all logs ───────────────────────
router.get('/all', adminOnly, async (req, res, next) => {
  try {
    const { action, userId, page = 1, limit = 200 } = req.query
    const query = {}
    if (action && action !== 'All') query.action = action
    if (userId) query.user = userId

    const skip  = (parseInt(page) - 1) * parseInt(limit)
    const total = await AccessLog.countDocuments(query)
    const logs  = await AccessLog.find(query)
      .populate('user',      'name email avatar role isGuest')
      .populate('file',      'name extension')
      .populate('shareLink', 'token')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), logs })
  } catch (err) { next(err) }
})

// ── GET /api/logs/file/:fileId ─────────────────────────────────
router.get('/file/:fileId', async (req, res, next) => {
  try {
    const logs = await AccessLog.find({ file: req.params.fileId })
      .populate('user',      'name email avatar')
      .populate('shareLink', 'token')
      .sort('-createdAt')
      .limit(100)
    res.json({ success: true, logs })
  } catch (err) { next(err) }
})

module.exports = router
