export function formatExpiry(expiresAt) {
  if (!expiresAt) return '—'
  const now = new Date()
  const exp = new Date(expiresAt)
  if (isNaN(exp.getTime())) return '—'
  const diff = exp - now

  if (diff <= 0) return 'Expired'

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)

  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatDate(dateString) {
  if (!dateString) return '—'
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export function copyToClipboard(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text)
  const el = document.createElement('textarea')
  el.value = text
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
  return Promise.resolve()
}

export function getFileIcon(fileType) {
  if (fileType?.startsWith('image/')) return '🖼️'
  if (fileType === 'application/pdf') return '📄'
  if (fileType === 'application/zip') return '🗜️'
  if (fileType?.includes('word') || fileType?.includes('document')) return '📝'
  return '📁'
}

export function shareUrl(url, title = 'Synclipt') {
  if (navigator.share) {
    return navigator.share({ title, url })
  }
  return copyToClipboard(url)
}

export function buildClipboardUrl(code) {
  return `${window.location.origin}/synclipt/clipboard/${code}`
}
