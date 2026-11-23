'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'

const C = { cyan: '#00d4ff', green: '#00ff88', red: '#ff4444', amber: '#f59e0b', text: '#e2e8f0', muted: '#94a3b8', faint: '#64748b', border: 'rgba(255,255,255,0.08)' }

interface Depot {
  id: string; name: string; address: string | null; country: string | null
  managerName: string | null; managerPhone: string | null
  chargerCount: number; up: number; faulted: number; offline: number
  uptime24h: number | null; uptime7d: number | null; faults24h: number
}
interface Data {
  depots: Depot[]
  totals: { depots: number; chargers: number; up: number; faulted: number; offline: number } | null
}

const uptimeColor = (v: number | null) => v === null ? C.faint : v >= 90 ? C.green : v >= 60 ? C.amber : C.red
const fmt = (v: number | null) => v === null ? '—' : `${v}%`

function health(d: Depot) {
  if (d.chargerCount === 0) return { label: 'No chargers', color: C.faint }
  if (d.faulted > 0) return { label: 'Needs attention', color: C.red }
  if (d.offline > 0) return { label: 'Degraded', color: C.amber }
  return { label: 'Ready', color: C.green }
}

export default function DepotsPage() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/depots')
      .then(async r => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Could not load depots.')
        setData(d)
      })
      .catch(e => setError(e.message || 'Could not load depots.'))
  }, [])

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar active="/depots" />
      <div className="space-bg" style={{ padding: 32, flex: 1, minWidth: 0 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 4 }}>Depots</h1>
              <p style={{ color: C.faint }}>Every depot, its chargers and its readiness at a glance</p>
            </div>
            <a href="/sites" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: C.cyan, padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
              Manage sites
            </a>
          </div>

          {error && <p style={{ color: C.red }}>{error}</p>}
          {!data && !error && <p style={{ color: C.faint }}>Loading...</p>}

          {data && data.totals && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Depots', value: data.totals.depots, color: C.text },
                { label: 'Chargers', value: data.totals.chargers, color: C.text },
                { label: 'Up now', value: data.totals.up, color: C.green },
                { label: 'Faulted', value: data.totals.faulted, color: data.totals.faulted ? C.red : C.faint },
                { label: 'Offline', value: data.totals.offline, color: data.totals.offline ? C.amber : C.faint },
              ].map(t => (
                <div key={t.label} className="card" style={{ padding: 18 }}>
                  <p style={{ color: C.faint, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{t.label}</p>
                  <p style={{ color: t.color, fontSize: 28, fontWeight: 800 }}>{t.value}</p>
                </div>
              ))}
            </div>
          )}

          {data && data.depots.length === 0 && (
            <div className="card" style={{ padding: 28 }}>
              <p style={{ color: C.faint, fontSize: 14 }}>
                No depots yet. Add a site on the Sites page, then assign chargers to it from each charger's Edit screen.
              </p>
            </div>
          )}

          {data && data.depots.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.depots.map(d => {
                const h = health(d)
                return (
                  <a key={d.id} href={`/sites/${d.id}`} className="card" style={{ padding: 20, textDecoration: 'none', display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                      <div>
                        <p style={{ color: C.text, fontWeight: 800, fontSize: 17, marginBottom: 2 }}>{d.name}</p>
                        <p style={{ color: C.faint, fontSize: 13 }}>
                          {[d.address, d.country].filter(Boolean).join(', ') || 'No address set'}
                        </p>
                        <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
                          {d.managerName ? `👤 ${d.managerName}${d.managerPhone ? ' · ' + d.managerPhone : ''}` : 'No manager set'}
                        </p>
                      </div>
                      <span style={{ alignSelf: 'flex-start', color: h.color, border: `1px solid ${h.color}55`, background: `${h.color}14`, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                        {h.label}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
                      <div><p style={{ color: C.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Chargers</p><p style={{ color: C.text, fontWeight: 800, fontSize: 20 }}>{d.chargerCount}</p></div>
                      <div><p style={{ color: C.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Up now</p><p style={{ color: C.green, fontWeight: 800, fontSize: 20 }}>{d.up} / {d.chargerCount}</p></div>
                      <div><p style={{ color: C.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>24h uptime</p><p style={{ color: uptimeColor(d.uptime24h), fontWeight: 800, fontSize: 20 }}>{fmt(d.uptime24h)}</p></div>
                      <div><p style={{ color: C.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>7d uptime</p><p style={{ color: uptimeColor(d.uptime7d), fontWeight: 800, fontSize: 20 }}>{fmt(d.uptime7d)}</p></div>
                      <div><p style={{ color: C.faint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Faults 24h</p><p style={{ color: d.faults24h ? C.red : C.faint, fontWeight: 800, fontSize: 20 }}>{d.faults24h}</p></div>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
           }
  
