// crypto_helper.js
import crypto from 'node:crypto';

export function generateNonce(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

export function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}
