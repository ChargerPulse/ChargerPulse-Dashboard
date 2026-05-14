'use client'

import { useState, useEffect } from 'react'

interface Alert {
  id: number
  cp_id: string
  nickname: string
  triggered_at: string
  resolved_at: string | null
  resolved: boolean
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
        if (Array.isArray(data)) setAlerts(data)
      } catch (err) {
        console.error('Failed to fetch alerts:', err)
      }
      setLoading(false)
    }
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const filtered = alerts.filter(a => {
    if (filter === 'active') return !a.resolved
    if (filter === 'resolved') return a.resolved
    return true
  })

  const activeCount = alerts.filter(a => !a.resolved).length

  const formatTime = (ts: string) => new Date(ts).toLocaleString()

  const getDuration = (start: string, end: string | null) => {
    const from = new Date(start).getTime()
    const to = end ? new Date(end).getTime() : Date.now()
    const mins = Math.floor((to - from) / 60000)
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  return (
    <div className="space-bg" style={{ padding: 32 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>🚨 Alerts</h1>
            <p style={{ color: '#64748b' }}>Charger downtime notifications</p>
          </div>
          <a href="/" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
            ← Dashboard
          </a>
        </div>

        {activeCount > 0 && (
          <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.4)', borderRadius: 12, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🚨</span>
            <div>
              <strong style={{ color: '#ff4444' }}>{activeCount} charger{activeCount > 1 ? 's are' : ' is'} currently down!</strong>
              <p style={{ color: '#94a3b8', fontSize: 13 }}>Immediate attention required.</p>
            </div>
          </div>
        )}

        {activeCount === 0 && !loading && (
          <div style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.4)', borderRadius: 12, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>✅</span>
            <strong style={{ color: '#00ff88' }}>All chargers are online and healthy!</strong>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Alerts', value: alerts.length, color: '#00d4ff' },
            { label: 'Active Alerts', value: activeCount, color: activeCount > 0 ? '#ff4444' : '#00ff88' },
            { label: 'Resolved Alerts', value: alerts.filter(a => a.resolved).length, color: '#00ff88' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 36, fontWeight: 800, color: s.color }}>{s.value}</p>
              <p style={{ color: '#64748b', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['all', 'active', 'resolved'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 20px', borderRadius: 8, fontWeight: 700, fontSize: 12,
              letterSpacing: 1, textTransform: 'capitalize', cursor: 'pointer', border: 'none',
              background: filter === f ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.04)',
              color: filter === f ? '#00d4ff' : '#64748b',
              outline: filter === f ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
            }}>
              {f} {f === 'active' && activeCount > 0 && `(${activeCount})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <p style={{ padding: 40, textAlign: 'center', color: '#334155', letterSpacing: 2, fontSize: 12 }}>LOADING ALERTS...</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No alerts found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Status', 'Charger', 'Triggered', 'Resolved', 'Duration'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 10, color: '#334155', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(alert => (
                  <tr key={alert.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '14px 20px' }}>
                      {alert.resolved ? (
                        <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#00ff88', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>✅ Resolved</span>
                      ) : (
                        <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#ff4444', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)' }}>🚨 Active</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ fontFamily: 'monospace', color: '#00d4ff', fontSize: 12 }}>{alert.cp_id}</p>
                      <p style={{ color: '#64748b', fontSize: 11 }}>{alert.nickname}</p>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: 12 }}>{formatTime(alert.triggered_at)}</td>
                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: 12 }}>{alert.resolved_at ? formatTime(alert.resolved_at) : '—'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: alert.resolved ? '#64748b' : '#ff4444', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {getDuration(alert.triggered_at, alert.resolved_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}