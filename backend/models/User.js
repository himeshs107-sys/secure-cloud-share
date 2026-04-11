const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: 6,
      select:    false,
    },
    role: {
      type:    String,
      enum:    ['admin', 'user', 'guest'],
      default: 'user',
    },
    // avatar: stores initials (e.g. "HI") OR a base64 data URL for profile pic
    avatar: {
      type:    String,
      default: '',
    },
    plan: {
      type:    String,
      enum:    ['Free', 'Pro', 'Enterprise', 'Guest'],
      default: 'Free',
    },
    storageUsed:  { type: Number, default: 0 },
    storageTotal: { type: Number, default: 5 * 1024 * 1024 * 1024 },
    location:     { type: String, default: '' },
    isActive:     { type: Boolean, default: true },

    // Guest / temporary account - auto-deleted on logout
    isGuest:      { type: Boolean, default: false },

    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },
  },
  { timestamps: true }
)

// Auto-generate avatar initials only if no avatar set and it's not a base64 image
userSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.avatar) {
    this.avatar = this.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  next()
})

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

module.exports = mongoose.model('User', userSchema)
