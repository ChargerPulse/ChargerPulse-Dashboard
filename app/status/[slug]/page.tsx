'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

const StatusMap = dynamic(() => import('./StatusMap'), { ssr: false })

interface StatusData {
  display_name: string
  charger_count: number
  online_count: number
  uptime_24h: number
  counts: { available: number; charging: number; faulted: number; offline: number }
  sites: Array<{ lat: number; lng: number; name: string }>
  generated_at: string
  error?: string
}

const COLORS = {
  cyan: '#00d4ff', purple: '#a855f7', green: '#00ff88', red: '#ff4444',
  amber: '#f59e0b', text: '#e2e8f0', muted: '#94a3b8', faint: '#64748b',
  border: 'rgba(255,255,255,0.08)',
}

export default function PublicStatusPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    params.then(({ slug }) => {
      fetch(`/api/public-status/${slug}`)
        .then(res => {
          if (res.status === 404) {
            setNotFound(true)
            setLoading(false)
            return null
          }
          return res.json()
        })
        .then(d => {
          if (d) setData(d)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    })
  }, [params])

  const cardStyle = {
    background: 'rgba(13,20,40,0.75)', border: `1px solid ${COLORS.border}`,
    borderRadius: 16, backdropFilter: 'blur(20px)' as const,
  }

  if (loading) {
    return (
      <div className="space-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: COLORS.muted }}>Loading network status...</p>
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="space-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: COLORS.muted }}>Status page not found.</p>
      </div>
    )
  }

  const statusItems = [
    { label: 'Available', count: data.counts.available, color: COLORS.green },
    { label: 'Charging', count: data.counts.charging, color: COLORS.cyan },
    { label: 'Faulted', count: data.counts.faulted, color: COLORS.red },
    { label: 'Offline', count: data.counts.offline, color: COLORS.faint },
  ]

  return (
    <div className="space-bg" style={{ padding: 24, paddingBottom: 60, minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 32, paddingTop: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: COLORS.cyan, textTransform: 'uppercase' }}>⚡ ChargerPulse</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.text, marginTop: 8 }}>{data.display_name}</h1>
        </div>

        <div style={{ ...cardStyle, padding: 32, textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: COLORS.faint, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Network Uptime (24h)</p>
          <p style={{
            fontSize: 56, fontWeight: 800, lineHeight: 1,
            color: data.uptime_24h >= 95 ? COLORS.green : data.uptime_24h >= 80 ? COLORS.amber : COLORS.red,
          }}>
            {data.uptime_24h}%
          </p>
          <p style={{ color: COLORS.muted, fontSize: 14, marginTop: 12 }}>
            {data.charger_count} charger{data.charger_count !== 1 ? 's' : ''} monitored
          </p>
        </div>

        <div style={{ ...cardStyle, padding: 24, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Status breakdown</p>
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16, background: 'rgba(255,255,255,0.04)' }}>
            {statusItems.filter(s => s.count > 0).map(s => (
              <div key={s.label} style={{ background: s.color, width: `${(s.count / Math.max(data.charger_count, 1)) * 100}%` }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {statusItems.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.count}</p>
                <p style={{ fontSize: 10, color: COLORS.faint, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {data.sites.length > 0 && (
          <div style={{ ...cardStyle, padding: 24, marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Locations</p>
            <StatusMap sites={data.sites} />
          </div>
        )}

        <p style={{ textAlign: 'center', color: COLORS.faint, fontSize: 11, marginTop: 24 }}>
          Powered by ChargerPulse — EV charger monitoring &amp; management · Updated {new Date(data.generated_at).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
