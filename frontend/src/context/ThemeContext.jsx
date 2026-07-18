import { createContext, useContext, useState, useEffect } from 'react'
import { THEME_KEY } from '../utils/constants'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
  })

  const [systemIsDark, setSystemIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setSystemIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const isDark = mode === 'dark' || (mode === 'system' && systemIsDark)

  useEffect(() => {
    localStorage.setItem(THEME_KEY, mode)
    document.documentElement.classList.toggle('dark', isDark)
  }, [mode, isDark])

  const toggle = () => setMode((m) => m === 'light' ? 'dark' : m === 'dark' ? 'system' : 'light')

  return (
    <ThemeContext.Provider value={{ isDark, mode, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
