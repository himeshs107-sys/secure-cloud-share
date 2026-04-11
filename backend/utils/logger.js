const AccessLog = require('../models/AccessLog')

/**
 * Log an action to the database.
 * All fields are optional except action + file (or just action for auth events).
 */
const log = async ({
  user      = null,
  file      = null,
  shareLink = null,
  action,
  req       = null,
  status    = 'success',
  detail    = '',
}) => {
  try {
    await AccessLog.create({
      user,
      file,
      shareLink,
      action,
      ip:        req?.ip || req?.headers?.['x-forwarded-for'] || '',
      userAgent: req?.headers?.['user-agent'] || '',
      status,
      detail,
    })
  } catch (err) {
    // Never crash the app because of a logging failure
    console.error('[Logger] Failed to write access log:', err.message)
  }
}

module.exports = { log }
