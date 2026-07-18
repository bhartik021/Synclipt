// AES-GCM 256-bit E2E encryption using the Web Crypto API.
// The key never leaves the browser — it travels only in the URL hash (#e2e=…),
// which browsers never send to the server.

const ALGO = { name: 'AES-GCM', length: 256 }

export async function generateKey() {
  const key = await crypto.subtle.generateKey(ALGO, true, ['encrypt', 'decrypt'])
  const raw = await crypto.subtle.exportKey('raw', key)
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
}

async function importKey(base64) {
  const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey('raw', raw, ALGO, false, ['encrypt', 'decrypt'])
}

export async function encryptContent(plaintext, keyBase64) {
  const key = await importKey(keyBase64)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(12 + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), 12)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptContent(encryptedBase64, keyBase64) {
  try {
    const key = await importKey(keyBase64)
    const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    return new TextDecoder().decode(plaintext)
  } catch {
    return null // wrong key or corrupted data
  }
}

export function getKeyFromHash() {
  const hash = window.location.hash
  const match = hash.match(/[#&]e2e=([^&]+)/)
  return match ? match[1] : null
}

export function buildEncryptedUrl(code, keyBase64) {
  return `${window.location.origin}/clipboard/${code}#e2e=${keyBase64}`
}
