const crypto = require('crypto')
const fs     = require('fs')
const path   = require('path')

const ALGORITHM  = 'aes-256-cbc'
const KEY_LENGTH = 32  // bytes for AES-256
const IV_LENGTH  = 16  // bytes for AES-CBC IV

// Derive a fixed 32-byte key from the secret
const deriveKey = () => {
  const secret = process.env.AES_SECRET || 'vaultshare_default_key_change_me!'
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Encrypt a file in place (reads source, writes encrypted to dest).
 * Returns the hex-encoded IV (stored in DB alongside the file record).
 */
const encryptFile = (sourcePath, destPath) => {
  return new Promise((resolve, reject) => {
    const iv  = crypto.randomBytes(IV_LENGTH)
    const key = deriveKey()
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    const input  = fs.createReadStream(sourcePath)
    const output = fs.createWriteStream(destPath)

    input.pipe(cipher).pipe(output)

    output.on('finish', () => resolve(iv.toString('hex')))
    output.on('error', reject)
    input.on('error', reject)
  })
}

/**
 * Decrypt a file and stream the result to the response object.
 * @param {string} encryptedPath - path to the .enc file
 * @param {string} ivHex         - IV stored in DB
 * @param {object} res           - Express response to pipe into
 */
const decryptFileToStream = (encryptedPath, ivHex, res) => {
  return new Promise((resolve, reject) => {
    const iv       = Buffer.from(ivHex, 'hex')
    const key      = deriveKey()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

    const input = fs.createReadStream(encryptedPath)
    input.pipe(decipher).pipe(res)

    res.on('finish', resolve)
    decipher.on('error', reject)
    input.on('error', reject)
  })
}

/**
 * Encrypt a plain string (used for metadata / passwords).
 */
const encryptString = (text) => {
  const iv     = crypto.randomBytes(IV_LENGTH)
  const key    = deriveKey()
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const enc    = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + enc.toString('hex')
}

/**
 * Decrypt a string encrypted with encryptString.
 */
const decryptString = (ciphertext) => {
  const [ivHex, encHex] = ciphertext.split(':')
  const iv       = Buffer.from(ivHex, 'hex')
  const key      = deriveKey()
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  const dec      = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()])
  return dec.toString('utf8')
}

module.exports = { encryptFile, decryptFileToStream, encryptString, decryptString }
