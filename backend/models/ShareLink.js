const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const shareLinkSchema = new mongoose.Schema(
  {
    token: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },
    file: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'File',
      required: true,
    },
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // ── Access control ─────────────────────────────────────────
    permission: {
      type:    String,
      enum:    ['view', 'download', 'edit'],
      default: 'view',
    },

    // ── Password protection ────────────────────────────────────
    passwordProtected: { type: Boolean, default: false },
    passwordHash:      { type: String,  select: false },

    // ── Expiry ─────────────────────────────────────────────────
    expiresAt: { type: Date, default: null },  // null = never

    // ── Download tracking ──────────────────────────────────────
    maxDownloads:  { type: Number, default: null },   // null = unlimited
    downloadCount: { type: Number, default: 0 },

    // ── Status ─────────────────────────────────────────────────
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// ── Hash share-link password before save ───────────────────────
shareLinkSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next()
  const salt = await bcrypt.genSalt(10)
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt)
  next()
})

// ── Instance helper: check share password ─────────────────────
shareLinkSchema.methods.verifyPassword = async function (candidate) {
  if (!this.passwordProtected) return true
  return bcrypt.compare(candidate, this.passwordHash)
}

// ── Instance helper: is the link still usable? ────────────────
shareLinkSchema.methods.isValid = function () {
  if (this.revoked) return false
  if (this.expiresAt && new Date() > this.expiresAt) return false
  if (this.maxDownloads !== null && this.downloadCount >= this.maxDownloads) return false
  return true
}

module.exports = mongoose.model('ShareLink', shareLinkSchema)
