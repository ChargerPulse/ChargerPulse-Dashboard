'use client'

import { useState, useEffect, useMemo } from 'react'

interface Event {
  id: number
  cp_id: string
  connector_id: number
  status: string
  ts: string
  // Optional — OCPP StatusNotification can carry a specific error code
  // (e.g. "ConnectorLockFailure", "GroundFailure"). Populate this in
  // /api/events once the backend forwards it, and the timeline will show
  // the real diagnostic detail instead of the generic status meaning.
  errorCode?: string
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

// What the status actually means, in plain language.
const statusMeaning = (s: string) => {
  switch (s) {
    case 'Available': return 'Charger is online and ready for use.'
    case 'Occupied': case 'Charging': return 'A vehicle is actively charging.'
    case 'Faulted': return 'Charger reported a fault and needs attention.'
    case 'Unavailable': return 'Charger is temporarily unavailable.'
    default: return 'Status update received.'
  }
}

// Only Faulted / Unavailable actually affect a driver — say so plainly,
// and only when it's true, rather than always showing an "impact" line.
const statusImpact = (s: string) => {
  if (s === 'Faulted' || s === 'Unavailable') return 'This connector is unavailable to drivers right now.'
  return null
}

// Generic, honest next-step guidance — not a fabricated diagnosis.
const suggestedAction = (s: string) => {
  if (s === 'Faulted') return 'Check the charger on-site, or restart it remotely once remote restart is available.'
  if (s === 'Unavailable') return 'Confirm power and network connectivity at the site.'
  return null
}

const formatDuration = (ms: number) => {
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
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

  // For each event, work out how long that state lasted by finding the
  // next event for the same charger + connector. If there isn't one yet,
  // the state is ongoing, so we measure up to "now" instead of guessing.
  const durationById = useMemo(() => {
    const map = new Map<number, { ms: number; ongoing: boolean }>()
    const groups = new Map<string, Event[]>()
    for (const ev of events) {
      const key = `${ev.cp_id}::${ev.connector_id}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(ev)
    }
    for (const group of groups.values()) {
      const sorted = [...group].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
      sorted.forEach((ev, i) => {
        const start = new Date(ev.ts).getTime()
        const next = sorted[i + 1]
        const end = next ? new Date(next.ts).getTime() : Date.now()
        map.set(ev.id, { ms: Math.max(0, end - start), ongoing: !next })
      })
    }
    return map
  }, [events])

  // Newest first for the timeline view.
  const sortedFiltered = [...filtered].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())

  return (
    <div className="space-bg" style={{ padding: '32px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>📋 Events Timeline</h1>
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

        {/* Timeline */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{sortedFiltered.length} Events</span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>Loading events...</div>
          ) : sortedFiltered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>No events found.</div>
          ) : (
            <div>
              {sortedFiltered.map((ev, idx) => {
                const st = statusStyle(ev.status)
                const duration = durationById.get(ev.id)
                const impact = statusImpact(ev.status)
                const action = suggestedAction(ev.status)
                return (
                  <div key={ev.id} style={{
                    padding: '16px 20px',
                    borderBottom: idx < sortedFiltered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    display: 'flex', gap: 16, alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: st.bg, border: `1px solid ${st.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>{st.icon}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <span style={{ fontFamily: 'monospace', color: '#00d4ff', fontSize: 12 }}>{getNick(ev.cp_id)}</span>
                          <span style={{ color: '#334155', fontSize: 11, marginLeft: 8 }}>Connector #{ev.connector_id}</span>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
                          {ev.status}
                        </span>
                      </div>

                      <p style={{ color: '#cbd5e1', fontSize: 13, marginTop: 6 }}>
                        {ev.errorCode ? ev.errorCode : statusMeaning(ev.status)}
                      </p>

                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8, fontSize: 11, color: '#64748b' }}>
                        <span>Started: {new Date(ev.ts).toLocaleString()}</span>
                        {duration && (
                          <span>{duration.ongoing ? 'Ongoing for' : 'Lasted'}: {formatDuration(duration.ms)}</span>
                        )}
                      </div>

                      {impact && (
                        <p style={{ color: '#f59e0b', fontSize: 11, marginTop: 6 }}>⚠ {impact}</p>
                      )}
                      {action && (
                        <p style={{ color: '#64748b', fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>→ {action}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
