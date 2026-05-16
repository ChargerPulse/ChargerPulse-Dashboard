'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '../../lib/supabase'

interface ChargerData {
  id: string
  nickname: string
  uptime24h: number
  uptime7d: number
  uptime30d: number
  lastUpdate: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(13,20,33,0.95)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 8, padding: '8px 14px' }}>
        <p style={{ color: '#64748b', fontSize: 11 }}>{label}</p>
        <p style={{ color: '#00d4ff', fontWeight: 700 }}>{payload[0].value}%</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [chargers, setChargers] = useState<ChargerData[]>([])
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserEmail(data.user.email || '')
    })

    const fetchChargers = async () => {
      try {
        const res = await fetch('/api/chargers')
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) setChargers(data)
      } catch (err) {
        console.error('Fetch failed:', err)
      }
      setLoading(false)
    }
    fetchChargers()
    const dataInterval = setInterval(fetchChargers, 30000)
    const timeInterval = setInterval(() => setTime(new Date()), 1000)
    return () => { clearInterval(dataInterval); clearInterval(timeInterval) }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const avg = (key: keyof ChargerData) =>
    chargers.length > 0
      ? (chargers.reduce((a, c) => a + (c[key] as number), 0) / chargers.length).toFixed(1)
      : '0'

  const chartData = [
    { name: '30d', value: parseFloat(avg('uptime30d')) },
    { name: '7d', value: parseFloat(avg('uptime7d')) },
    { name: '24h', value: parseFloat(avg('uptime24h')) },
  ]

  const getUptimeColor = (val: number) => {
    if (val >= 95) return '#00ff88'
    if (val >= 80) return '#f59e0b'
    return '#ff4444'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #080c14 0%, #0d1421 50%, #080c14 100%)', padding: '24px', position: 'relative', overflow: 'hidden' }}>

      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* TOP NAV */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, #00d4ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 20px rgba(0,212,255,0.4)' }}>⚡</div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, color: '#e2e8f0', textTransform: 'uppercase' }}>ChargerPulse</h1>
              <p style={{ fontSize: 10, color: '#00d4ff', letterSpacing: 3, textTransform: 'uppercase' }}>EV Intelligence Platform</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[
              { href: '/register', label: '+ ADD', color: '#00ff88', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.3)' },
              { href: '/events', label: 'EVENTS', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)' },
              { href: '/alerts', label: 'ALERTS', color: '#ff4444', bg: 'rgba(255,68,68,0.1)', border: 'rgba(255,68,68,0.3)' },
              { href: '/pricing', label: 'UPGRADE', color: '#00d4ff', bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.3)' },
            ].map(btn => (
              <a key={btn.href} href={btn.href} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                letterSpacing: 1.5, textDecoration: 'none', color: btn.color,
                background: btn.bg, border: `1px solid ${btn.border}`,
              }}>{btn.label}</a>
            ))}
            <button onClick={handleLogout} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              letterSpacing: 1.5, color: '#ff4444', background: 'rgba(255,68,68,0.1)',
              border: '1px solid rgba(255,68,68,0.3)', cursor: 'pointer',
            }}>LOGOUT</button>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#00d4ff', fontFamily: 'monospace', letterSpacing: 2 }}>
              {time.toLocaleTimeString()}
            </p>
            <p style={{ fontSize: 10, color: '#64748b', letterSpacing: 1 }}>
              {time.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            {userEmail && (
              <p style={{ fontSize: 9, color: '#334155', marginTop: 2, letterSpacing: 1 }}>{userEmail}</p>
            )}
          </div>
        </div>

        {/* KPI CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'FLEET UPTIME 24H', value: `${avg('uptime24h')}%`, color: getUptimeColor(parseFloat(avg('uptime24h'))), icon: '◉', sub: 'Last 24 hours' },
            { label: 'FLEET UPTIME 7D', value: `${avg('uptime7d')}%`, color: getUptimeColor(parseFloat(avg('uptime7d'))), icon: '◈', sub: 'Last 7 days' },
            { label: 'FLEET UPTIME 30D', value: `${avg('uptime30d')}%`, color: getUptimeColor(parseFloat(avg('uptime30d'))), icon: '◇', sub: 'Last 30 days' },
            { label: 'ACTIVE CHARGERS', value: chargers.length.toString(), color: '#00d4ff', icon: '⚡', sub: 'Connected nodes' },
          ].map((kpi, i) => (
            <div key={i} style={{
              background: 'rgba(13,20,33,0.85)', borderRadius: 12, padding: '20px 24px',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 0 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${kpi.color}, transparent)`, opacity: 0.6 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 9, color: '#64748b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{kpi.label}</p>
                  <p style={{ fontSize: 36, fontWeight: 800, color: kpi.color, lineHeight: 1, textShadow: `0 0 20px ${kpi.color}80` }}>{kpi.value}</p>
                  <p style={{ fontSize: 10, color: '#334155', marginTop: 6, letterSpacing: 1 }}>{kpi.sub}</p>
                </div>
                <span style={{ fontSize: 24, color: kpi.color, opacity: 0.4 }}>{kpi.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }}>

          {/* CHARGERS TABLE */}
          <div style={{ background: 'rgba(13,20,33,0.85)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(0,212,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#e2e8f0' }}>⚡ Connected Chargers</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[7, 30].map(d => (
                  <a key={d} href={`/api/export?days=${d}`} style={{
                    padding: '5px 12px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                    letterSpacing: 1, color: '#64748b', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none',
                  }}>↓ {d}D</a>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#334155', letterSpacing: 2, fontSize: 11 }}>LOADING...</div>
            ) : chargers.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ color: '#334155', marginBottom: 12 }}>No chargers connected</p>
                <a href="/register" style={{ color: '#00d4ff', fontSize: 12 }}>+ Register your first charger</a>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {['CHARGER ID', 'NAME', '24H', '7D', '30D', 'LAST SEEN'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 9, color: '#334155', letterSpacing: 2, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chargers.map((charger) => (
                    <tr key={charger.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '14px 20px' }}>
                        <a href={`/chargers/${charger.id}`} style={{ color: '#00d4ff', fontFamily: 'monospace', fontSize: 12, textDecoration: 'none', letterSpacing: 1 }}>
                          {charger.id}
                        </a>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: 12 }}>{charger.nickname}</td>
                      {[charger.uptime24h, charger.uptime7d, charger.uptime30d].map((val, j) => (
                        <td key={j} style={{ padding: '14px 20px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                            color: getUptimeColor(val),
                            background: `${getUptimeColor(val)}18`,
                            border: `1px solid ${getUptimeColor(val)}40`,
                          }}>{val}%</span>
                        </td>
                      ))}
                      <td style={{ padding: '14px 20px', color: '#334155', fontSize: 11, fontFamily: 'monospace' }}>{charger.lastUpdate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* UPTIME CHART */}
            <div style={{ background: 'rgba(13,20,33,0.85)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 20, flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#e2e8f0', marginBottom: 16 }}>◈ Uptime Trend</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#00d4ff" strokeWidth={2} fill="url(#cyanGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* SYSTEM STATUS */}
            <div style={{ background: 'rgba(13,20,33,0.85)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#e2e8f0', marginBottom: 16 }}>◉ System Status</p>
              {[
                { label: 'OCPP Server', status: 'ONLINE', color: '#00ff88' },
                { label: 'Database', status: 'CONNECTED', color: '#00ff88' },
                { label: 'Alert Engine', status: 'ACTIVE', color: '#00ff88' },
                { label: 'Email Alerts', status: 'ENABLED', color: '#00d4ff' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: '#64748b', letterSpacing: 1 }}>{s.label}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: s.color, letterSpacing: 1, padding: '3px 8px', background: `${s.color}18`, borderRadius: 4, border: `1px solid ${s.color}40` }}>{s.status}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <p style={{ fontSize: 10, color: '#1e293b', letterSpacing: 2 }}>CHARGERPULSE v1.0 — EV INTELLIGENCE PLATFORM</p>
          <p style={{ fontSize: 10, color: '#1e293b', letterSpacing: 1 }}>DATA REFRESHES EVERY 30S</p>
        </div>

      </div>
    </div>
  )
}