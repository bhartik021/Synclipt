export const EXPIRY_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '12 hours', value: 12 },
  { label: '24 hours', value: 24 },
  { label: '3 days', value: 72 },
  { label: '7 days', value: 168 },
  { label: '30 days', value: 720 },
]

export const ALLOWED_FILE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/zip': '.zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
}

const _wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
export const WS_URL = import.meta.env.VITE_WS_URL || `${_wsProto}//${window.location.host}`

export const MAX_FILE_SIZE = 50 * 1024 * 1024

export const THEME_KEY = 'synclipt_theme'

export const DEFAULT_EXPIRY_KEY   = 'sc_defaultExpiry'
export const DEFAULT_BURN_KEY     = 'sc_burnAfterRead'
export const DEFAULT_EXPIRY_VALUE = 24
