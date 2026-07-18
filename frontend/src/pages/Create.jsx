import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCreateClipboard } from '../hooks/useClipboard'
import FileUpload from '../components/Files/FileUpload'
import { EXPIRY_OPTIONS, DEFAULT_EXPIRY_KEY, DEFAULT_BURN_KEY, DEFAULT_EXPIRY_VALUE } from '../utils/constants'
import { generateKey, encryptContent, buildEncryptedUrl } from '../utils/encryption'
import toast from 'react-hot-toast'

function Toggle({ value, onChange, colorOn = 'bg-[#F5C518]' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`toggle-track ${value ? colorOn : 'bg-gray-200 dark:bg-dark-border'}`}
    >
      <span className={`toggle-thumb ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

export default function Create() {
  const navigate = useNavigate()
  const createClipboard = useCreateClipboard()

  const [content, setContent] = useState('')
  const [expiryHours, setExpiryHours] = useState(
    () => Number(localStorage.getItem(DEFAULT_EXPIRY_KEY)) || DEFAULT_EXPIRY_VALUE
  )
  const [burnAfterRead, setBurnAfterRead] = useState(
    () => localStorage.getItem(DEFAULT_BURN_KEY) === 'true'
  )
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('')
  const [useEncrypt, setUseEncrypt] = useState(false)
  const [isSearchable, setIsSearchable] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [mode, setMode] = useState('text')

  const handleCreate = async () => {
    if (mode === 'text' && !content.trim()) { toast.error('Please enter some content'); return }
    try {
      let finalContent = mode === 'text' ? content : ''
      let encKey = null
      if (useEncrypt && finalContent) {
        encKey = await generateKey()
        finalContent = await encryptContent(finalContent, encKey)
      }
      const payload = {
        content: finalContent,
        expiry_hours: expiryHours,
        burn_after_read: burnAfterRead,
        is_encrypted: useEncrypt && !!encKey,
        is_searchable: isSearchable && !useEncrypt,
      }
      if (usePassword && password) payload.raw_password = password
      const clipboard = await createClipboard.mutateAsync(payload)
      toast.success(`Clipboard #${clipboard.code} created`)
      if (encKey) {
        navigate(`/clipboard/${clipboard.code}`, { replace: false })
        // Replace current history entry with the hash-bearing URL so the key is in the address bar
        window.location.replace(buildEncryptedUrl(clipboard.code, encKey))
      } else {
        navigate(`/clipboard/${clipboard.code}`)
      }
    } catch {}
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Clipboard
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            Paste text or drop a file — share instantly with a 6-char code.
          </p>
        </div>

        {/* Main card */}
        <div className="card overflow-hidden">

          {/* Mode tabs */}
          <div className="flex border-b border-gray-100 dark:border-dark-border">
            {[
              {
                id: 'text', label: 'Text',
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M0 .5A.5.5 0 0 1 .5 0h4a.5.5 0 0 1 0 1h-4A.5.5 0 0 1 0 .5Zm0 2A.5.5 0 0 1 .5 2h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 0 2.5Zm0 2A.5.5 0 0 1 .5 4h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 0 4.5Zm0 2A.5.5 0 0 1 .5 6h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 0 6.5Zm0 2A.5.5 0 0 1 .5 8h5a.5.5 0 0 1 0 1h-5A.5.5 0 0 1 0 8.5ZM14 1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6ZM8 2v10h6V2H8Z"/>
                  </svg>
                ),
              },
              {
                id: 'file', label: 'File',
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                  </svg>
                ),
              },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold
                            transition-colors duration-150 border-b-2
                            ${mode === m.id
                              ? 'border-[#F5C518] text-gray-900 dark:text-white bg-[#FFFBEB]/50 dark:bg-[#F5C518]/5'
                              : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
              >
                <span className={mode === m.id ? 'text-[#b8860b] dark:text-[#F5C518]' : 'text-gray-400 dark:text-gray-500'}>
                  {m.icon}
                </span>
                {m.label}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              {mode === 'text' ? (
                <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <textarea
                    className="w-full min-h-[200px] resize-y bg-transparent border-0 outline-none
                               text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600
                               font-mono text-sm leading-relaxed"
                    placeholder="Paste or type your content here…"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    autoFocus
                  />
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-dark-border mt-2">
                    <span className="text-xs text-gray-400 tabular-nums">
                      {content.length.toLocaleString()} chars
                      {content.trim() && (
                        <>
                          <span className="mx-1.5 opacity-40">·</span>
                          {content.trim().split(/\s+/).length.toLocaleString()} words
                          <span className="mx-1.5 opacity-40">·</span>
                          {content.split('\n').length} lines
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.readText().then(setContent).catch(() => toast.error('Clipboard access denied'))}
                      className="text-xs font-semibold text-[#b8860b] dark:text-[#F5C518] hover:opacity-70 transition-opacity"
                    >
                      ⌘ Paste from clipboard
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <FileUpload onUploadComplete={(f) => toast.success(`${f.original_name} uploaded!`)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Options toolbar */}
          <div className="bg-gray-50 dark:bg-dark-border/40 border-t border-gray-100 dark:border-dark-border px-5 py-3.5">
            {/* ── Row 1: expiry + create ── */}
            <div className="flex items-center justify-between gap-3">
              {/* Expiry */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide whitespace-nowrap">Expiry</span>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(Number(e.target.value))}
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 bg-transparent border-0
                             focus:outline-none cursor-pointer appearance-none pr-4"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239CA3AF' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center' }}
                >
                  {EXPIRY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <button
                onClick={handleCreate}
                disabled={createClipboard.isPending}
                className="btn-primary py-2 px-5 text-sm whitespace-nowrap"
              >
                {createClipboard.isPending ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Creating…
                  </>
                ) : 'Create →'}
              </button>
            </div>

            {/* ── Row 2: toggles ── */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
              {/* Burn toggle */}
              <label className="flex items-center gap-2 cursor-pointer group">
                <Toggle value={burnAfterRead} onChange={setBurnAfterRead} colorOn="bg-red-500" />
                <span className={`text-xs font-semibold whitespace-nowrap transition-colors ${burnAfterRead ? 'text-red-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                  Burn after read
                </span>
              </label>

              {/* Password toggle */}
              <label className="flex items-center gap-2 cursor-pointer group">
                <Toggle value={usePassword} onChange={setUsePassword} />
                <span className={`text-xs font-semibold whitespace-nowrap transition-colors ${usePassword ? 'text-[#b8860b] dark:text-[#F5C518]' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                  Password
                </span>
              </label>

              {/* Advanced button — pushed right */}
              <div className="ml-auto flex items-center gap-1.5">
                {useEncrypt && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 whitespace-nowrap">
                    E2E
                  </span>
                )}
                {isSearchable && !useEncrypt && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 whitespace-nowrap">
                    Public
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap
                    ${showAdvanced
                      ? 'bg-gray-200 dark:bg-dark-border text-gray-700 dark:text-gray-200'
                      : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-border hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                  <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
                  </svg>
                  Advanced
                  <svg className={`w-2.5 h-2.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} viewBox="0 0 10 6" fill="none">
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Advanced row (collapsible) ── */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-5 pt-3 border-t border-gray-100 dark:border-dark-border">
                    {/* E2E Encryption */}
                    <label className="flex items-center gap-2 cursor-pointer group" title="AES-GCM 256-bit — key never leaves your browser">
                      <Toggle value={useEncrypt} onChange={(v) => { setUseEncrypt(v); if (v) setIsSearchable(false) }} colorOn="bg-green-500" />
                      <div>
                        <span className={`text-xs font-semibold block transition-colors ${useEncrypt ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          E2E Encrypt
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">AES-GCM 256-bit, key in URL</span>
                      </div>
                    </label>

                    <div className="w-px h-8 bg-gray-200 dark:bg-dark-border" />

                    {/* Discoverable */}
                    <label className="flex items-center gap-2 cursor-pointer group" title="Allow content to appear in public search results">
                      <Toggle value={isSearchable && !useEncrypt} onChange={(v) => { setIsSearchable(v); if (v) setUseEncrypt(false) }} colorOn="bg-blue-500" />
                      <div>
                        <span className={`text-xs font-semibold block transition-colors ${isSearchable && !useEncrypt ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          Discoverable
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">Show in public search</span>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password input (expands) */}
            <AnimatePresence>
              {usePassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <input
                    type="password"
                    className="input text-sm py-2.5"
                    placeholder="Set a password to protect this clipboard…"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          Content is stored securely and auto-deleted after expiry.
        </p>
      </motion.div>
    </div>
  )
}
