const express = require('express')
const User    = require('../models/User')
const File    = require('../models/File')
const { protect, adminOnly } = require('../middleware/auth')

const router = express.Router()
router.use(protect, adminOnly)

// ── GET /api/admin/users ───────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const { search, page = 1, limit = 100 } = req.query
    // Exclude guest accounts from admin user list
    const query = { isGuest: { $ne: true } }
    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }
    const skip  = (parseInt(page) - 1) * parseInt(limit)
    const total = await User.countDocuments(query)
    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))

    // Attach file counts per user
    const userIds    = users.map(u => u._id)
    const fileCounts = await File.aggregate([
      { $match: { owner: { $in: userIds }, isDeleted: false } },
      { $group: { _id: '$owner', count: { $sum: 1 }, size: { $sum: '$size' } } },
    ])
    const countMap = Object.fromEntries(fileCounts.map(fc => [fc._id.toString(), fc]))

    const enriched = users.map(u => ({
      ...u.toObject(),
      fileCount:   countMap[u._id.toString()]?.count || 0,
      storageUsed: countMap[u._id.toString()]?.size  || u.storageUsed,
    }))

    res.json({
      success: true,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users: enriched,
    })
  } catch (err) { next(err) }
})

// ── GET /api/admin/users/:id ───────────────────────────────────
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })
    res.json({ success: true, user })
  } catch (err) { next(err) }
})

// ── PUT /api/admin/users/:id ───────────────────────────────────
router.put('/users/:id', async (req, res, next) => {
  try {
    const { role, plan, isActive, storageTotal } = req.body
    const updates = {}
    if (role         !== undefined) updates.role         = role
    if (plan         !== undefined) updates.plan         = plan
    if (isActive     !== undefined) updates.isActive     = isActive
    if (storageTotal !== undefined) updates.storageTotal = storageTotal

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    }).select('-password')
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })
    res.json({ success: true, user })
  } catch (err) { next(err) }
})

// ── DELETE /api/admin/users/:id ────────────────────────────────
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' })
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })
    res.json({ success: true, message: 'User deleted.' })
  } catch (err) { next(err) }
})

// ── GET /api/admin/stats ───────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalFiles, totalAdmins, storageAgg, recentUsers] = await Promise.all([
      User.countDocuments({ isGuest: { $ne: true } }),
      File.countDocuments({ isDeleted: false }),
      User.countDocuments({ role: 'admin' }),
      File.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$size' }, downloads: { $sum: '$downloads' } } },
      ]),
      User.find({ isGuest: { $ne: true } }).select('-password').sort('-createdAt').limit(5),
    ])

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalFiles,
        totalAdmins,
        totalStorage:   storageAgg[0]?.total     || 0,
        totalDownloads: storageAgg[0]?.downloads || 0,
        recentUsers,
      },
    })
  } catch (err) { next(err) }
})

module.exports = router
