import { motion } from 'framer-motion'
import { formatBytes, formatExpiry } from '../../utils/helpers'
import { filesApi } from '../../api/files'
import toast from 'react-hot-toast'

function FileIcon({ type }) {
  if (type?.startsWith('image/')) return (
    <svg className="w-5 h-5 text-violet-500" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
      <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
    </svg>
  )
  if (type === 'application/pdf') return (
    <svg className="w-5 h-5 text-red-500" viewBox="0 0 16 16" fill="currentColor">
      <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V9H3V2a1 1 0 0 1 1-1h5.5v2z"/>
    </svg>
  )
  if (type === 'application/zip') return (
    <svg className="w-5 h-5 text-amber-500" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6.5 7.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v.938l.4 1.599a1 1 0 0 1-.416 1.074l-.93.62a1 1 0 0 1-1.109 0l-.93-.62a1 1 0 0 1-.415-1.074l.4-1.599V7.5z"/>
      <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm5.5 2h1v1h-1V2zm-1 1h1v1h-1V3zm1 1h1v1h-1V4zm-1 1h1v1h-1V5zm1 1h1v1h-1V6zm-1 1h1v1h-1V7z"/>
    </svg>
  )
  if (type?.includes('word') || type?.includes('document')) return (
    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 16 16" fill="currentColor">
      <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
    </svg>
  )
  if (type === 'text/plain') return (
    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 16 16" fill="currentColor">
      <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
      <path d="M4.5 7a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7zm0 2a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7zm0 2a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4z"/>
    </svg>
  )
  return (
    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 16 16" fill="currentColor">
      <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5z"/>
    </svg>
  )
}

export default function FileCard({ file, onDelete }) {
  const expiry = formatExpiry(file.expires_at)
  const isExpired = expiry === 'Expired'

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = filesApi.getDownloadUrl(file.id)
    a.download = file.original_name
    a.click()
    toast.success('Download started')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                  hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors
                  ${isExpired ? 'opacity-50' : ''}`}
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-border
                      flex items-center justify-center flex-shrink-0">
        <FileIcon type={file.file_type} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate leading-tight">
          {file.original_name}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
          {formatBytes(file.size)}
          {!isExpired && <span> · {expiry}</span>}
          {isExpired && <span className="text-red-400"> · Expired</span>}
          {file.download_count > 0 && <span> · {file.download_count} dl</span>}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {!isExpired && (
          <button onClick={handleDownload}
            className="inline-flex items-center gap-1 text-xs font-semibold
                       text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white
                       px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border
                       hover:bg-white dark:hover:bg-dark-card transition-colors">
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
            Download
          </button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(file.id)}
            className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500
                       hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  )
}
