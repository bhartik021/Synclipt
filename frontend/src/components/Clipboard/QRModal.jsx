import { QRCodeSVG } from 'qrcode.react'
import Modal from '../UI/Modal'
import { copyToClipboard, buildClipboardUrl } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function QRModal({ isOpen, onClose, code }) {
  const url = buildClipboardUrl(code)

  const handleCopyUrl = async () => {
    await copyToClipboard(url)
    toast.success('URL copied!')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Synclipt — ${code}`, url })
      } catch {}
    } else {
      handleCopyUrl()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share QR Code" size="sm">
      <div className="flex flex-col items-center gap-5">
        <div className="p-4 bg-white rounded-2xl shadow-inner border border-gray-100">
          <QRCodeSVG
            value={url}
            size={200}
            level="H"
            fgColor="#1A1A1A"
            bgColor="#FFFFFF"
            includeMargin={false}
          />
        </div>

        <div className="text-center">
          <div className="code-badge text-base mb-1">{code}</div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Scan to open clipboard</p>
        </div>

        <div className="w-full space-y-2">
          <button onClick={handleShare} className="btn-primary w-full flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share
          </button>
          <button onClick={handleCopyUrl} className="btn-outline w-full flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy URL
          </button>
        </div>
      </div>
    </Modal>
  )
}
