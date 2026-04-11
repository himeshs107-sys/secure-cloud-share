const express = require('express')
const crypto  = require('crypto')
const User    = require('../models/User')
const File    = require('../models/File')
const { protect }           = require('../middleware/auth')
const { sendTokenResponse } = require('../utils/token')
const { log }               = require('../utils/logger')

const router = express.Router()

// ── POST /api/auth/register ────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' })
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' })

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing)
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' })

    const user = await User.create({ name, email, password })
    await log({ user: user._id, action: 'register', req, detail: `New account: ${email}` })
    sendTokenResponse(user, 201, res)
  } catch (err) { next(err) }
})

// ── POST /api/auth/login ───────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' })

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user || !user.isActive)
      return res.status(401).json({ success: false, message: 'Account not found or wrong password.' })

    const match = await user.comparePassword(password)
    if (!match) {
      await log({ user: user._id, action: 'login', req, status: 'failed', detail: 'Wrong password' })
      return res.status(401).json({ success: false, message: 'Account not found or wrong password.' })
    }

    await log({ user: user._id, action: 'login', req, detail: 'Login success' })
    sendTokenResponse(user, 200, res)
  } catch (err) { next(err) }
})

// ── POST /api/auth/guest ── Create temporary guest account ─────
router.post('/guest', async (req, res, next) => {
  try {
    const guestId   = crypto.randomBytes(6).toString('hex')
    const guestName = `Guest_${guestId}`
    const email     = `guest_${guestId}@vaultshare.temp`
    const password  = crypto.randomBytes(16).toString('hex')

    const user = await User.create({
      name:         guestName,
      email,
      password,
      role:         'guest',
      avatar:       'GU',
      plan:         'Guest',
      isGuest:      true,
      storageTotal: 500 * 1024 * 1024, // 500 MB for guests
    })

    await log({ user: user._id, action: 'login', req, detail: 'Guest login' })
    sendTokenResponse(user, 201, res)
  } catch (err) { next(err) }
})

// ── POST /api/auth/logout ── Delete guest account on logout ────
router.post('/logout', protect, async (req, res, next) => {
  try {
    if (req.user.isGuest) {
      // Delete all files uploaded by this guest
      const files = await File.find({ owner: req.user._id })
      const fs = require('fs')
      for (const file of files) {
        if (file.storagePath && fs.existsSync(file.storagePath)) {
          fs.unlinkSync(file.storagePath)
        }
      }
      await File.deleteMany({ owner: req.user._id })
      await User.findByIdAndDelete(req.user._id)
      return res.json({ success: true, message: 'Guest session ended and data removed.' })
    }
    res.json({ success: true, message: 'Logged out.' })
  } catch (err) { next(err) }
})

// ── GET /api/auth/me ───────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user })
})

// ── PUT /api/auth/me ── update profile + avatar ────────────────
router.put('/me', protect, async (req, res, next) => {
  try {
    const { name, location, avatar } = req.body
    const updates = {}
    if (name !== undefined)     updates.name     = name
    if (location !== undefined) updates.location = location
    if (avatar !== undefined)   updates.avatar   = avatar  // accepts base64 data URL

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    res.json({ success: true, user })
  } catch (err) { next(err) }
})

// ── PUT /api/auth/change-password ─────────────────────────────
router.put('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both passwords are required.' })
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' })

    const user = await User.findById(req.user._id).select('+password')
    const match = await user.comparePassword(currentPassword)
    if (!match)
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' })

    user.password = newPassword
    await user.save()
    res.json({ success: true, message: 'Password updated successfully.' })
  } catch (err) { next(err) }
})

// ── POST /api/auth/forgot-password ────────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.json({ success: true, message: 'If that email exists, a reset token has been sent.' })

    const resetToken = crypto.randomBytes(32).toString('hex')
    user.passwordResetToken   = crypto.createHash('sha256').update(resetToken).digest('hex')
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000)
    await user.save({ validateBeforeSave: false })

    const response = { success: true, message: 'Password reset token generated.' }
    if (process.env.NODE_ENV === 'development') response.resetToken = resetToken
    res.json(response)
  } catch (err) { next(err) }
})

// ── POST /api/auth/reset-password ─────────────────────────────
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, email, newPassword } = req.body
    if (!token || !email || !newPassword)
      return res.status(400).json({ success: false, message: 'Token, email and new password are required.' })

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      email:                email.toLowerCase(),
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires')

    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' })

    user.password             = newPassword
    user.passwordResetToken   = undefined
    user.passwordResetExpires = undefined
    await user.save()
    res.json({ success: true, message: 'Password reset successfully. Please log in.' })
  } catch (err) { next(err) }
})

module.exports = router
