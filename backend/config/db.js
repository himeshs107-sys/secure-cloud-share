const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These are the recommended options for Mongoose 8+
    })
    console.log(` MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.error(' MongoDB connection error:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
