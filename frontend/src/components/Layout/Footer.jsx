import { useNavigate } from 'react-router-dom'

export default function Footer() {
  const navigate = useNavigate()
  const go = (tab) => navigate(`/?tab=${tab}`)

  return (
    <footer className="border-t border-gray-100 dark:border-dark-border mt-12 py-7 bg-white dark:bg-dark-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
              <rect x="8" y="2" width="8" height="4" rx="1" />
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">Synclipt</span>
          <span className="text-sm text-gray-400 dark:text-gray-500 hidden sm:inline">
            — Real-time clipboard sharing
          </span>
        </div>
        <nav className="flex items-center gap-5 text-sm text-gray-500 dark:text-gray-400">
          {[
            { label: 'Create', tab: 'create' },
            { label: 'Retrieve', tab: 'retrieve' },
            { label: 'Files', tab: 'files' },
            { label: 'Settings', tab: 'settings' },
          ].map(({ label, tab }) => (
            <button
              key={tab}
              onClick={() => go(tab)}
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </footer>
  )
}
