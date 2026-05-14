'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChargerDetail {
  charger: {
    id: string
    nickname: string
    location: string
    created_at: string
  }
  uptime24h: number
  uptime7d: number
  uptime30d: number
  recentEvents: Array<{
    id: number
    status: string
    ts: string
    connector_id: number
  }>
  alerts: Array<{
    id: number
    triggered_at: string
    resolved_at: string | null
    resolved: boolean
  }>
}

export default function ChargerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [data, setData] = useState<ChargerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [chargerId, setChargerId] = useState('')

  useEffect(() => {
    params.then(({ id }) => {
      setChargerId(id)
      fetch(`/api/chargers/${id}`)
        .then(res => res.json())
        .then(d => {
          setData(d)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    })
  }, [params])

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-700'
      case 'Occupied':
      case 'Charging': return 'bg-blue-100 text-blue-700'
      case 'Faulted': return 'bg-red-100 text-red-700'
      case 'Unavailable': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available': return '✅'
      case 'Occupied':
      case 'Charging': return '⚡'
      case 'Faulted': return '🚨'
      case 'Unavailable': return '⚠️'
      default: return '💤'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <p className="text-gray-500 text-xl">Loading charger data...</p>
      </div>
    )
  }

  if (!data || !data.charger) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-xl mb-4">Charger not found</p>
          <a href="/" className="text-blue-600 underline">Back to Dashboard</a>
        </div>
      </div>
    )
  }

  const chartData = [
    { period: '24h', uptime: data.uptime24h },
    { period: '7d', uptime: data.uptime7d },
    { period: '30d', uptime: data.uptime30d },
  ]

  const activeAlert = data.alerts.find(a => !a.resolved)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-1">
              ⚡ {data.charger.nickname}
            </h1>
            <p className="text-gray-500 font-mono">{data.charger.id}</p>
          </div>
          <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
            ← Dashboard
          </a>
        </div>

        {/* Active alert banner */}
        {activeAlert && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6 flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <strong>This charger is currently DOWN!</strong>
              <p className="text-sm">Alert triggered at {new Date(activeAlert.triggered_at).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-gray-500 text-sm font-semibold mb-1">Location</p>
            <p className="text-gray-800 font-semibold">{data.charger.location || 'Not set'}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-gray-500 text-sm font-semibold mb-1">24h Uptime</p>
            <p className={`text-2xl font-bold ${data.uptime24h >= 95 ? 'text-green-600' : 'text-yellow-600'}`}>
              {data.uptime24h}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-gray-500 text-sm font-semibold mb-1">7d Uptime</p>
            <p className={`text-2xl font-bold ${data.uptime7d >= 95 ? 'text-green-600' : 'text-yellow-600'}`}>
              {data.uptime7d}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-gray-500 text-sm font-semibold mb-1">30d Uptime</p>
            <p className={`text-2xl font-bold ${data.uptime30d >= 95 ? 'text-green-600' : 'text-yellow-600'}`}>
              {data.uptime30d}%
            </p>
          </div>
        </div>

        {/* Uptime chart */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Uptime by Period</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(val) => `${val}%`} />
              <Bar dataKey="uptime" fill="#2563eb" radius={[4, 4, 0, 0]} name="Uptime %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Recent Events */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Recent Events</h2>
            {data.recentEvents.length === 0 ? (
              <p className="text-gray-500">No events yet.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.recentEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyle(event.status)}`}>
                        {getStatusIcon(event.status)} {event.status}
                      </span>
                      <p className="text-gray-400 text-xs mt-1">Connector #{event.connector_id}</p>
                    </div>
                    <p className="text-gray-500 text-xs">{new Date(event.ts).toLocaleString()}</p>
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
                <p className="text-green-600 font-semibold">✅ No alerts ever!</p>
                <p className="text-gray-500 text-sm mt-1">This charger has been reliable.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.alerts.map(alert => (
                  <div key={alert.id} className="py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${alert.resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {alert.resolved ? '✅ Resolved' : '🚨 Active'}
                      </span>
                      <p className="text-gray-500 text-xs">
                        {new Date(alert.triggered_at).toLocaleString()}
                      </p>
                    </div>
                    {alert.resolved_at && (
                      <p className="text-gray-400 text-xs mt-1">
                        Resolved: {new Date(alert.resolved_at).toLocaleString()}
                      </p>
                    )}
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