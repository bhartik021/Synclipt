export function formatExpiry(expiresAt) {
  if (!expiresAt) return '—'
  const exp = new Date(expiresAt)
  if (isNaN(exp.getTime())) return '—'
  const diff = exp - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3_600_000)
  if (h < 24) return `${h}h left`
  return `${Math.floor(h / 24)}d left`
}

export function formatDate(dateString) {
  if (!dateString) return '—'
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
