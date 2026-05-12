'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ChargerData {
  id: string
  uptime24h: number
  uptime7d: number
  uptime30d: number
  lastUpdate: string
}

export default function Dashboard() {
  const [chargers, setChargers] = useState<ChargerData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // For now, mock data (we'll connect to Supabase later)
    const mockData: ChargerData[] = [
      {
        id: 'TestCharger123',
        uptime24h: 95.5,
        uptime7d: 92.3,
        uptime30d: 89.8,
        lastUpdate: new Date().toLocaleTimeString()
      },
      {
        id: 'Charger456',
        uptime24h: 87.2,
        uptime7d: 85.1,
        uptime30d: 82.5,
        lastUpdate: new Date().toLocaleTimeString()
      },
      {
        id: 'Charger789',
        uptime24h: 98.0,
        uptime7d: 96.5,
        uptime30d: 94.2,
        lastUpdate: new Date().toLocaleTimeString()
      }
    ]

    setChargers(mockData)
    setLoading(false)
  }, [])

  const chartData = [
    { name: '24h', value: chargers.length > 0 ? (chargers.reduce((a, c) => a + c.uptime24h, 0) / chargers.length).toFixed(1) : 0 },
    { name: '7d', value: chargers.length > 0 ? (chargers.reduce((a, c) => a + c.uptime7d, 0) / chargers.length).toFixed(1) : 0 },
    { name: '30d', value: chargers.length > 0 ? (chargers.reduce((a, c) => a + c.uptime30d, 0) / chargers.length).toFixed(1) : 0 }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">⚡ ChargerPulse</h1>
          <p className="text-gray-600">EV Charger Uptime Analytics</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-gray-500 text-sm font-semibold mb-2">24h Uptime</h2>
            <p className="text-3xl font-bold text-green-600">
              {chargers.length > 0 ? (chargers.reduce((a, c) => a + c.uptime24h, 0) / chargers.length).toFixed(1) : 0}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-gray-500 text-sm font-semibold mb-2">7d Uptime</h2>
            <p className="text-3xl font-bold text-blue-600">
              {chargers.length > 0 ? (chargers.reduce((a, c) => a + c.uptime7d, 0) / chargers.length).toFixed(1) : 0}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-gray-500 text-sm font-semibold mb-2">30d Uptime</h2>
            <p className="text-3xl font-bold text-indigo-600">
              {chargers.length > 0 ? (chargers.reduce((a, c) => a + c.uptime30d, 0) / chargers.length).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* Charger List */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Connected Chargers</h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 font-semibold text-gray-700">Charger ID</th>
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

        {/* Chart */}
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