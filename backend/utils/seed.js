/**
 * Run with:  node utils/seed.js
 * Seeds the three default users: Himesh (admin), Kaushal, Milan
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const mongoose = require('mongoose')
const User     = require('../models/User')
const connectDB = require('../config/db')

const SEEDS = [
  {
    name:         'Himesh',
    email:        'himesh@gmail.com',
    password:     'Himesh@123',
    role:         'admin',
    avatar:       'HI',
    plan:         'Pro',
    location:     'Rajkot, India',
    storageTotal: 100 * 1024 * 1024 * 1024,  // 100 GB
  },
  {
    name:         'Kaushal',
    email:        'kaushal@gmail.com',
    password:     'Kaushal@123',
    role:         'user',
    avatar:       'KA',
    plan:         'Free',
    location:     'Delhi, India',
    storageTotal: 5 * 1024 * 1024 * 1024,    // 5 GB
  },
  {
    name:         'Milan',
    email:        'milan@gmail.com',
    password:     'Milan@123',
    role:         'user',
    avatar:       'MI',
    plan:         'Free',
    location:     'Mumbai, India',
    storageTotal: 5 * 1024 * 1024 * 1024,    // 5 GB
  },
]

const seed = async () => {
  await connectDB()
  console.log('🌱  Seeding users...')

  for (const data of SEEDS) {
    const exists = await User.findOne({ email: data.email })
    if (exists) {
      console.log(`  ⏭   Skipped (already exists): ${data.email}`)
      continue
    }
    await User.create(data)
    console.log(`  ✅  Created: ${data.email} [${data.role}]`)
  }

  console.log('\n✅  Seeding complete.')
  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => {
  console.error('❌  Seed failed:', err)
  process.exit(1)
})
