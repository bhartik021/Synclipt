import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { EXPIRY_OPTIONS, DEFAULT_EXPIRY_KEY, DEFAULT_BURN_KEY, DEFAULT_EXPIRY_VALUE } from '../utils/constants'
import toast from 'react-hot-toast'

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`toggle-track ${value ? 'bg-[#F5C518]' : 'bg-gray-200 dark:bg-dark-border'}`}
    >
      <span className={`toggle-thumb ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function SettingRow({ title, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4
                    border-b border-gray-100 dark:border-dark-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
        {desc && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div className="card p-5">
      <p className="section-label">{label}</p>
      {children}
    </div>
  )
}

export default function Settings() {
  const { mode, setMode } = useTheme()

  const [defaultExpiry, setDefaultExpiry] = useState(
    () => Number(localStorage.getItem(DEFAULT_EXPIRY_KEY)) || DEFAULT_EXPIRY_VALUE
  )
  const [burnAfterRead, setBurnAfterRead] = useState(
    () => localStorage.getItem(DEFAULT_BURN_KEY) === 'true'
  )

  const saveExpiry = (val) => {
    setDefaultExpiry(val)
    localStorage.setItem(DEFAULT_EXPIRY_KEY, String(val))
    toast.success('Default expiry updated')
  }

  const saveBurn = (val) => {
    setBurnAfterRead(val)
    localStorage.setItem(DEFAULT_BURN_KEY, String(val))
    toast.success(val ? 'Burn after read enabled by default' : 'Burn after read disabled')
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize your Synclipt experience.</p>
        </div>

        <div className="space-y-4">

          <Section label="Appearance">
            <SettingRow title="Theme" desc="Choose how Synclipt looks — System follows your OS setting">
              <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
                {[
                  { id: 'light',  label: 'Light' },
                  { id: 'dark',   label: 'Dark' },
                  { id: 'system', label: 'System' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => { setMode(opt.id); toast.success(`Theme set to ${opt.label}`) }}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors
                      ${mode === opt.id
                        ? 'bg-gray-900 dark:bg-[#F5C518] text-white dark:text-gray-900'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </SettingRow>
          </Section>

          <Section label="Clipboard Defaults">
            <SettingRow
              title="Default Expiry"
              desc="Pre-selected expiry time whenever you open the Clipboard tab"
            >
              <select
                value={defaultExpiry}
                onChange={(e) => saveExpiry(Number(e.target.value))}
                className="text-sm font-semibold text-gray-700 dark:text-gray-300
                           bg-gray-100 dark:bg-dark-border border-0 rounded-lg px-3 py-1.5
                           focus:outline-none focus:ring-2 focus:ring-[#F5C518] cursor-pointer"
              >
                {EXPIRY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </SettingRow>

            <SettingRow
              title="Burn After Read"
              desc="New clipboards self-destruct after the first view by default"
            >
              <Toggle value={burnAfterRead} onChange={saveBurn} />
            </SettingRow>
          </Section>

          <Section label="About">
            <SettingRow title="Version" desc="Synclipt production build">
              <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400
                               bg-gray-100 dark:bg-dark-border px-2 py-1 rounded-md">
                v1.0.0
              </span>
            </SettingRow>
          </Section>

        </div>
      </motion.div>
    </div>
  )
}
