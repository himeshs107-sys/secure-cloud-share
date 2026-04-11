const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const express   = require('express')
const cors      = require('cors')
const helmet    = require('helmet')
const morgan    = require('morgan')
const rateLimit = require('express-rate-limit')

const connectDB = require('./config/db')
const { errorHandler, notFound } = require('./middleware/errorHandler')

const authRoutes  = require('./routes/auth')
const fileRoutes  = require('./routes/files')
const shareRoutes = require('./routes/share')
const adminRoutes = require('./routes/admin')
const logRoutes   = require('./routes/logs')

connectDB()

const app = express()

app.use(helmet())

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
]
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Fix 3: Increase rate limits significantly - pages make many API calls
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      2000,   // was 200
  message:  { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
  skip: (req) => req.path === '/health',
})
app.use(globalLimiter)

// Auth limiter - relaxed
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,    // was 20
  message:  { success: false, message: 'Too many login attempts, please try again in 15 minutes.' },
})

app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', env: process.env.NODE_ENV, time: new Date().toISOString() })
})

app.use('/api/auth',  authLimiter, authRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/share', shareRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/logs',  logRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`\n  VaultShare API running on port ${PORT}`)
  console.log(`    ENV  : ${process.env.NODE_ENV || 'development'}`)
  console.log(`    Mongo: ${process.env.MONGO_URI}`)
  console.log(`    CORS : ${allowedOrigins.join(', ')}\n`)
})
