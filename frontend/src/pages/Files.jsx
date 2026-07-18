import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { filesApi } from '../api/files'
import FileUpload from '../components/Files/FileUpload'
import FileCard from '../components/Files/FileCard'
import toast from 'react-hot-toast'

export default function Files() {
  const [uploadedFiles, setUploadedFiles] = useState([])

  const deleteFile = useMutation({
    mutationFn: (id) => filesApi.delete(id),
    onSuccess: (_, id) => { setUploadedFiles((p) => p.filter((f) => f.id !== id)); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>

        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">File Sharing</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            Upload files and share temporary download links. Images, PDF, DOCX, ZIP.
          </p>
        </div>

        <div className="card p-5 mb-5">
          <FileUpload onUploadComplete={(f) => setUploadedFiles((p) => [f, ...p])} />
        </div>

        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Uploaded <span className="text-[#b8860b] dark:text-[#F5C518]">{uploadedFiles.length}</span>
                </p>
              </div>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <motion.div key={file.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <FileCard file={file} onDelete={(id) => deleteFile.mutate(id)} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {uploadedFiles.length === 0 && (
          <div className="text-center py-10 text-gray-300 dark:text-gray-600">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            <p className="text-sm font-medium">Uploaded files will appear here</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
