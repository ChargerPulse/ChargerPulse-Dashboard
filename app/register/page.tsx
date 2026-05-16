'use client'

import { useState } from 'react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({ chargerId: '', nickname: '', location: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    if (!formData.chargerId || !formData.nickname) {
      setStatus('error')
      setMessage('Charger ID and Name are required.')
      return
    }
    setStatus('loading')
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(`Charger "${formData.nickname}" registered successfully!`)
        setFormData({ chargerId: '', nickname: '', location: '' })
      } else if (data.error === 'UPGRADE_REQUIRED') {
        setStatus('error')
        setMessage('You need a paid plan to add more chargers. Click Upgrade to subscribe!')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setMessage('Failed to connect to server.')
    }
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    padding: '12px 16px', color: '#e2e8f0', fontSize: 14,
    outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div className="space-bg" style={{ padding: 32 }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>Add Charger</h1>
            <p style={{ color: '#64748b' }}>Add a new EV charger to your monitoring fleet</p>
          </div>
          <a href="/dashboard" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
            Back to Dashboard
          </a>
        </div>

        <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h2 style={{ color: '#00d4ff', fontWeight: 700, marginBottom: 8, fontSize: 15 }}>OCPP Connection Details</h2>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: '#00d4ff', border: '1px solid rgba(0,212,255,0.15)' }}>
            wss://chargerpulse-1.onrender.com/YOUR_CHARGER_ID
          </div>
          <p style={{ color: '#64748b', fontSize: 11, marginTop: 8 }}>Replace YOUR_CHARGER_ID with the Charger ID below. Protocol: OCPP 1.6</p>
        </div>

        {status === 'success' && (
          <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <strong style={{ color: '#00ff88' }}>Charger Registered! {message}</strong>
          </div>
        )}

        {status === 'error' && (
          <div style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <strong style={{ color: '#ff4444' }}>Error: </strong>
            <span style={{ color: '#94a3b8' }}>{message}</span>
            {message.includes('paid plan') && (
              <div style={{ marginTop: 12 }}>
                <a href="/pricing" style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)', color: 'white', padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                  Upgrade Now
                </a>
              </div>
            )}
          </div>
        )}

        <div className="card" style={{ padding: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              Charger ID <span style={{ color: '#ff4444' }}>*</span>
            </label>
            <input type="text" value={formData.chargerId}
              onChange={e => setFormData({ ...formData, chargerId: e.target.value.trim() })}
              placeholder="e.g. CP-001 or DepotCharger1" style={inputStyle} />
            <p style={{ color: '#334155', fontSize: 11, marginTop: 6 }}>Must match exactly what your charger uses. No spaces.</p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              Charger Name <span style={{ color: '#ff4444' }}>*</span>
            </label>
            <input type="text" value={formData.nickname}
              onChange={e => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="e.g. Depot Bay 1" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Location</label>
            <input type="text" value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Johannesburg Depot, Gate 2" style={inputStyle} />
          </div>

          <button onClick={handleSubmit} disabled={status === 'loading'} style={{
            width: '100%', padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 800,
            cursor: status === 'loading' ? 'not-allowed' : 'pointer', border: 'none',
            background: status === 'loading' ? 'rgba(0,212,255,0.2)' : 'linear-gradient(135deg, #00d4ff, #a855f7)',
            color: 'white', boxShadow: '0 0 20px rgba(0,212,255,0.3)',
          }}>
            {status === 'loading' ? 'Registering...' : 'Register Charger'}
          </button>
        </div>

        <div className="card" style={{ padding: 28, marginTop: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>How to Connect Your Charger</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'Register your charger above with a unique ID',
              'Log into your charger admin panel',
              'Find the OCPP Central System URL setting',
              'Enter: wss://chargerpulse-1.onrender.com/YOUR_CHARGER_ID',
              'Set OCPP version to 1.6',
              'Save and restart your charger',
              'Your charger will appear on the dashboard within 60 seconds',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>{i + 1}</span>
                <p style={{ color: '#94a3b8', paddingTop: 4, fontSize: 14 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}