import { motion, AnimatePresence } from 'framer-motion'
import { formatTime } from '../../utils/helpers'

const EVENT_STYLES = {
  'clipboard.updated': {
    label: 'UPDATED',
    bg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    icon: '✏️',
  },
  'clipboard.deleted': {
    label: 'DELETED',
    bg: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
    icon: '🗑️',
  },
  'clipboard.expired': {
    label: 'EXPIRED',
    bg: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    dot: 'bg-gray-400',
    icon: '⏰',
  },
  'connection.established': {
    label: 'CONNECTED',
    bg: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    dot: 'bg-green-500',
    icon: '🔗',
  },
}

function EventTag({ type }) {
  const style = EVENT_STYLES[type] || {
    label: type.toUpperCase().replace('CLIPBOARD.', ''),
    bg: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
    dot: 'bg-primary-500',
    icon: '📋',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold tracking-wide ${style.bg}`}>
      {style.label}
    </span>
  )
}

export default function ActivityFeed({ events, wsStatus }) {
  return (
    <div className="activity-panel p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Sync Activity</h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
          ${wsStatus === 'connected' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
          Real-time
        </span>
      </div>

      {events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Waiting for events</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Changes will appear here in real-time</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
          <AnimatePresence initial={false}>
            {events.map((event, i) => {
              const style = EVENT_STYLES[event.type] || EVENT_STYLES['clipboard.updated']
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-3"
                >
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
                    {i < events.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 dark:bg-dark-border" />
                    )}
                  </div>
                  <div className="pb-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        {formatTime(event.receivedAt)}
                      </span>
                      <EventTag type={event.type} />
                    </div>
                    {event.data?.content && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-border rounded-lg p-2 font-mono truncate">
                        {event.data.content.slice(0, 60)}
                        {event.data.content.length > 60 ? '…' : ''}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
