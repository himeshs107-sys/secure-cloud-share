const jwt = require('jsonwebtoken')

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id)

  const userData = {
    id:           user._id,
    name:         user.name,
    email:        user.email,
    role:         user.role,
    avatar:       user.avatar,
    plan:         user.plan,
    isGuest:      user.isGuest || false,
    storageUsed:  user.storageUsed,
    storageTotal: user.storageTotal,
    location:     user.location,
    createdAt:    user.createdAt,
  }

  res.status(statusCode).json({
    success: true,
    token,
    user: userData,
  })
}

module.exports = { generateToken, sendTokenResponse }
