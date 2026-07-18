import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { filesApi } from '../../api/files'
import { formatBytes, getFileIcon } from '../../utils/helpers'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, EXPIRY_OPTIONS } from '../../utils/constants'
import toast from 'react-hot-toast'

export default function FileUpload({ clipboardCode, onUploadComplete }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [expiryHours, setExpiryHours] = useState(24)

  const onDrop = useCallback(async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      setUploading(true)
      setProgress(0)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('expiry_hours', expiryHours)
        if (clipboardCode) formData.append('clipboard_code', clipboardCode)

        const res = await filesApi.upload(formData, setProgress)
        toast.success(`${file.name} uploaded!`)
        onUploadComplete?.(res.data)
      } catch (err) {
        toast.error(err.response?.data?.error || `Failed to upload ${file.name}`)
      } finally {
        setUploading(false)
        setProgress(0)
      }
    }
  }, [clipboardCode, expiryHours, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: Object.keys(ALLOWED_FILE_TYPES).reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    onDropRejected: (files) => {
      files.forEach(({ errors }) => {
        toast.error(errors[0]?.message || 'File rejected')
      })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Expiry</label>
        <select
          value={expiryHours}
          onChange={(e) => setExpiryHours(Number(e.target.value))}
          className="input py-1.5 w-36 text-sm"
        >
          {EXPIRY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
          ${isDragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
            : 'border-gray-200 dark:border-dark-border hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-dark-border/30'
          }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          {isDragActive ? (
            <p className="font-semibold text-primary-600 dark:text-primary-400">Drop files here</p>
          ) : (
            <>
              <p className="font-semibold text-gray-700 dark:text-gray-300">
                Drag & drop files here
              </p>
              <p className="text-sm text-gray-400">
                or <span className="text-primary-500 font-medium">click to browse</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Images, PDF, DOCX, ZIP — max 50MB
              </p>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Uploading…</span>
              <span className="text-primary-600 font-bold">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
