import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

function StatCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-5">
      <p className="text-[10px] font-black tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">{value}</p>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="font-black text-gray-900 dark:text-white">{payload[0].value} views</p>
    </div>
  )
}

export default function Analytics() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/clipboard/${code}/analytics/`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.status === 404 ? 'Clipboard not found' : 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [code])

  const peak = data?.daily?.length
    ? Math.max(...data.daily.map((d) => d.views))
    : 0

  return (
    <div className="min-h-screen bg-[#F8F8F6] dark:bg-dark-bg">
      {/* Nav */}
      <div className="sticky top-0 z-50 bg-white dark:bg-dark-card border-b border-gray-100 dark:border-dark-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-[52px] flex items-center gap-3">
          <button onClick={() => navigate(`/clipboard/${code}`)}
            className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white hover:opacity-60 transition-opacity">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
            </svg>
            <span className="font-mono tracking-wider">{code}</span>
          </button>
          <span className="text-gray-200 dark:text-gray-700">·</span>
          <span className="text-sm font-semibold text-gray-400">Analytics</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <svg className="w-6 h-6 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {error && (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">📊</p>
            <p className="text-gray-500 dark:text-gray-400">{error}</p>
          </div>
        )}

        {data && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard label="Total views" value={data.total_views.toLocaleString()} />
              <StatCard label="Days tracked" value={data.daily.length} />
              <StatCard label="Peak day" value={peak.toLocaleString()} />
            </div>

            {/* Chart */}
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-5">
              <p className="text-[10px] font-black tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-4">
                Daily Views
              </p>
              {data.daily.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">No view data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.daily} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F5C518" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#F5C518" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2a2a' : '#f0f0f0'} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: isDark ? '#6b7280' : '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(d) => {
                        const dt = new Date(d)
                        return `${dt.getMonth() + 1}/${dt.getDate()}`
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: isDark ? '#6b7280' : '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDark ? '#374151' : '#e5e7eb', strokeWidth: 1 }} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#F5C518"
                      strokeWidth={2}
                      fill="url(#viewGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#F5C518', stroke: 'white', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
