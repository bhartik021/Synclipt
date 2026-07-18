import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { useTheme } from '../context/ThemeContext'
import { useClipboardQuery, useUpdateClipboard, useDeleteClipboard } from '../hooks/useClipboard'
import { clipboardApi } from '../api/clipboard'
import { useWebSocket } from '../hooks/useWebSocket'
import QRModal from '../components/Clipboard/QRModal'
import PasswordModal from '../components/Clipboard/PasswordModal'
import FileCard from '../components/Files/FileCard'
import FileUpload from '../components/Files/FileUpload'
import { ClipboardSkeleton } from '../components/UI/Skeleton'
import { copyToClipboard, formatExpiry, formatDate, buildClipboardUrl } from '../utils/helpers'
import { getKeyFromHash, decryptContent } from '../utils/encryption'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'

const LANGUAGES = [
  { id: 'text',       label: 'Plain text' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python',     label: 'Python' },
  { id: 'bash',       label: 'Shell' },
  { id: 'json',       label: 'JSON' },
  { id: 'yaml',       label: 'YAML' },
  { id: 'sql',        label: 'SQL' },
  { id: 'html',       label: 'HTML' },
  { id: 'css',        label: 'CSS' },
  { id: 'go',         label: 'Go' },
  { id: 'rust',       label: 'Rust' },
  { id: 'java',       label: 'Java' },
  { id: 'c',          label: 'C' },
  { id: 'cpp',        label: 'C++' },
  { id: 'markdown',   label: 'Markdown' },
]

const LANG_EXT = {
  javascript: 'js', typescript: 'ts', python: 'py', bash: 'sh',
  json: 'json', yaml: 'yml', sql: 'sql', html: 'html',
  css: 'css', go: 'go', rust: 'rs', java: 'java', c: 'c', cpp: 'cpp', markdown: 'md',
}

/* ── Navbar ────────────────────────────────────────────────────────────────── */
function TopBar({ code, deviceCount, onCopyLink }) {
  const navigate = useNavigate()
  const { mode, toggle } = useTheme()
  return (
    <div className="sticky top-0 z-50 bg-white dark:bg-dark-card
                    border-b border-gray-100 dark:border-dark-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[52px] flex items-center gap-3">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white
                     hover:opacity-60 transition-opacity flex-shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
          </svg>
          <span className="hidden sm:inline">Synclipt</span>
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 flex-shrink-0">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
          </svg>
          {deviceCount} viewing
        </div>
        <button onClick={onCopyLink}
          className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold
                     text-gray-400 hover:text-gray-900 dark:hover:text-white
                     px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
            <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/>
          </svg>
          Copy link
        </button>
        <button onClick={toggle} aria-label={`Theme: ${mode}`} title={`Theme: ${mode} — click to cycle`}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400
                     hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
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
  )
}

/* ── Sidebar detail row ────────────────────────────────────────────────────── */
function DetailRow({ label, value, valueClass = '' }) {
  return (
    <div className="flex items-center justify-between py-2.5
                    border-b border-gray-50 dark:border-dark-border/60 last:border-0">
      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{label}</span>
      <span className={`text-xs font-semibold text-gray-700 dark:text-gray-300 ${valueClass}`}>{value}</span>
    </div>
  )
}

/* ── Activity sidebar ──────────────────────────────────────────────────────── */
const EV = {
  'clipboard.updated':      { label: 'Updated',   dot: 'bg-blue-400' },
  'clipboard.deleted':      { label: 'Deleted',   dot: 'bg-red-400' },
  'clipboard.expired':      { label: 'Expired',   dot: 'bg-gray-400' },
  'connection.established': { label: 'Connected', dot: 'bg-green-400' },
}

function ActivitySidebar({ events, wsStatus, clipboard }) {
  const connected = wsStatus === 'connected'
  return (
    <div className="space-y-3">
      {/* Details */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-4">
        <p className="text-[10px] font-black tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-1">Details</p>
        <DetailRow label="Status"  value={clipboard.is_expired ? 'Expired' : 'Active'}
          valueClass={clipboard.is_expired ? 'text-gray-400' : 'text-green-600 dark:text-green-400'} />
        <DetailRow label="Created"  value={formatDate(clipboard.created_at)} />
        <DetailRow label="Expires"  value={formatExpiry(clipboard.expires_at)} />
        <DetailRow label="Views"    value={clipboard.view_count} />
        <DetailRow label="Files"    value={clipboard.files?.length || 0} />
        {clipboard.burn_after_read && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/20
                          rounded-lg px-3 py-2">
            <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-4-2.5-6 .25 1.5-1.25 2-1.25 2C11 4 9 .5 6 0c.357 2 .5 4-2 6-1.25 1-2 2.729-2 4.5C2 14 4.686 16 8 16z"/>
            </svg>
            <span className="text-[11px] font-bold text-red-600 dark:text-red-400">Burn after read</span>
          </div>
        )}
        {clipboard.has_password && (
          <div className="mt-2 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20
                          rounded-lg px-3 py-2">
            <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
            </svg>
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Password protected</span>
          </div>
        )}
      </div>

      {/* Activity */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black tracking-widest uppercase text-gray-400 dark:text-gray-500">Activity</p>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${connected ? 'bg-green-400 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
              {connected ? 'live' : 'offline'}
            </span>
          </div>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-5">
            No activity yet
          </p>
        ) : (
          <div className="space-y-3 max-h-56 overflow-y-auto scrollbar-hide">
            <AnimatePresence initial={false}>
              {events.map((ev, i) => {
                const s = EV[ev.type] || { label: ev.type.split('.')[1] || ev.type, dot: 'bg-gray-400' }
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{s.label}</span>
                      {ev.data?.content && (
                        <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                          {ev.data.content.slice(0, 40)}{ev.data.content.length > 40 ? '…' : ''}
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
    </div>
  )
}

/* ── Main ──────────────────────────────────────────────────────────────────── */
export default function ClipboardDetail() {
  const { code } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isDark } = useTheme()

  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [decryptedContent, setDecryptedContent] = useState(null)
  const [decryptError, setDecryptError] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordVerified, setPasswordVerified] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [deviceCount, setDeviceCount] = useState(1)
  const [language, setLanguage] = useState('text')
  const [viewMode, setViewMode] = useState('raw')

  const { data: clipboard, isLoading, error, refetch } = useClipboardQuery(code)
  const updateClipboard = useUpdateClipboard(code)
  const deleteClipboard = useDeleteClipboard()
  const canDelete = clipboardApi.hasToken(code)

  const editingRef = useRef(editing)
  useEffect(() => { editingRef.current = editing }, [editing])

  const onWsEvent = useCallback((event) => {
    if (event.type === 'clipboard.updated') {
      const incoming = event.data.content
      queryClient.setQueryData(['clipboard', code], (old) =>
        old ? { ...old, content: incoming } : old
      )
      // If not currently editing, keep editContent in sync so Edit pre-fills correctly
      if (!editingRef.current) {
        setEditContent(incoming ?? '')
      }
    } else if (event.type === 'clipboard.deleted' || event.type === 'clipboard.expired') {
      toast.error('Clipboard ' + (event.type === 'clipboard.expired' ? 'expired' : 'deleted'))
      navigate('/')
    } else if (event.type === 'device.count') {
      setDeviceCount(event.data?.count ?? 1)
    }
  }, [code, queryClient, navigate])

  const { status: wsStatus, events, send } = useWebSocket(code, { onEvent: onWsEvent })

  const wsSendTimer = useRef(null)

  // Clear debounce timer on unmount so it can't fire on a dead component
  useEffect(() => () => clearTimeout(wsSendTimer.current), [])

  useEffect(() => {
    if (clipboard?.has_password && !passwordVerified) setShowPassword(true)
  }, [clipboard?.code])

  // Decrypt E2E content if key is present in URL hash
  useEffect(() => {
    if (!clipboard?.is_encrypted || !clipboard?.content) return
    const key = getKeyFromHash()
    if (!key) { setDecryptError(true); return }
    decryptContent(clipboard.content, key).then((plain) => {
      if (plain === null) setDecryptError(true)
      else setDecryptedContent(plain)
    })
  }, [clipboard?.content, clipboard?.is_encrypted])

  const copyLink = () => {
    navigator.clipboard.writeText(buildClipboardUrl(code))
    toast.success('Link copied!')
  }

  const handleShare = async () => {
    const url = buildClipboardUrl(code)
    if (navigator.share) {
      try {
        await navigator.share({ title: `Synclipt — ${code}`, url })
      } catch (e) {
        if (e.name !== 'AbortError') copyLink()
      }
    } else {
      copyLink()
    }
  }

  const handleDownload = () => {
    if (!displayContent) return
    const ext = language !== 'text' ? (LANG_EXT[language] || 'txt') : 'txt'
    const blob = new Blob([displayContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clipboard-${code}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    try {
      await updateClipboard.mutateAsync({ content: editContent })
      setEditing(false)
      toast.success('Saved!')
    } catch {
      // onError in useUpdateClipboard handles the toast
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this clipboard permanently?')) return
    try {
      await deleteClipboard.mutateAsync(code)
      navigate('/')
    } catch {
      // onError in useDeleteClipboard handles the toast
    }
  }

  const filename = language !== 'text'
    ? `clipboard.${LANG_EXT[language] || language}`
    : 'clipboard.txt'

  // If encrypted, show decrypted text once available; fall back to raw (ciphertext) otherwise
  const displayContent = clipboard?.is_encrypted
    ? (decryptedContent ?? (decryptError ? '' : null))
    : clipboard?.content

  /* loading */
  if (isLoading) return (
    <>
      <TopBar code={code} deviceCount={deviceCount} onCopyLink={copyLink} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10"><ClipboardSkeleton /></div>
    </>
  )

  /* error */
  if (error) {
    const s = error.response?.status
    return (
      <>
        <TopBar code={code} deviceCount={deviceCount} onCopyLink={copyLink} />
        <div className="max-w-sm mx-auto px-4 py-24 text-center">
          <p className="text-4xl mb-4">{s === 403 ? '🔒' : s === 410 ? '🔥' : '❌'}</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {s === 403 ? 'Password required' : s === 410 ? 'No longer available' : 'Not found'}
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            {s === 403 ? 'This clipboard is password protected.' : 'This clipboard has expired, been burned, or deleted.'}
          </p>
          {s === 403
            ? <button onClick={() => setShowPassword(true)} className="btn-primary">Enter password</button>
            : <button onClick={() => navigate('/')} className="btn-outline">Go home</button>}
          <PasswordModal isOpen={showPassword} onClose={() => { setShowPassword(false); navigate('/') }}
            code={code} onSuccess={() => { setPasswordVerified(true); refetch() }} />
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar code={code} deviceCount={deviceCount} onCopyLink={copyLink} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Main column ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Code hero */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-mono font-black text-3xl tracking-[0.22em]
                             text-gray-900 dark:text-white leading-none mb-2">
                {code}
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Created {formatDate(clipboard.created_at)}
                <span className="mx-2 text-gray-200 dark:text-gray-700">·</span>
                Expires {formatExpiry(clipboard.expires_at)}
                <span className="mx-2 text-gray-200 dark:text-gray-700">·</span>
                {clipboard.view_count} {clipboard.view_count === 1 ? 'view' : 'views'}
              </p>
            </motion.div>

            {/* Content block */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden
                         bg-white dark:bg-dark-card shadow-sm">

              {/* Block header */}
              <div className="flex items-center justify-between px-4 py-2.5
                              bg-gray-50 dark:bg-dark-border/40
                              border-b border-gray-200 dark:border-dark-border">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex gap-1.5 flex-shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-600" />
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-600" />
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-600" />
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono ml-1 flex-shrink-0">
                    {filename}
                  </span>
                  {/* Language selector */}
                  <select
                    value={language}
                    onChange={(e) => { setLanguage(e.target.value); setViewMode('raw') }}
                    className="text-[11px] font-semibold text-gray-400 dark:text-gray-500
                               bg-gray-100 dark:bg-dark-border/60 rounded-md px-2 py-0.5
                               border-0 focus:outline-none cursor-pointer
                               hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                </div>

                {!editing && displayContent && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {language === 'markdown' && (
                      <button
                        onClick={() => setViewMode(v => v === 'preview' ? 'raw' : 'preview')}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors
                          ${viewMode === 'preview'
                            ? 'bg-gray-200 dark:bg-dark-border text-gray-700 dark:text-gray-200'
                            : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-dark-border'
                          }`}>
                        {viewMode === 'preview' ? 'Raw' : 'Preview'}
                      </button>
                    )}
                    <button onClick={() => { setEditContent(displayContent ?? ''); setEditing(true) }}
                      className="text-xs font-semibold text-gray-400 hover:text-gray-700
                                 dark:hover:text-gray-200 px-2.5 py-1 rounded-md
                                 hover:bg-gray-200 dark:hover:bg-dark-border transition-colors">
                      Edit
                    </button>
                    <button onClick={() => { copyToClipboard(displayContent); toast.success('Copied!') }}
                      className="text-xs font-semibold bg-gray-900 dark:bg-white/10
                                 text-white px-2.5 py-1 rounded-md hover:opacity-75 transition-opacity">
                      Copy
                    </button>
                  </div>
                )}
              </div>

              {/* Block content */}
              {/* E2E encryption status banner */}
              {clipboard.is_encrypted && (
                <div className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b
                  ${decryptError
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-600 dark:text-red-400'
                    : decryptedContent !== null
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 text-green-700 dark:text-green-400'
                      : 'bg-gray-50 dark:bg-dark-border/40 border-gray-100 dark:border-dark-border text-gray-400'
                  }`}>
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                  </svg>
                  {decryptError
                    ? 'Cannot decrypt — key missing or wrong. Share the full URL including #e2e=…'
                    : decryptedContent !== null
                      ? 'Decrypted — AES-GCM 256-bit (key never sent to server)'
                      : 'Encrypted — decrypting…'}
                </div>
              )}
              <AnimatePresence mode="wait">
                {editing ? (
                  <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="p-4 space-y-3">
                    <textarea
                      className="w-full h-52 resize-none bg-transparent border-0 outline-none
                                 font-mono text-sm text-gray-900 dark:text-white
                                 placeholder-gray-300 dark:placeholder-gray-600 leading-relaxed"
                      value={editContent}
                      onChange={(e) => {
                        const val = e.target.value
                        setEditContent(val)
                        clearTimeout(wsSendTimer.current)
                        wsSendTimer.current = setTimeout(() => {
                          send({ type: 'clipboard.update', content: val })
                        }, 400)
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2 border-t border-gray-100 dark:border-dark-border pt-3">
                      <button onClick={handleSave} disabled={updateClipboard.isPending}
                        className="btn-primary text-sm py-1.5 px-4">
                        {updateClipboard.isPending ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditing(false)}
                        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                                   px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : displayContent ? (
                  language === 'markdown' && viewMode === 'preview' ? (
                    <motion.div key="markdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="p-5 overflow-auto max-h-[480px] prose prose-sm dark:prose-invert max-w-none
                                 prose-pre:bg-gray-100 dark:prose-pre:bg-dark-border
                                 prose-code:before:content-none prose-code:after:content-none
                                 prose-code:bg-gray-100 dark:prose-code:bg-dark-border
                                 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
                    </motion.div>
                  ) : language !== 'text' ? (
                    <motion.div key={`highlight-${language}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <SyntaxHighlighter
                        language={language}
                        style={isDark ? vscDarkPlus : prism}
                        customStyle={{
                          margin: 0,
                          padding: '1.25rem',
                          background: 'transparent',
                          fontSize: '0.875rem',
                          lineHeight: '1.625',
                          maxHeight: '480px',
                          overflowY: 'auto',
                        }}
                        wrapLongLines
                      >
                        {displayContent}
                      </SyntaxHighlighter>
                    </motion.div>
                  ) : (
                    <motion.pre key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="p-5 text-sm font-mono text-gray-800 dark:text-gray-200
                                 overflow-auto whitespace-pre-wrap break-words
                                 leading-relaxed min-h-[80px] max-h-[480px]">
                      {displayContent}
                    </motion.pre>
                  )
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-14 gap-3">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      {clipboard.is_encrypted && displayContent === '' ? 'Decryption failed — key not found in URL' : 'No content yet'}
                    </p>
                    {!clipboard.is_encrypted && (
                      <button onClick={() => { setEditContent(''); setEditing(true) }}
                        className="text-sm font-semibold text-[#b8860b] dark:text-[#F5C518]
                                   hover:opacity-70 transition-opacity">
                        + Add content
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Files */}
            {(clipboard.files?.length > 0 || showUpload) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl border border-gray-200 dark:border-dark-border
                           bg-white dark:bg-dark-card overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5
                                bg-gray-50 dark:bg-dark-border/40
                                border-b border-gray-200 dark:border-dark-border">
                  <span className="text-xs font-mono text-gray-400 dark:text-gray-500">files/</span>
                  <button onClick={() => setShowUpload(!showUpload)}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-700
                               dark:hover:text-gray-200 px-2.5 py-1 rounded-md
                               hover:bg-gray-200 dark:hover:bg-dark-border transition-colors">
                    {showUpload ? 'Hide' : '+ Upload'}
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  {clipboard.files?.map((file) => <FileCard key={file.id} file={file} />)}
                  {showUpload && (
                    <div className={clipboard.files?.length > 0 ? 'pt-3 border-t border-gray-100 dark:border-dark-border' : ''}>
                      <FileUpload clipboardCode={code} onUploadComplete={() => { refetch(); setShowUpload(false) }} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Action row */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center gap-2">
              <button onClick={() => setShowQR(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold
                           text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-border
                           px-3.5 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-border
                           transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h3v-6h-6v3z"/>
                </svg>
                QR
              </button>
              <button onClick={handleShare}
                className="inline-flex items-center gap-1.5 text-sm font-semibold
                           text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-border
                           px-3.5 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-border
                           transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
                </svg>
                Share
              </button>
              {displayContent && (
                <button onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold
                             text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-border
                             px-3.5 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-border
                             transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                  </svg>
                  Download
                </button>
              )}
              {!showUpload && (
                <button onClick={() => setShowUpload(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold
                             text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-border
                             px-3.5 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-border
                             transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                  </svg>
                  Upload
                </button>
              )}
              <button onClick={() => navigate(`/clipboard/${code}/analytics`)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold
                           text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-border
                           px-3.5 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-border
                           transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 11H2v3h2v-3zm5-4H7v7h2V7zm5-5v12h-2V2h2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-2zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm-5 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3z"/>
                </svg>
                Analytics
              </button>
              {canDelete && (
                <button onClick={handleDelete}
                  className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold
                             text-red-500 hover:text-red-600 px-3.5 py-2 rounded-xl
                             hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                  </svg>
                  Delete
                </button>
              )}
            </motion.div>
          </div>

          {/* ── Sidebar ── */}
          <div className="w-full lg:w-64 lg:flex-shrink-0">
            <ActivitySidebar events={events} wsStatus={wsStatus} clipboard={clipboard} />
          </div>
        </div>
      </div>

      <QRModal isOpen={showQR} onClose={() => setShowQR(false)} code={code} />
      <PasswordModal
        isOpen={showPassword && !passwordVerified}
        onClose={() => { setShowPassword(false); navigate('/') }}
        code={code}
        onSuccess={() => { setPasswordVerified(true); refetch() }}
      />
    </>
  )
}
