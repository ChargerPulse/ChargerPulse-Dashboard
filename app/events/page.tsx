'use client'

import { useState, useEffect } from 'react'

interface Event {
  id: number
  cp_id: string
  connector_id: number
  status: string
  ts: string
}

interface Charger {
  id: string
  nickname: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [chargers, setChargers] = useState<Charger[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, chargersRes] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/chargers')
        ])
        const eventsData = await eventsRes.json()
        const chargersData = await chargersRes.json()
        if (Array.isArray(eventsData)) setEvents(eventsData)
        if (Array.isArray(chargersData)) setChargers(chargersData)
      } catch (err) {
        console.error('Failed to fetch:', err)
      }
      setLoading(false)
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const filtered = filter === 'all'
    ? events
    : events.filter(e => e.cp_id === filter)

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-700'
      case 'Occupied':
      case 'Charging':
        return 'bg-blue-100 text-blue-700'
      case 'Faulted':
        return 'bg-red-100 text-red-700'
      case 'Unavailable':
        return 'bg-yellow-100 text-yellow-700'
      case 'Offline':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available': return '✅'
      case 'Occupied':
      case 'Charging': return '⚡'
      case 'Faulted': return '🚨'
      case 'Unavailable': return '⚠️'
      case 'Offline': return '💤'
      default: return '❓'
    }
  }

  const formatTime = (ts: string) => new Date(ts).toLocaleString()

  const getNickname = (cp_id: string) => {
    const charger = chargers.find(c => c.id === cp_id)
    return charger ? charger.nickname : cp_id
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">📋 Events Feed</h1>
            <p className="text-gray-600">Live log of all OCPP charger events</p>
          </div>
          <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
            ← Dashboard
          </a>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {['Available', 'Occupied', 'Faulted', 'Unavailable'].map(s => (
            <div key={s} className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">
                {events.filter(e => e.status === s).length}
              </p>
              <p className={`text-sm font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${getStatusStyle(s)}`}>
                {getStatusIcon(s)} {s}
              </p>
            </div>
          ))}
        </div>

        {/* Filter by charger */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            All Chargers ({events.length})
          </button>
          {chargers.map(c => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`px-4 py-2 rounded-lg font-semibold ${filter === c.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {c.nickname} ({events.filter(e => e.cp_id === c.id).length})
            </button>
          ))}
        </div>

        {/* Events table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {filtered.length} Events {filter !== 'all' && `for ${getNickname(filter)}`}
          </h2>
          {loading ? (
            <p className="text-gray-500">Loading events...</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-500">No events found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 font-semibold text-gray-700">Time</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Charger</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Connector</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => (
                    <tr key={event.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500 text-sm">{formatTime(event.ts)}</td>
                      <td className="py-3 px-4">
                        <p className="font-mono text-gray-800 text-sm">{event.cp_id}</p>
                        <p className="text-gray-500 text-xs">{getNickname(event.cp_id)}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600">#{event.connector_id}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusStyle(event.status)}`}>
                          {getStatusIcon(event.status)} {event.status}
                        </span>
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