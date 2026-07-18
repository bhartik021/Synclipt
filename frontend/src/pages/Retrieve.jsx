import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useClipboardQuery } from '../hooks/useClipboard'
import { ClipboardSkeleton } from '../components/UI/Skeleton'
import { copyToClipboard, formatExpiry, formatDate } from '../utils/helpers'
import { clipboardApi } from '../api/clipboard'
import toast from 'react-hot-toast'

const CODE_LEN = 6

export default function Retrieve() {
  const navigate = useNavigate()
  const [chars, setChars] = useState(Array(CODE_LEN).fill(''))
  const [submittedCode, setSubmittedCode] = useState('')
  const refs = useRef(Array.from({ length: CODE_LEN }, () => null))

  const code = chars.join('')
  const { data: clipboard, isLoading, error } = useClipboardQuery(submittedCode)

  const focusBox = (i) => refs.current[i]?.focus()

  const handleChange = (i, val) => {
    // handle paste
    if (val.length > 1) {
      const pasted = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN)
      const next = [...chars]
      for (let j = 0; j < pasted.length; j++) next[j] = pasted[j]
      setChars(next)
      focusBox(Math.min(pasted.length, CODE_LEN - 1))
      return
    }
    const char = val.toUpperCase().replace(/[^A-Z0-9]/g, '')
    const next = [...chars]
    next[i] = char
    setChars(next)
    if (char && i < CODE_LEN - 1) focusBox(i + 1)
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (chars[i]) {
        const next = [...chars]; next[i] = ''; setChars(next)
      } else if (i > 0) {
        const next = [...chars]; next[i - 1] = ''; setChars(next)
        focusBox(i - 1)
      }
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focusBox(i - 1)
    } else if (e.key === 'ArrowRight' && i < CODE_LEN - 1) {
      focusBox(i + 1)
    } else if (e.key === 'Enter' && code.length === CODE_LEN) {
      submit()
    }
  }

  const submit = () => {
    if (code.length !== CODE_LEN) return
    setSubmittedCode(code)
  }

  const reset = () => {
    setChars(Array(CODE_LEN).fill(''))
    setSubmittedCode('')
    focusBox(0)
  }

  // auto-submit when all 6 filled
  useEffect(() => {
    if (code.length === CODE_LEN && !submittedCode) submit()
  }, [code])

  const status = error?.response?.status

  // Full-text search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await clipboardApi.search(searchQuery.trim())
      setSearchResults(res.data.results)
    } catch {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const [retrieveTab, setRetrieveTab] = useState('code')

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>

        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Retrieve
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            Enter a code or search public clipboards.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-border/60 rounded-xl mb-5">
          {[
            { id: 'code', label: 'By Code' },
            { id: 'search', label: 'Search' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setRetrieveTab(t.id)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150
                ${retrieveTab === t.id
                  ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
        {retrieveTab === 'code' && (
        <motion.div key="code" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}>

        {/* OTP box input */}
        <div className="card p-6">
          <p className="text-xs font-black tracking-[0.15em] uppercase text-[#b8860b] dark:text-[#F5C518]/70 mb-4">
            Clipboard Code
          </p>

          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
            {Array.from({ length: CODE_LEN }, (_, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                type="text"
                inputMode="text"
                maxLength={CODE_LEN}
                value={chars[i]}
                className={`otp-box${chars[i] ? ' filled' : ''}`}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                autoFocus={i === 0}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={code.length !== CODE_LEN || isLoading}
              className="btn-primary flex-1 py-3"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Searching…
                </>
              ) : 'Retrieve →'}
            </button>
            {(submittedCode || code) && (
              <button onClick={reset} className="btn-outline px-4 py-3">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && submittedCode && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 card p-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center
                              bg-gray-100 dark:bg-dark-border text-2xl">
                {status === 404 ? '🔍' : status === 410 ? '🔥' : status === 403 ? '🔒' : '❌'}
              </div>
              <p className="font-bold text-gray-900 dark:text-white mb-1">
                {status === 404 ? 'Not Found'
                  : status === 410 ? 'Expired or Burned'
                  : status === 403 ? 'Password Protected'
                  : 'Something went wrong'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {error.response?.data?.error || 'Could not retrieve clipboard'}
              </p>
              {status === 403 && (
                <button onClick={() => navigate(`/clipboard/${submittedCode}`)} className="btn-primary mt-4 text-sm">
                  Enter Password →
                </button>
              )}
              <button onClick={reset} className="block mx-auto mt-3 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                Try another code
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        <AnimatePresence>
          {isLoading && submittedCode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4">
              <ClipboardSkeleton />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {clipboard && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 space-y-3"
            >
              <div className="card-active p-5">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="code-badge">{clipboard.code}</span>
                    {clipboard.burn_after_read && <span className="tag-burned">BURN</span>}
                    {clipboard.has_password && <span className="tag-protected">PROTECTED</span>}
                  </div>
                  <span className="text-xs text-gray-400 tabular-nums">{formatExpiry(clipboard.expires_at)}</span>
                </div>

                {clipboard.content ? (
                  <pre className="bg-gray-50 dark:bg-dark-border rounded-xl p-4 text-sm font-mono
                                  text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words
                                  max-h-48 overflow-auto mb-4">
                    {clipboard.content}
                  </pre>
                ) : (
                  <p className="text-sm text-gray-400 italic mb-4">No text content</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <span>Created {formatDate(clipboard.created_at)}</span>
                  <span>{clipboard.view_count} view{clipboard.view_count !== 1 ? 's' : ''}</span>
                </div>

                <div className="flex gap-2">
                  {clipboard.content && (
                    <button
                      onClick={async () => { await copyToClipboard(clipboard.content); toast.success('Copied!') }}
                      className="btn-outline text-sm py-2 flex-1"
                    >
                      Copy
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/clipboard/${submittedCode}`)}
                    className="btn-primary text-sm py-2 flex-1"
                  >
                    Open Full View →
                  </button>
                </div>
              </div>

              {clipboard.files?.length > 0 && (
                <div className="card p-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {clipboard.files.length} file{clipboard.files.length !== 1 ? 's' : ''} attached
                  </p>
                  <button
                    onClick={() => navigate(`/clipboard/${submittedCode}`)}
                    className="text-sm font-semibold text-[#b8860b] dark:text-[#F5C518] hover:opacity-70 transition-opacity"
                  >
                    View →
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
        )}

        {retrieveTab === 'search' && (
        <motion.div key="search" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}>

        {/* Full-text search */}
        <div className="card p-5">
          <p className="text-xs font-black tracking-[0.15em] uppercase text-[#b8860b] dark:text-[#F5C518]/70 mb-4">
            Search Public Clipboards
          </p>

          <form onSubmit={handleSearch} className="flex gap-2">
            {/* Input with embedded search icon */}
            <div className="flex-1 flex items-center gap-2
                            bg-gray-50 dark:bg-dark-border/50 rounded-xl px-3 py-2.5
                            border border-gray-200 dark:border-dark-border
                            focus-within:border-[#F5C518] focus-within:ring-2 focus-within:ring-[#F5C518]/20
                            transition-all">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
              </svg>
              <input
                type="search"
                className="flex-1 bg-transparent border-0 outline-none text-sm
                           text-gray-900 dark:text-white
                           placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Search by content or code…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="btn-primary px-4 text-sm"
            >
              {searching ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                </svg>
              )}
            </button>
          </form>

          {/* Results */}
          <AnimatePresence>
            {searchResults !== null && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-4 border-t border-gray-100 dark:border-dark-border pt-4"
              >
                {searchResults.length === 0 ? (
                  <div className="flex flex-col items-center py-8 gap-2">
                    <svg className="w-8 h-8 text-gray-200 dark:text-gray-700" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                    </svg>
                    <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">No results for "{searchQuery}"</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600">Only discoverable clipboards appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-3">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    </p>
                    {searchResults.map((r) => {
                      const matchedByCode = r.code.includes(searchQuery.toUpperCase()) &&
                        !r.content?.toLowerCase().includes(searchQuery.toLowerCase())
                      return (
                        <button
                          key={r.code}
                          onClick={() => navigate(`/clipboard/${r.code}`)}
                          className="w-full text-left rounded-xl border border-gray-100 dark:border-dark-border
                                     bg-gray-50 dark:bg-dark-border/30 px-4 py-3
                                     hover:border-[#F5C518]/50 hover:bg-[#FFFBEB]/60 dark:hover:bg-[#F5C518]/5
                                     transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="code-badge">{r.code}</span>
                              {r.is_encrypted && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">E2E</span>
                              )}
                              {matchedByCode && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">code match</span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400 tabular-nums">{formatExpiry(r.expires_at)}</span>
                          </div>
                          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate leading-relaxed
                                        group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                            {r.is_encrypted ? '🔒 Encrypted content' : (r.content || 'No text content')}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        </motion.div>
        )}
        </AnimatePresence>

      </motion.div>
    </div>
  )
}
