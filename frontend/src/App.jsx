import { Routes, Route } from 'react-router-dom'
import { useTheme } from './context/ThemeContext'
import Home from './pages/Home'
import ClipboardDetail from './pages/ClipboardDetail'
import Analytics from './pages/Analytics'

export default function App() {
  const { isDark } = useTheme()
  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-[#F8F8F6] dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-colors duration-200">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clipboard/:code" element={<ClipboardDetail />} />
          <Route path="/clipboard/:code/analytics" element={<Analytics />} />
        </Routes>
      </div>
    </div>
  )
}
