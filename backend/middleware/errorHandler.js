// ── Centralised error handler ──────────────────────────────────
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message    = err.message    || 'Internal Server Error'

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0]
    message    = `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Value'} already exists.`
    statusCode = 409
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message    = Object.values(err.errors).map(e => e.message).join('. ')
    statusCode = 400
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    message    = `Invalid ${err.path}: ${err.value}`
    statusCode = 400
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR]', err)
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

// ── 404 catcher ────────────────────────────────────────────────
const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` })
}

module.exports = { errorHandler, notFound }
