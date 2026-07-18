import { formatExpiry } from '../../utils/helpers'

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      Live
    </span>
  )
}

export function SyncedBadge({ status }) {
  const configs = {
    connected: {
      bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      dot: 'bg-green-500',
      label: 'LIVE SYNCED',
    },
    reconnecting: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-400',
      dot: 'bg-yellow-500 animate-pulse',
      label: 'RECONNECTING',
    },
    disconnected: {
      bg: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      text: 'text-gray-500 dark:text-gray-400',
      dot: 'bg-gray-400',
      label: 'DISCONNECTED',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      text: 'text-red-600 dark:text-red-400',
      dot: 'bg-red-500',
      label: 'ERROR',
    },
  }
  const c = configs[status] || configs.disconnected
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

export function TagBadge({ type }) {
  const tags = {
    TEXT: 'tag-text',
    FILE: 'tag-file',
    PROTECTED: 'tag-protected',
    BURNED: 'tag-burned',
    EXPIRED: 'tag-expired',
    BURN_AFTER_READ: 'tag bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  }
  return <span className={tags[type] || 'tag bg-gray-100 dark:bg-gray-800 text-gray-600'}>{type}</span>
}

export function ExpiryBadge({ expiresAt }) {
  const text = formatExpiry(expiresAt)
  const isExpired = text === 'Expired'
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
      ${isExpired ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
      {text}
    </span>
  )
}
