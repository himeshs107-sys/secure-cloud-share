const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    originalName: { type: String, required: true },
    mimeType:     { type: String, required: true },
    size:         { type: Number, required: true },   // bytes
    extension:    { type: String, required: true },

    // ── Storage ────────────────────────────────────────────────
    storagePath:   { type: String, required: true },  // disk path (encrypted file)
    encryptedName: { type: String, required: true },  // UUID filename on disk

    // ── Ownership ──────────────────────────────────────────────
    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // ── Encryption ─────────────────────────────────────────────
    encrypted:  { type: Boolean, default: true },
    iv:         { type: String },   // AES IV stored with file record

    // ── Sharing ────────────────────────────────────────────────
    shared:     { type: Boolean, default: false },
    shareCount: { type: Number,  default: 0 },
    downloads:  { type: Number,  default: 0 },

    // ── Metadata ───────────────────────────────────────────────
    tags:       { type: [String], default: [] },
    isDeleted:  { type: Boolean,  default: false },
    deletedAt:  { type: Date },
  },
  { timestamps: true }
)

// Index for fast owner lookups
fileSchema.index({ owner: 1, isDeleted: 1 })
fileSchema.index({ name: 'text', tags: 'text' })

// Soft-delete helper
fileSchema.methods.softDelete = function () {
  this.isDeleted = true
  this.deletedAt = new Date()
  return this.save()
}

module.exports = mongoose.model('File', fileSchema)
