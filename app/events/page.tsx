'use client'

import { useState, useEffect } from 'react'

interface Event {
  id: number
  cp_id: string
  connector_id: number
  status: string
  ts: string
}

interface Charger { id: string; nickname: string }

const statusStyle = (s: string) => {
  switch(s) {
    case 'Available': return { color: '#00ff88', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.3)', icon: '✅' }
    case 'Occupied': case 'Charging': return { color: '#00d4ff', bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.3)', icon: '⚡' }
    case 'Faulted': return { color: '#ff4444', bg: 'rgba(255,68,68,0.1)', border: 'rgba(255,68,68,0.3)', icon: '🚨' }
    case 'Unavailable': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: '⚠️' }
    default: return { color: '#64748b', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', icon: '💤' }
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [chargers, setChargers] = useState<Charger[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const load = async () => {
      try {
        const [e, c] = await Promise.all([fetch('/api/events'), fetch('/api/chargers')])
        const ed = await e.json(); const cd = await c.json()
        if (Array.isArray(ed)) setEvents(ed)
        if (Array.isArray(cd)) setChargers(cd)
      } catch {}
      setLoading(false)
    }
    load()
    const i = setInterval(load, 30000)
    return () => clearInterval(i)
  }, [])

  const filtered = filter === 'all' ? events : events.filter(e => e.cp_id === filter)
  const getNick = (id: string) => chargers.find(c => c.id === id)?.nickname || id

  return (
    <div className="space-bg" style={{ padding: '32px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>📋 Events Feed</h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>Live log of all OCPP charger events</p>
          </div>
          <a href="/" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
            ← Dashboard
          </a>
        </div>

        {/* Status counts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {['Available', 'Occupied', 'Faulted', 'Unavailable'].map(s => {
            const st = statusStyle(s)
            return (
              <div key={s} className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: 36, fontWeight: 800, color: st.color }}>{events.filter(e => e.status === s).length}</p>
                <p style={{ color: st.color, fontSize: 11, letterSpacing: 1, marginTop: 4 }}>{st.icon} {s.toUpperCase()}</p>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('all')} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: filter === 'all' ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(255,255,255,0.08)', background: filter === 'all' ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.03)', color: filter === 'all' ? '#00d4ff' : '#64748b' }}>
            ALL ({events.length})
          </button>
          {chargers.map(c => (
            <button key={c.id} onClick={() => setFilter(c.id)} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: filter === c.id ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(255,255,255,0.08)', background: filter === c.id ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.03)', color: filter === c.id ? '#00d4ff' : '#64748b' }}>
              {c.nickname} ({events.filter(e => e.cp_id === c.id).length})
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{filtered.length} Events</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Time', 'Charger', 'Connector', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, color: '#475569', letterSpacing: 2, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#475569' }}>Loading events...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#475569' }}>No events found.</td></tr>
              ) : filtered.map(ev => {
                const st = statusStyle(ev.status)
                return (
                  <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 20px', color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>{new Date(ev.ts).toLocaleString()}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <p style={{ fontFamily: 'monospace', color: '#00d4ff', fontSize: 12 }}>{ev.cp_id}</p>
                      <p style={{ color: '#64748b', fontSize: 11 }}>{getNick(ev.cp_id)}</p>
                    </td>
                    <td style={{ padding: '12px 20px', color: '#64748b', fontSize: 12 }}>#{ev.connector_id}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
                        {st.icon} {ev.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}