import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { copyToClipboard, formatExpiry, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

function CopyIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

export default function ClipboardCard({ clipboard, isActive = false, showActions = true }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    await copyToClipboard(clipboard.content)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isActive ? 'card-active' : 'card'} p-5 transition-all duration-200 hover:shadow-md`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="tag bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs">
            {clipboard.files?.length > 0 ? 'FILE' : 'TEXT'}
          </span>
          {clipboard.burn_after_read && (
            <span className="tag-burned">BURN</span>
          )}
          {clipboard.has_password && (
            <span className="tag-protected">PROTECTED</span>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
          <span className="live-dot" />
          Live
        </span>
      </div>

      {/* Team names / Clipboard code style */}
      <div className="flex items-center justify-between mb-3">
        <Link to={`/clipboard/${clipboard.code}`} className="group">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            Clipboard
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
            {clipboard.content?.slice(0, 60) || (clipboard.files?.length > 0 ? `${clipboard.files.length} file(s)` : 'Empty')}
          </p>
        </Link>
        <div className={`code-badge ${isActive ? 'bg-primary-500 text-gray-900' : ''}`}>
          {clipboard.code}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {formatDate(clipboard.created_at)}
        </span>
        {showActions && (
          <div className="flex items-center gap-2">
            {clipboard.content && (
              <button
                onClick={handleCopy}
                className={`btn-outline text-sm py-1.5 px-3 flex items-center gap-1.5 ${copied ? 'bg-green-50 border-green-400 text-green-600' : ''}`}
              >
                <CopyIcon />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
            <Link to={`/clipboard/${clipboard.code}`} className="btn-primary text-sm py-1.5 px-3">
              Open
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  )
}
