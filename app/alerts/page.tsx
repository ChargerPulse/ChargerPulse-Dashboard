'use client'

import { useState, useEffect } from 'react'

interface Alert {
  id: number
  cp_id: string
  nickname: string
  triggered_at: string
  resolved: boolean
  resolved_at: string | null
  cleared_at: string | null
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts')
        const data = await res.json()
        setAlerts(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch alerts:', err)
      }
      setLoading(false)
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const filtered = alerts.filter(alert => {
    if (filter === 'active') return !alert.resolved
    if (filter === 'resolved') return alert.resolved
    return true
  })

  const activeCount = alerts.filter(a => !a.resolved).length

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  const getDuration = (start: string, end: string | null) => {
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : new Date()
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `${diffMins}m`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">⚡ ChargerPulse</h1>
            <p className="text-gray-600">EV Charger Uptime Analytics</p>
          </div>
          <div className="flex gap-3">
            <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
              ← Dashboard
            </a>
            <a href="/pricing" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg">
              Upgrade
            </a>
          </div>
        </div>

        {/* Alert Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-gray-500 text-sm font-semibold mb-2">Total Alerts</h2>
            <p className="text-3xl font-bold text-gray-800">{alerts.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-gray-500 text-sm font-semibold mb-2">Active Alerts</h2>
            <p className={`text-3xl font-bold ${activeCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {activeCount}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-gray-500 text-sm font-semibold mb-2">Resolved Alerts</h2>
            <p className="text-3xl font-bold text-green-600">
              {alerts.filter(a => a.resolved).length}
            </p>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">🚨 Alert History</h2>
            <div className="flex gap-2">
              {(['all', 'active', 'resolved'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading alerts...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">✅</p>
              <p className="text-gray-500 text-lg">No alerts found</p>
              <p className="text-gray-400 text-sm mt-2">All chargers are running smoothly</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 font-semibold text-gray-700">Charger</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Triggered At</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Resolved At</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((alert) => (
                    <tr key={alert.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-mono text-gray-800 text-sm">{alert.cp_id}</div>
                        <div className="text-gray-500 text-xs">{alert.nickname}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          alert.resolved
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {alert.resolved ? '✅ Resolved' : '🚨 Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {formatDate(alert.triggered_at)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {alert.resolved_at ? formatDate(alert.resolved_at) : '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {getDuration(alert.triggered_at, alert.resolved_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}