import { useState } from 'react'
import Modal from '../UI/Modal'
import { useVerifyPassword } from '../../hooks/useClipboard'
import toast from 'react-hot-toast'

export default function PasswordModal({ isOpen, onClose, code, onSuccess }) {
  const [password, setPassword] = useState('')
  const verify = useVerifyPassword()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) return
    try {
      await verify.mutateAsync({ code, password })
      toast.success('Access granted')
      setPassword('')
      onSuccess?.()
      onClose()
    } catch {}
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Password Required" size="sm">
      <div className="flex flex-col items-center mb-5">
        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          This clipboard is password protected. Enter the password to access it.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          className="input"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          disabled={!password || verify.isPending}
          className="btn-primary w-full"
        >
          {verify.isPending ? 'Verifying…' : 'Unlock'}
        </button>
      </form>
    </Modal>
  )
}
