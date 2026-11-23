'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Sidebar from '../../../components/Sidebar'

const C = { cyan: '#00d4ff', green: '#00ff88', red: '#ff4444', amber: '#f59e0b', text: '#e2e8f0', muted: '#94a3b8', faint: '#64748b', border: 'rgba(255,255,255,0.08)' }

interface Depot {
  site: {
    id: string; name: string; address: string | null; country: string | null
    manager_name: string | null; manager_phone: string | null; manager_email: string | null
    grid_status: string
  }
  chargers: {
    id: string; nickname: string; status: string
    uptime24h: number; uptime7d: number; uptime30d: number
    sessions30d: number; energy30dKwh: number
  }[]
  summary: {
    chargerCount: number; available: number; charging: number; faulted: number; offline: number
    uptime24h: number; uptime7d: number; uptime30d: number
    sessionsToday: number; energyTodayKwh: number; sessions30d: number; energy30dKwh: number
  }
  faultHistory: { charger: string; chargerId: string; connectorId: number | null; status: string; ts: string }[]
}

const STATUS_COLOR: Record<string, string> = { available: C.green, charging: C.cyan, faulted: C.red, offline: C.faint }

function uptimeColor(v: number) { return v >= 90 ? C.green : v >= 60 ? C.amber : C.red }

function Tile({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <p style={{ color: C.faint, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
      <p style={{ color: color || C.text, fontSize: 28, fontWeight: 800 }}>{value}</p>
      {sub && <p style={{ color: C.faint, fontSize: 12, marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

export default function DepotPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [depot, setDepot] = useState<Depot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', country: '', managerName: '', managerPhone: '', managerEmail: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/depots/${id}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not load depot.'); return }
      setDepot(data)
    } catch {
      setError('Could not load depot.')
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const startEdit = () => {
    if (!depot) return
    const s = depot.site
    setForm({
      name: s.name, address: s.address || '', country: s.country || '',
      managerName: s.manager_name || '', managerPhone: s.manager_phone || '', managerEmail: s.manager_email || '',
    })
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/depots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setEditing(false); await load() }
    } catch { /* leave the form open so nothing is lost */ }
    setSaving(false)
  }

  const input = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 14, boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar active="/sites" />
      <div className="space-bg" style={{ padding: 32, flex: 1, minWidth: 0 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>

          <a href="/sites" style={{ color: C.cyan, fontSize: 13, textDecoration: 'none' }}>← All depots</a>

          {error && <p style={{ color: C.red, marginTop: 24 }}>{error}</p>}
          {!depot && !error && <p style={{ color: C.faint, marginTop: 24 }}>Loading...</p>}

          {depot && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '16px 0 24px', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: 30, fontWeight: 800, color: C.text, marginBottom: 4 }}>{depot.site.name}</h1>
                  <p style={{ color: C.faint }}>
                    {[depot.site.address, depot.site.country].filter(Boolean).join(', ') || 'No address set'}
                  </p>
                </div>
                <button onClick={startEdit} style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: C.cyan, padding: '8px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                  Edit depot
                </button>
              </div>

              {editing && (
                <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <input style={input} placeholder="Depot name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <input style={input} placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    <input style={input} placeholder="Country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
                    <input style={input} placeholder="Depot manager name" value={form.managerName} onChange={e => setForm({ ...form, managerName: e.target.value })} />
                    <input style={input} placeholder="Manager phone" value={form.managerPhone} onChange={e => setForm({ ...form, managerPhone: e.target.value })} />
                    <input style={input} placeholder="Manager email" value={form.managerEmail} onChange={e => setForm({ ...form, managerEmail: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button onClick={save} disabled={saving} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', fontWeight: 800, cursor: 'pointer', background: 'linear-gradient(135deg, #00d4ff, #a855f7)', color: 'white' }}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setEditing(false)} style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}

              <div className="card" style={{ padding: 20, marginBottom: 24 }}>
                <p style={{ color: C.faint, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Depot manager</p>
                {depot.site.manager_name || depot.site.manager_phone || depot.site.manager_email ? (
                  <div style={{ color: C.text, fontSize: 14, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {depot.site.manager_name && <span>👤 {depot.site.manager_name}</span>}
                    {depot.site.manager_phone && <span>📞 {depot.site.manager_phone}</span>}
                    {depot.site.manager_email && <span>✉️ {depot.site.manager_email}</span>}
                  </div>
                ) : (
                  <p style={{ color: C.faint, fontSize: 14 }}>No manager set. Use Edit depot to add one.</p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
                <Tile label="Chargers" value={String(depot.summary.chargerCount)}
                  sub={`${depot.summary.available + depot.summary.charging} up · ${depot.summary.faulted} faulted · ${depot.summary.offline} offline`} />
                <Tile label="24h uptime" value={`${depot.summary.uptime24h}%`} color={uptimeColor(depot.summary.uptime24h)} />
                <Tile label="7d uptime" value={`${depot.summary.uptime7d}%`} color={uptimeColor(depot.summary.uptime7d)} />
                <Tile label="Energy today" value={`${depot.summary.energyTodayKwh} kWh`} sub={`${depot.summary.sessionsToday} sessions`} color={C.cyan} />
                <Tile label="Energy 30 days" value={`${depot.summary.energy30dKwh} kWh`} sub={`${depot.summary.sessions30d} sessions`} color={C.cyan} />
              </div>

              <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Chargers at this depot</h2>
                {depot.chargers.length === 0 ? (
                  <p style={{ color: C.faint, fontSize: 14 }}>
                    No chargers assigned yet. Open a charger, choose Edit, and select this depot.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                      <thead>
                        <tr style={{ color: C.faint, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'left' }}>
                          <th style={{ padding: '8px 0' }}>Charger</th><th>Status</th><th>24h</th><th>7d</th><th>30d</th><th>Sessions</th><th>Energy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {depot.chargers.map(c => (
                          <tr key={c.id} style={{ borderTop: `1px solid ${C.border}`, fontSize: 14, color: C.text }}>
                            <td style={{ padding: '12px 0' }}>
                              <a href={`/chargers/${c.id}`} style={{ color: C.cyan, textDecoration: 'none' }}>{c.nickname}</a>
                            </td>
                            <td style={{ color: STATUS_COLOR[c.status] || C.faint, fontWeight: 700, textTransform: 'capitalize' }}>● {c.status}</td>
                            <td style={{ color: uptimeColor(c.uptime24h) }}>{c.uptime24h}%</td>
                            <td style={{ color: uptimeColor(c.uptime7d) }}>{c.uptime7d}%</td>
                            <td style={{ color: uptimeColor(c.uptime30d) }}>{c.uptime30d}%</td>
                            <td>{c.sessions30d}</td>
                            <td>{c.energy30dKwh} kWh</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Fault history (last 30 days)</h2>
                {depot.faultHistory.length === 0 ? (
                  <p style={{ color: C.faint, fontSize: 14 }}>No faults recorded at this depot.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {depot.faultHistory.map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, borderTop: i ? `1px solid ${C.border}` : 'none', paddingTop: i ? 10 : 0 }}>
                        <span style={{ color: C.text }}>
                          <span style={{ color: f.status === 'Faulted' ? C.red : C.amber, fontWeight: 700 }}>{f.status}</span>
                          {' · '}{f.charger}{f.connectorId ? ` · connector ${f.connectorId}` : ''}
                        </span>
                        <span style={{ color: C.faint, whiteSpace: 'nowrap' }}>{new Date(f.ts).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
