'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Sidebar from '../../../components/Sidebar'

interface Period { kwh: number; sessions: number; revenue: number }
interface EnergyData {
  today: Period
  week: Period
  month: Period
  byCharger: Array<{ id: string; nickname: string; kwh: number; sessions: number }>
  dailyTrend: Array<{ date: string; kwh: number }>
  currency: string
}

const COLORS = { cyan: '#00d4ff', purple: '#a855f7', amber: '#f59e0b', text: '#e2e8f0', muted: '#94a3b8', faint: '#64748b', border: 'rgba(255,255,255,0.08)' }

export default function EnergyPage() {
  const [data, setData] = useState<EnergyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/energy')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const cardStyle = {
    background: 'rgba(13,20,40,0.75)', border: `1px solid ${COLORS.border}`,
    borderRadius: 16, backdropFilter: 'blur(20px)' as const,
  }

  const handleDownloadReport = () => {
    if (!data) return
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('ChargerPulse — Energy Report', 14, 20)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27)

    autoTable(doc, {
      startY: 34,
      head: [['Period', 'Energy (kWh)', 'Sessions', `Est. Revenue (${data.currency})`]],
      body: [
        ['Today', data.today.kwh.toString(), data.today.sessions.toString(), data.today.revenue.toFixed(2)],
        ['Last 7 days', data.week.kwh.toString(), data.week.sessions.toString(), data.week.revenue.toFixed(2)],
        ['Last 30 days', data.month.kwh.toString(), data.month.sessions.toString(), data.month.revenue.toFixed(2)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [4, 47, 51] },
      styles: { fontSize: 9 },
    })

    if (data.byCharger.length > 0) {
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
      doc.setFontSize(12)
      doc.setTextColor(0)
      doc.text('By Charger — Last 30 Days', 14, finalY + 12)

      autoTable(doc, {
        startY: finalY + 16,
        head: [['Charger', 'Energy (kWh)', 'Sessions']],
        body: data.byCharger.map(c => [c.nickname, c.kwh.toString(), c.sessions.toString()]),
        theme: 'grid',
        headStyles: { fillColor: [4, 47, 51] },
        styles: { fontSize: 9 },
      })
    }

    doc.save(`chargerpulse-energy-report-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar active="/analytics/energy" />
        <div className="space-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <p style={{ color: COLORS.muted, fontSize: 18 }}>Loading energy data...</p>
        </div>
      </div>
    )
  }

  const periods = [
    { label: 'TODAY', data: data?.today },
    { label: 'LAST 7 DAYS', data: data?.week },
    { label: 'LAST 30 DAYS', data: data?.month },
  ]

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar active="/analytics/energy" />
      <div className="space-bg" style={{ padding: 24, paddingBottom: 60, flex: 1 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>🔋 Energy</h1>
            <p style={{ color: COLORS.faint, fontSize: 13 }}>Delivered energy and estimated revenue across your fleet</p>
          </div>
          <button onClick={handleDownloadReport} style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: COLORS.cyan, padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            📄 PDF Report
          </button>
        </div>

        {/* Period summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          {periods.map(p => (
            <div key={p.label} style={{ ...cardStyle, padding: 20 }}>
              <p style={{ fontSize: 10, color: COLORS.faint, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>{p.label}</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: COLORS.cyan, lineHeight: 1 }}>{p.data?.kwh ?? 0} kWh</p>
              <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 8 }}>{p.data?.sessions ?? 0} sessions</p>
              {(p.data?.revenue || 0) > 0 && (
                <p style={{ fontSize: 12, color: COLORS.amber, marginTop: 4 }}>
                  ~{data?.currency} {p.data?.revenue.toFixed(2)} est. revenue
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Trend chart */}
        <div style={{ ...cardStyle, padding: 24, marginBottom: 16 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>📈 Daily Energy — Last 14 Days</p>
          {data?.dailyTrend && data.dailyTrend.some(d => d.kwh > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.dailyTrend}>
                <defs>
                  <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke={COLORS.faint} tick={{ fill: COLORS.faint, fontSize: 10 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                <YAxis stroke={COLORS.faint} tick={{ fill: COLORS.faint, fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => [`${val} kWh`, 'Energy']}
                  labelFormatter={(d) => d ? new Date(d as string).toLocaleDateString() : ''}
                  contentStyle={{ background: '#0d1421', border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text }}
                />
                <Area type="monotone" dataKey="kwh" stroke={COLORS.cyan} fill="url(#energyGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: COLORS.faint, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
              No energy data yet. This fills in as charging sessions complete.
            </p>
          )}
        </div>

        {/* By charger breakdown */}
        <div style={{ ...cardStyle, padding: 24 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>⚡ By Charger — Last 30 Days</p>
          {data?.byCharger && data.byCharger.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {data.byCharger.map(c => (
                <div key={c.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0', borderBottom: `1px solid ${COLORS.border}`,
                }}>
                  <div>
                    <a href={`/chargers/${c.id}`} style={{ color: COLORS.cyan, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>{c.nickname}</a>
                    <p style={{ color: COLORS.faint, fontSize: 11, marginTop: 2 }}>{c.sessions} sessions</p>
                  </div>
                  <p style={{ color: COLORS.text, fontWeight: 700 }}>{c.kwh} kWh</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: COLORS.faint, fontSize: 13 }}>No sessions recorded in the last 30 days.</p>
          )}
        </div>

      </div>
      </div>
    </div>
  )
}
