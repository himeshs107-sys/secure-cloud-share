const mongoose = require('mongoose')

const accessLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      default: null,
    },
    // file is optional - auth actions (login/register) have no file
    file: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'File',
      default: null,
    },
    shareLink: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'ShareLink',
      default: null,
    },
    action: {
      type: String,
      enum: ['upload', 'download', 'view', 'share', 'delete', 'revoke', 'login', 'register'],
      required: true,
    },
    ip:        { type: String, default: '' },
    userAgent: { type: String, default: '' },
    status:    { type: String, enum: ['success', 'failed', 'denied'], default: 'success' },
    detail:    { type: String, default: '' },
  },
  { timestamps: true }
)

accessLogSchema.index({ file: 1, createdAt: -1 })
accessLogSchema.index({ user: 1, createdAt: -1 })
accessLogSchema.index({ action: 1 })

module.exports = mongoose.model('AccessLog', accessLogSchema)
