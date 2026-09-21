const crypto = require('crypto');

/**
 * Calculates a SHA-256 hash for a given string.
 * @param {string} text - The input text
 * @returns {string} The hex representation of the SHA-256 hash
 */
function calculateTextHash(text) {
  if (!text) return '';
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Calculates a SHA-256 hash for a given buffer.
 * @param {Buffer} buffer - The file buffer
 * @returns {string} The hex representation of the SHA-256 hash
 */
function calculateBufferHash(buffer) {
  if (!buffer) return '';
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = {
  calculateTextHash,
  calculateBufferHash
};
