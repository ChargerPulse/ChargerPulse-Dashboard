'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChargerDetail {
  charger: {
    id: string
    nickname: string
    location: string
    created_at: string
  }
  liveStatus: string | null
  activeTransactionId: number | null
  uptime24h: number
  uptime7d: number
  uptime30d: number
  recentEvents: Array<{
    id: number
    status: string
    ts: string
    connector_id: number
  }>
  alerts: Array<{
    id: number
    triggered_at: string
    resolved_at: string | null
    resolved: boolean
  }>
}

type CommandAction = 'RemoteStartTransaction' | 'RemoteStopTransaction' | 'Reset' | 'UnlockConnector'

const COLORS = {
  cyan: '#00d4ff',
  purple: '#a855f7',
  green: '#00ff88',
  red: '#ff4444',
  amber: '#f59e0b',
  text: '#e2e8f0',
  muted: '#94a3b8',
  faint: '#64748b',
  border: 'rgba(255,255,255,0.08)',
}

export default function ChargerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [data, setData] = useState<ChargerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [chargerId, setChargerId] = useState('')
  const [pendingAction, setPendingAction] = useState<CommandAction | null>(null)
  const [commandMessage, setCommandMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const refresh = (id: string) => {
    fetch(`/api/chargers/${id}`)
      .then(res => res.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    params.then(({ id }) => {
      setChargerId(id)
      refresh(id)
    })
  }, [params])

  const runCommand = async (action: CommandAction, payload: Record<string, unknown>, confirmText: string) => {
    if (!window.confirm(confirmText)) return

    setPendingAction(action)
    setCommandMessage(null)
    try {
      const res = await fetch(`/api/chargers/${chargerId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      })
      const result = await res.json()

      if (result.status === 'accepted') {
        setCommandMessage({ type: 'success', text: `${action} accepted by the charger.` })
      } else if (result.status === 'rejected') {
        setCommandMessage({ type: 'error', text: `${action} was rejected by the charger.` })
      } else if (result.status === 'not_connected') {
        setCommandMessage({ type: 'error', text: 'Charger is not currently connected.' })
      } else if (result.status === 'timeout') {
        setCommandMessage({ type: 'error', text: 'Charger did not respond in time.' })
      } else {
        setCommandMessage({ type: 'error', text: result.error || 'Something went wrong.' })
      }
      refresh(chargerId)
    } catch {
      setCommandMessage({ type: 'error', text: 'Failed to reach the server.' })
    } finally {
      setPendingAction(null)
    }
  }

  const isOnline = data?.liveStatus && data.liveStatus !== 'offline'
  const isCharging = data?.liveStatus === 'charging'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return COLORS.green
      case 'Occupied':
      case 'Charging': return COLORS.cyan
      case 'Faulted': return COLORS.red
      case 'Unavailable': return COLORS.amber
      default: return COLORS.faint
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available': return '✅'
      case 'Occupied':
      case 'Charging': return '⚡'
      case 'Faulted': return '🚨'
      case 'Unavailable': return '⚠️'
      default: return '💤'
    }
  }

  const cardStyle = {
    background: 'rgba(13,20,40,0.75)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    backdropFilter: 'blur(20px)' as const,
  }

  const sectionTitleStyle = {
    fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 8,
  }

  if (loading) {
    return (
      <div className="space-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: COLORS.muted, fontSize: 18 }}>Loading charger data...</p>
      </div>
    )
  }

  if (!data || !data.charger) {
    return (
      <div className="space-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: COLORS.muted, fontSize: 18, marginBottom: 16 }}>Charger not found</p>
          <a href="/dashboard" style={{ color: COLORS.cyan }}>Back to Dashboard</a>
        </div>
      </div>
    )
  }

  const chartData = [
    { period: '24h', uptime: data.uptime24h },
    { period: '7d', uptime: data.uptime7d },
    { period: '30d', uptime: data.uptime30d },
  ]

  const activeAlert = data.alerts.find(a => !a.resolved)

  const commandButtonStyle = (color: string, disabled: boolean) => ({
    padding: '14px 12px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 800,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? 'rgba(255,255,255,0.04)' : `${color}18`,
    color: disabled ? COLORS.faint : color,
    boxShadow: disabled ? 'none' : `0 0 0 1px ${color}40 inset`,
  })

  return (
    <div className="space-bg" style={{ padding: 24, paddingBottom: 60 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>
              ⚡ {data.charger.nickname}
            </h1>
            <p style={{ color: COLORS.faint, fontFamily: 'monospace', fontSize: 13, letterSpacing: 1 }}>{data.charger.id}</p>
          </div>
          <a href="/dashboard" style={{
            background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
            color: COLORS.cyan, padding: '10px 20px', borderRadius: 10,
            textDecoration: 'none', fontWeight: 700, fontSize: 13,
          }}>
            ← Dashboard
          </a>
        </div>

        {/* Active alert banner */}
        {activeAlert && (
          <div style={{
            background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)',
            borderRadius: 12, padding: '14px 18px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>🚨</span>
            <div>
              <strong style={{ color: COLORS.red }}>This charger is currently DOWN</strong>
              <p style={{ color: COLORS.muted, fontSize: 13, marginTop: 2 }}>
                Alert triggered at {new Date(activeAlert.triggered_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Remote command result banner */}
        {commandMessage && (
          <div style={{
            background: commandMessage.type === 'success' ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,68,0.08)',
            border: `1px solid ${commandMessage.type === 'success' ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,68,0.3)'}`,
            borderRadius: 12, padding: '14px 18px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 18 }}>{commandMessage.type === 'success' ? '✅' : '⚠️'}</span>
            <p style={{ color: COLORS.muted, fontSize: 14 }}>{commandMessage.text}</p>
          </div>
        )}

        {/* Remote Commands */}
        <div style={{ ...cardStyle, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <p style={sectionTitleStyle}>🎛️ Remote Commands</p>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: '4px 10px', borderRadius: 20,
              background: isOnline ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.04)',
              color: isOnline ? COLORS.green : COLORS.faint,
              border: `1px solid ${isOnline ? 'rgba(0,255,136,0.3)' : COLORS.border}`,
            }}>
              {isOnline ? '● CONNECTED' : '○ NOT CONNECTED'}
            </span>
          </div>

          {!isOnline && (
            <p style={{ color: COLORS.faint, fontSize: 13, marginBottom: 16 }}>
              Commands are disabled while this charger isn&apos;t connected.
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 16 }}>
            <button
              disabled={!isOnline || isCharging || pendingAction !== null}
              onClick={() => runCommand(
                'RemoteStartTransaction',
                { connectorId: 1, idTag: 'REMOTESTART' },
                'Start a charging session on this charger now?'
              )}
              style={commandButtonStyle(COLORS.green, !isOnline || isCharging || pendingAction !== null)}
            >
              {pendingAction === 'RemoteStartTransaction' ? 'Starting…' : '▶ Start'}
            </button>

            <button
              disabled={!isOnline || !isCharging || pendingAction !== null || data?.activeTransactionId == null}
              onClick={() => runCommand(
                'RemoteStopTransaction',
                { transactionId: data?.activeTransactionId },
                'Stop the current charging session? This will interrupt the vehicle currently charging.'
              )}
              style={commandButtonStyle(COLORS.red, !isOnline || !isCharging || pendingAction !== null || data?.activeTransactionId == null)}
            >
              {pendingAction === 'RemoteStopTransaction' ? 'Stopping…' : '■ Stop'}
            </button>

            <button
              disabled={!isOnline || pendingAction !== null}
              onClick={() => runCommand(
                'Reset',
                { type: 'Soft' },
                isCharging
                  ? 'This charger has an active charging session. Resetting it now will interrupt that session. Continue?'
                  : 'Reboot this charger (soft reset)?'
              )}
              style={commandButtonStyle(COLORS.amber, !isOnline || pendingAction !== null)}
            >
              {pendingAction === 'Reset' ? 'Resetting…' : '⟳ Reset'}
            </button>

            <button
              disabled={!isOnline || pendingAction !== null}
              onClick={() => runCommand(
                'UnlockConnector',
                { connectorId: 1 },
                'Unlock this charger\'s connector?'
              )}
              style={commandButtonStyle(COLORS.cyan, !isOnline || pendingAction !== null)}
            >
              {pendingAction === 'UnlockConnector' ? 'Unlocking…' : '🔓 Unlock'}
            </button>
          </div>
        </div>

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
          <div style={{ ...cardStyle, padding: '18px 20px' }}>
            <p style={{ color: COLORS.faint, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Location</p>
            <p style={{ color: COLORS.text, fontWeight: 700 }}>{data.charger.location || 'Not set'}</p>
          </div>
          <div style={{ ...cardStyle, padding: '18px 20px' }}>
            <p style={{ color: COLORS.faint, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>24h Uptime</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: data.uptime24h >= 95 ? COLORS.green : COLORS.amber }}>
              {data.uptime24h}%
            </p>
          </div>
          <div style={{ ...cardStyle, padding: '18px 20px' }}>
            <p style={{ color: COLORS.faint, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>7d Uptime</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: data.uptime7d >= 95 ? COLORS.green : COLORS.amber }}>
              {data.uptime7d}%
            </p>
          </div>
          <div style={{ ...cardStyle, padding: '18px 20px' }}>
            <p style={{ color: COLORS.faint, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>30d Uptime</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: data.uptime30d >= 95 ? COLORS.green : COLORS.amber }}>
              {data.uptime30d}%
            </p>
          </div>
        </div>

        {/* Uptime chart */}
        <div style={{ ...cardStyle, padding: 24, marginBottom: 16 }}>
          <p style={sectionTitleStyle}>📊 Uptime by Period</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="period" stroke={COLORS.faint} tick={{ fill: COLORS.faint, fontSize: 12 }} />
              <YAxis domain={[0, 100]} stroke={COLORS.faint} tick={{ fill: COLORS.faint, fontSize: 12 }} />
              <Tooltip
                formatter={(val) => `${val}%`}
                contentStyle={{ background: '#0d1421', border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text }}
              />
              <Bar dataKey="uptime" fill={COLORS.cyan} radius={[4, 4, 0, 0]} name="Uptime %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>

          {/* Recent Events */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <p style={sectionTitleStyle}>📋 Recent Events</p>
            {data.recentEvents.length === 0 ? (
              <p style={{ color: COLORS.faint, fontSize: 14 }}>No events yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }}>
                {data.recentEvents.map(event => (
                  <div key={event.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: `1px solid ${COLORS.border}`,
                  }}>
                    <div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                        background: `${getStatusColor(event.status)}18`, color: getStatusColor(event.status),
                      }}>
                        {getStatusIcon(event.status)} {event.status}
                      </span>
                      <p style={{ color: COLORS.faint, fontSize: 11, marginTop: 4 }}>Connector #{event.connector_id}</p>
                    </div>
                    <p style={{ color: COLORS.faint, fontSize: 11 }}>{new Date(event.ts).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alert History */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <p style={sectionTitleStyle}>🚨 Alert History</p>
            {data.alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ color: COLORS.green, fontWeight: 700 }}>✅ No alerts ever!</p>
                <p style={{ color: COLORS.faint, fontSize: 13, marginTop: 4 }}>This charger has been reliable.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }}>
                {data.alerts.map(alert => (
                  <div key={alert.id} style={{ padding: '10px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                        background: alert.resolved ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)',
                        color: alert.resolved ? COLORS.green : COLORS.red,
                      }}>
                        {alert.resolved ? '✅ Resolved' : '🚨 Active'}
                      </span>
                      <p style={{ color: COLORS.faint, fontSize: 11 }}>
                        {new Date(alert.triggered_at).toLocaleString()}
                      </p>
                    </div>
                    {alert.resolved_at && (
                      <p style={{ color: COLORS.faint, fontSize: 11, marginTop: 4 }}>
                        Resolved: {new Date(alert.resolved_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
