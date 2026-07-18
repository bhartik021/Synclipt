import { useTheme } from '../../context/ThemeContext'

export default function Navbar() {
  const { isDark, toggle } = useTheme()

  return (
    <header className="bg-[#F5C518] h-14 flex items-center px-4 sm:px-6 shadow-[0_1px_0_rgba(0,0,0,0.08)]">
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#F5C518]" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 1.5A1.5 1.5 0 0 1 7 0h2a1.5 1.5 0 0 1 1.5 1.5H12A1.5 1.5 0 0 1 13.5 3v11A1.5 1.5 0 0 1 12 15.5H4A1.5 1.5 0 0 1 2.5 14V3A1.5 1.5 0 0 1 4 1.5h1.5ZM7 1a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1H7Z"/>
            </svg>
          </div>
          <div>
            <p className="font-black text-base text-gray-900 leading-none tracking-tight">Synclipt</p>
            <p className="text-[10px] font-semibold text-gray-700/70 leading-none mt-0.5 hidden sm:block">
              Real-time clipboard sharing
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-900 text-white
                          text-[10px] font-black tracking-wide
                          px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <span className="hidden sm:inline">LIVE CONNECTED</span>
            <span className="sm:hidden">LIVE</span>
          </div>

          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-xl bg-gray-900/10 hover:bg-gray-900/20
                       flex items-center justify-center text-gray-900
                       transition-colors duration-150"
          >
            {isDark ? (
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h1a.5.5 0 0 1 .5.5zM2 8a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h1A.5.5 0 0 1 2 8zm10.485-3.657a.5.5 0 0 1 0 .707l-.708.707a.5.5 0 0 1-.707-.707l.707-.707a.5.5 0 0 1 .708 0zm-9.193 9.193a.5.5 0 0 1 0 .707l-.707.707a.5.5 0 0 1-.707-.707l.707-.707a.5.5 0 0 1 .707 0zm9.193 0a.5.5 0 0 1-.708 0l-.707-.707a.5.5 0 0 1 .707-.707l.708.707a.5.5 0 0 1 0 .707zM3.293 3.636a.5.5 0 0 1 .707 0l.707.707a.5.5 0 0 1-.707.707l-.707-.707a.5.5 0 0 1 0-.707z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
