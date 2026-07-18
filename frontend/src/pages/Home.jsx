import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { usePublicIP, useDeviceInfo } from '../hooks/usePublicIP'
import Create from './Create'
import Retrieve from './Retrieve'
import Files from './Files'
import Settings from './Settings'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'create',   label: 'Clipboard' },
  { id: 'retrieve', label: 'Retrieve' },
]
const PANELS = { create: Create, retrieve: Retrieve, settings: Settings }

function TopBar({ active, setTab, onSettings }) {
  const { isDark, mode, toggle } = useTheme()
  const { data: ip, isLoading: ipLoading } = usePublicIP()
  const { browser, os } = useDeviceInfo()
  const [copied, setCopied] = useState(false)

  const copyIP = () => {
    if (!ip) return
    navigator.clipboard.writeText(ip)
    setCopied(true)
    toast.success('IP address copied', { id: 'copy-ip' })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="sticky top-0 z-50 bg-white dark:bg-dark-card
                    border-b border-gray-100 dark:border-dark-border
                    shadow-[0_1px_0_rgba(0,0,0,0.05)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-stretch h-[52px]">

        {/* ── Logo ───────────────────────────────────────── */}
        <div className="flex items-center pr-5 mr-2
                        border-r border-gray-100 dark:border-dark-border flex-shrink-0">
          <span className="font-black text-sm text-gray-900 dark:text-white tracking-tight">
            Synclipt
          </span>
        </div>

        {/* ── Tabs ───────────────────────────────────────── */}
        <nav className="flex items-stretch flex-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = active === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`relative flex items-center px-4 text-sm font-semibold
                            whitespace-nowrap transition-colors duration-150 flex-shrink-0
                            ${isActive
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F5C518]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* ── Right controls ─────────────────────────────── */}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-100 dark:border-dark-border flex-shrink-0">

          {/* IP chip */}
          <button
            onClick={copyIP}
            title={`${browser} on ${os} — click to copy`}
            className="hidden md:flex items-center gap-1.5 h-7 px-2.5
                       bg-gray-50 dark:bg-dark-border hover:bg-gray-100 dark:hover:bg-dark-border/80
                       rounded-lg transition-colors duration-150 group"
          >
            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z"/>
            </svg>
            {ipLoading ? (
              <span className="text-[11px] font-mono text-gray-400 animate-pulse">···</span>
            ) : (
              <span className={`text-[11px] font-mono font-bold transition-colors
                ${copied ? 'text-green-500' : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                {copied ? 'copied!' : (ip ?? '—')}
              </span>
            )}
          </button>

          {/* Settings gear */}
          <button
            onClick={onSettings}
            aria-label="Settings"
            title="Settings"
            className={`w-8 h-8 rounded-lg flex items-center justify-center
                       transition-colors duration-150
                       ${active === 'settings'
                         ? 'bg-gray-900 dark:bg-[#F5C518] text-white dark:text-gray-900'
                         : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border'
                       }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.474l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
            </svg>
          </button>

          {/* Theme toggle — cycles light → dark → system */}
          <button
            onClick={toggle}
            aria-label={`Theme: ${mode} — click to cycle`}
            title={`Theme: ${mode} — click to cycle`}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       text-gray-500 dark:text-gray-400
                       hover:bg-gray-100 dark:hover:bg-dark-border
                       transition-colors duration-150"
          >
            {mode === 'light' && (
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM0 8a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2A.5.5 0 0 1 0 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
              </svg>
            )}
            {mode === 'dark' && (
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
              </svg>
            )}
            {mode === 'system' && (
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0 4s0-2 2-2h12s2 0 2 2v6s0 2-2 2h-4q0 1 .5 1.5H11a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1h.5Q6 13 6 12H2s-2 0-2-2V4zm1.398-.855a.758.758 0 0 0-.254.302A1.46 1.46 0 0 0 1 4.01V10c0 .325.078.502.145.602.07.105.17.188.302.254a1.464 1.464 0 0 0 .538.143L2.01 11H14c.325 0 .502-.078.602-.145a.758.758 0 0 0 .254-.302 1.464 1.464 0 0 0 .143-.538L15 9.99V4c0-.325-.078-.502-.145-.602a.757.757 0 0 0-.302-.254A1.46 1.46 0 0 0 13.99 3H2c-.325 0-.502.078-.602.145z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [params, setParams] = useSearchParams()
  const raw    = params.get('tab')
  const active = PANELS[raw] ? raw : 'create'
  const setTab = (id) => setParams({ tab: id }, { replace: true })
  const ActivePanel = PANELS[active]

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar active={active} setTab={setTab} onSettings={() => setTab('settings')} />

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
          >
            <ActivePanel />
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="border-t border-gray-100 dark:border-dark-border py-5 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6
                        flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400 font-medium">
            © 2026 Synclipt
          </p>
          <nav className="flex items-center gap-4">
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-300
                           font-medium transition-colors">
                {label}
              </button>
            ))}
            <button onClick={() => setTab('settings')}
              className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-300
                         font-medium transition-colors">
              Settings
            </button>
          </nav>
        </div>
      </footer>
    </div>
  )
}
