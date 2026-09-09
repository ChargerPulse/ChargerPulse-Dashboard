'use client'

import { useState, useEffect, useRef } from 'react'

const COLORS = {
  cyan: '#00d4ff', purple: '#a855f7', green: '#00ff88', red: '#ff4444',
  amber: '#f59e0b', text: '#e2e8f0', muted: '#94a3b8', faint: '#64748b',
  border: 'rgba(255,255,255,0.08)',
}

type Status = 'available' | 'charging' | 'faulted'

interface DemoCharger {
  id: string
  nickname: string
  site: string
  status: Status
  powerKw: number
  sessionEnergyKwh: number
}

interface FeedItem {
  id: number
  text: string
  time: string
  icon: string
  color: string
}

const INITIAL_CHARGERS: DemoCharger[] = [
  { id: 'CP-01', nickname: 'Sandton Mall — Bay 1', site: 'Sandton Mall', status: 'charging', powerKw: 22, sessionEnergyKwh: 8.4 },
  { id: 'CP-02', nickname: 'Sandton Mall — Bay 2', site: 'Sandton Mall', status: 'available', powerKw: 0, sessionEnergyKwh: 0 },
  { id: 'CP-03', nickname: 'Sandton Mall — Bay 3', site: 'Sandton Mall', status: 'charging', powerKw: 50, sessionEnergyKwh: 31.2 },
  { id: 'CP-04', nickname: 'Rosebank Depot — 1', site: 'Rosebank Depot', status: 'available', powerKw: 0, sessionEnergyKwh: 0 },
  { id: 'CP-05', nickname: 'Rosebank Depot — 2', site: 'Rosebank Depot', status: 'available', powerKw: 0, sessionEnergyKwh: 0 },
  { id: 'CP-06', nickname: 'Rosebank Depot — 3', site: 'Rosebank Depot', status: 'charging', powerKw: 11, sessionEnergyKwh: 3.6 },
]

const TARIFF_PER_KWH = 3.5 // ZAR, demo-only

