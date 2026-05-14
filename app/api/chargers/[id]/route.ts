'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChargerDetail {
  charger: { id: string; nickname: string; created_at: string }
  uptime24h: number
  uptime7d: number
  uptime30d: number
  recentEvents: { status: string; ts: string; connector_id: number }[]
  alerts: { id: number; triggered_at: string; resolved: boolean; resolved_at: string | null }[]
  trend: { day: string; uptime: number | null }[]
  totalEvents: number
}

const statusColors: Record<string, string> = {
  Available: 'bg-green-100 text-green-700',
  Occupied: 'bg-blue-100 text-blue-700',
  Charging: 'bg-blue-100 text-blue-700',
  Faulted: 'bg-red-100 text-red-700',
  Unavailable: 'bg-yellow-100 text-yellow-700',
  Offline: 'bg-gray-100 text-gray-700',
}

export default function ChargerDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<ChargerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/chargers/${id}`)
        const json = await res.json()
        if (json.error) {
          setError(json.error)
        } else {
          setData(json)
        }
      } catch (err) {
        setError('Failed to load charger details')
      }
      setLoading(false)
    }

    fetchDetail()
    const interval = setInterval(fetchDetail, 30000)
    return () => clearInterval(interval)
  }, [id])

  const uptimeColor = (val: number) => {
    if (val >= 95) return 'text-green-600'
    if (val >= 80) return 'text-yellow-500'
    return 'text-red-600'
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <p className="text-gray-500 text-xl">Loading charger details...</p>
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-red-500 text-xl mb-4">❌ {error || 'Charger not found'}</p>
        <a href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg">← Back to Dashboard</a>
      </div>
    </div>
  )

  const activeAlerts = data.alerts.filter(a => !a.resolved).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-1">⚡ ChargerPulse</h1>
            <p className="text-gray-600">EV Charger Uptime Analytics</p>
          </div>
          <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
            ← Dashboard
          </a>
        </div>

        {/* Charger Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-1">
                {data.charger.nickname || id}
              </h2>
              <p className="text-gray-500 font-mono text-sm">{id}</p>
              <p className="text-gray-400 text-xs mt-1">
                Registered: {new Date(data.charger.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              {activeAlerts > 0 ? (
                <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold">
                  🚨 {activeAlerts} Active Alert{activeAlerts > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold">
                  ✅ All Clear
                </span>
              )}
            </div>
          </div>

          {/* OCPP Connection */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">🔌 OCPP Connection URL</p>
            <p className="font-mono text-sm text-indigo-600">
              wss://chargerpulse-1.onrender.com/{id}
            </p>
          </div>
        </div>

        {/* Uptime Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-gray-500 text-sm font-semibold mb-2">24h Uptime</h3>
            <p className={`text-3xl font-bold ${uptimeColor(data.uptime24h)}`}>{data.uptime24h}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-gray-500 text-sm font-semibold mb-2">7d Uptime</h3>
            <p className={`text-3xl font-bold ${uptimeColor(data.uptime7d)}`}>{data.uptime7d}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-gray-500 text-sm font-semibold mb-2">30d Uptime</h3>
            <p className={`text-3xl font-bold ${uptimeColor(data.uptime30d)}`}>{data.uptime30d}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-gray-500 text-sm font-semibold mb-2">Total Events</h3>
            <p className="text-3xl font-bold text-indigo-600">{data.totalEvents}</p>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📈 7-Day Uptime Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, 'Uptime']} />
              <Line
                type="monotone"
                dataKey="uptime"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ fill: '#4f46e5' }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Recent Events */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Recent Events</h2>
            {data.recentEvents.length === 0 ? (
              <p className="text-gray-500">No events recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.recentEvents.map((event, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[event.status] || 'bg-gray-100 text-gray-700'}`}>
                      {event.status}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(event.ts).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alert History */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🚨 Alert History</h2>
            {data.alerts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">✅</p>
                <p className="text-gray-500">No alerts — charger running smoothly!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.alerts.map((alert) => (
                  <div key={alert.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${alert.resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {alert.resolved ? '✅ Resolved' : '🚨 Active'}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(alert.triggered_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}