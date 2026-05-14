'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ChargerData {
  id: string
  nickname: string
  uptime24h: number
  uptime7d: number
  uptime30d: number
  lastUpdate: string
}

export default function Dashboard() {
  const [chargers, setChargers] = useState<ChargerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchChargers = async () => {
      try {
        const res = await fetch('/api/chargers')
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setChargers(data)
          setError(null)
        } else {
          setError('No chargers found — API returned: ' + JSON.stringify(data))
        }
      } catch (err) {
        setError('Fetch failed: ' + String(err))
      }
      setLoading(false)
    }

    fetchChargers()
    const interval = setInterval(fetchChargers, 30000)
    return () => clearInterval(interval)
  }, [])

  const avg = (key: keyof ChargerData) =>
    chargers.length > 0
      ? (chargers.reduce((a, c) => a + (c[key] as number), 0) / chargers.length).toFixed(1)
      : '0'

  const chartData = [
    { name: '24h', value: parseFloat(avg('uptime24h')) },
    { name: '7d', value: parseFloat(avg('uptime7d')) },
    { name: '30d', value: parseFloat(avg('uptime30d')) },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">

        <div className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">⚡ ChargerPulse</h1>
            <p className="text-gray-600">EV Charger Uptime Analytics</p>
          </div>
          <div className="flex gap-3">
            <a href="/register" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">
              ➕ Add Charger
            </a>
            <a href="/alerts" className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg">
              🚨 Alerts
            </a>
            <a href="/pricing" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
              Upgrade
            </a>
          </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Debug info:</strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-gray-500 text-sm font-semibold mb-2">24h Uptime</h2>
            <p className="text-3xl font-bold text-green-600">{avg('uptime24h')}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-gray-500 text-sm font-semibold mb-2">7d Uptime</h2>
            <p className="text-3xl font-bold text-blue-600">{avg('uptime7d')}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-gray-500 text-sm font-semibold mb-2">30d Uptime</h2>
            <p className="text-3xl font-bold text-indigo-600">{avg('uptime30d')}%</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Connected Chargers</h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : chargers.length === 0 ? (
            <p className="text-gray-500">No chargers connected yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 font-semibold text-gray-700">Charger ID</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">24h Uptime</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">7d Uptime</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">30d Uptime</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  {chargers.map((charger) => (
                    <tr key={charger.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800 font-mono">{charger.id}</td>
                      <td className="py-3 px-4 text-gray-600">{charger.nickname}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${charger.uptime24h > 95 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {charger.uptime24h}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${charger.uptime7d > 95 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {charger.uptime7d}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${charger.uptime30d > 95 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {charger.uptime30d}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">{charger.lastUpdate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Average Uptime Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} name="Uptime %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}