export default function DemoModePage() {
  const [chargers, setChargers] = useState<DemoCharger[]>(INITIAL_CHARGERS)
  const [sessionsToday, setSessionsToday] = useState(37)
  const [feed, setFeed] = useState<FeedItem[]>([])
  const feedIdRef = useRef(0)
  const tickRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1
      setChargers(prev => {
        const next = [...prev]
        const i = Math.floor(Math.random() * next.length)
        const c = { ...next[i] }
        const roll = Math.random()

        if (c.status === 'charging') {
          c.sessionEnergyKwh = parseFloat((c.sessionEnergyKwh + c.powerKw / 120).toFixed(1))
          if (roll < 0.12) {
            // session ends
            c.status = 'available'
            c.powerKw = 0
            c.sessionEnergyKwh = 0
            pushFeed(`${c.nickname} — session ended`, '✅', COLORS.green)
            setSessionsToday(s => s + 1)
          } else if (roll < 0.16) {
            c.status = 'faulted'
            c.powerKw = 0
            pushFeed(`${c.nickname} — fault detected`, '🚨', COLORS.red)
          }
        } else if (c.status === 'available') {
          if (roll < 0.18) {
            c.status = 'charging'
            c.powerKw = [11, 22, 50][Math.floor(Math.random() * 3)]
            c.sessionEnergyKwh = 0
            pushFeed(`${c.nickname} — charging session started`, '⚡', COLORS.cyan)
          }
        } else if (c.status === 'faulted') {
          if (roll < 0.35) {
            c.status = 'available'
            pushFeed(`${c.nickname} — recovered`, '🟢', COLORS.green)
          }
        }

        next[i] = c
        return next
      })
    }, 2200)

    return () => clearInterval(interval)
  }, [])

  const pushFeed = (text: string, icon: string, color: string) => {
    feedIdRef.current += 1
    setFeed(prev => [
      { id: feedIdRef.current, text, icon, color, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 7),
    ])
  }

  const cardStyle = {
    background: 'rgba(13,20,40,0.75)', border: `1px solid ${COLORS.border}`,
    borderRadius: 16, backdropFilter: 'blur(20px)' as const,
  }

  const available = chargers.filter(c => c.status === 'available').length
  const charging = chargers.filter(c => c.status === 'charging').length
  const faulted = chargers.filter(c => c.status === 'faulted').length
  const energyToday = parseFloat((chargers.reduce((s, c) => s + c.sessionEnergyKwh, 0) + 142.8).toFixed(1))
  const uptime = parseFloat((100 - (faulted / chargers.length) * 100).toFixed(1))
  const revenue = Math.round(energyToday * TARIFF_PER_KWH)

  const statusColor = (s: Status) => s === 'available' ? COLORS.green : s === 'charging' ? COLORS.cyan : COLORS.red
  const statusLabel = (s: Status) => s === 'available' ? 'Available' : s === 'charging' ? 'Charging' : 'Faulted'

  return (
    <div className="space-bg" style={{ padding: 24, paddingBottom: 60, minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 800, letterSpacing: 2,
            color: COLORS.amber, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            padding: '4px 12px', borderRadius: 20, marginBottom: 16,
          }}>
            ⚠ DEMO MODE — SIMULATED NETWORK ACTIVITY
          </span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: COLORS.cyan, textTransform: 'uppercase' }}>⚡ ChargerPulse</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.text, marginTop: 8 }}>Network Command Centre</h1>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'CHARGERS', value: chargers.length.toString(), color: COLORS.cyan },
            { label: 'UPTIME', value: `${uptime}%`, color: uptime >= 90 ? COLORS.green : COLORS.amber },
            { label: 'SESSIONS TODAY', value: sessionsToday.toString(), color: COLORS.purple },
            { label: 'ENERGY TODAY', value: `${energyToday} kWh`, color: COLORS.cyan },
            { label: 'REVENUE', value: `R${revenue.toLocaleString()}`, color: COLORS.amber },
          ].map(kpi => (
            <div key={kpi.label} style={{ ...cardStyle, padding: '16px 12px', textAlign: 'center' }}>
              <p style={{ fontSize: 9, color: COLORS.faint, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{kpi.label}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Status breakdown */}
        <div style={{ ...cardStyle, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 12, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ background: COLORS.green, width: `${(available / chargers.length) * 100}%`, transition: 'width 0.6s ease' }} />
            <div style={{ background: COLORS.cyan, width: `${(charging / chargers.length) * 100}%`, transition: 'width 0.6s ease' }} />
            <div style={{ background: COLORS.red, width: `${(faulted / chargers.length) * 100}%`, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 12 }}>
            <span style={{ color: COLORS.green }}>🟢 {available} Available</span>
            <span style={{ color: COLORS.cyan }}>⚡ {charging} Charging</span>
            <span style={{ color: COLORS.red }}>🚨 {faulted} Faulted</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>

          {/* Fleet table */}
          <div style={{ ...cardStyle, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 14 }}>Charger Network</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {chargers.map(c => (
                <div key={c.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)',
                }}>
                  <div>
                    <p style={{ color: COLORS.text, fontSize: 13, fontWeight: 600 }}>{c.nickname}</p>
                    {c.status === 'charging' && (
                      <p style={{ color: COLORS.faint, fontSize: 11, marginTop: 2 }}>{c.powerKw} kW · {c.sessionEnergyKwh} kWh delivered</p>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                    color: statusColor(c.status), background: `${statusColor(c.status)}18`,
                    border: `1px solid ${statusColor(c.status)}40`,
                  }}>
                    {statusLabel(c.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live feed */}
          <div style={{ ...cardStyle, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 14 }}>⚡ Live Operations</p>
            {feed.length === 0 ? (
              <p style={{ color: COLORS.faint, fontSize: 12 }}>Watching the network...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {feed.map(f => (
                  <div key={f.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span>{f.icon}</span>
                    <div>
                      <p style={{ color: COLORS.text, fontSize: 12 }}>{f.text}</p>
                      <p style={{ color: COLORS.faint, fontSize: 10, marginTop: 1 }}>{f.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <p style={{ textAlign: 'center', color: COLORS.faint, fontSize: 11, marginTop: 24 }}>
          This is a simulated demo network for illustration purposes — not live customer data.
        </p>
      </div>
    </div>
  )
}
