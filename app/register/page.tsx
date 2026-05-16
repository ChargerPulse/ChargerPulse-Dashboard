'use client'

import { useState } from 'react'

export default function RegisterPage() {
  const [form, setForm] = useState({ chargerId: '', nickname: '', location: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    padding: '12px 16px', color: '#e2e8f0', fontSize: 14,
    outline: 'none', boxSizing: 'border-box' as const,
  }

  const submit = async () => {
    if (!form.chargerId || !form.nickname) {
      setStatus('error'); setMessage('Charger ID and Name are required.'); return
    }
    setStatus('loading')
    try {
      const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
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
      } }
  }

  return (
    <div className="space-bg" style={{ padding: '32px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>➕ Register Charger</h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>Add a new EV charger to your monitoring fleet</p>
          </div>
          <a href="/" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
            ← Dashboard
          </a>
        </div>

        {/* OCPP info */}
        <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h2 style={{ color: '#00d4ff', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>📡 OCPP Connection Details</h2>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: '#00d4ff', border: '1px solid rgba(0,212,255,0.15)' }}>
            wss://chargerpulse-1.onrender.com/YOUR_CHARGER_ID
          </div>
          <p style={{ color: '#64748b', fontSize: 11, marginTop: 8 }}>Replace YOUR_CHARGER_ID with the ID below. Protocol: OCPP 1.6</p>
        </div>

        {status === 'success' && (
          <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <strong style={{ color: '#00ff88' }}>✅ {message}</strong>
          </div>
        )}
        {status === 'error' && (
          <div style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <strong style={{ color: '#ff4444' }}>❌ {message}</strong>
          </div>
        )}

        {/* Form */}
        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          {[
            { label: 'Charger ID', key: 'chargerId', placeholder: 'e.g. CP-001 or DepotCharger1', hint: 'Must match exactly what your charger uses. No spaces.' },
            { label: 'Charger Name', key: 'nickname', placeholder: 'e.g. Depot Bay 1', hint: '' },
            { label: 'Location', key: 'location', placeholder: 'e.g. Johannesburg Depot, Gate 2', hint: '' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                {f.label}{f.key !== 'location' && <span style={{ color: '#ff4444' }}> *</span>}
              </label>
              <input type="text" value={form[f.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder} style={inputStyle} />
              {f.hint && <p style={{ color: '#475569', fontSize: 11, marginTop: 6 }}>{f.hint}</p>}
            </div>
          ))}
          <button onClick={submit} disabled={status === 'loading'} style={{
            width: '100%', padding: 14, borderRadius: 10, fontSize: 14, fontWeight: 800,
            cursor: status === 'loading' ? 'not-allowed' : 'pointer', border: 'none',
            background: 'linear-gradient(135deg, #00d4ff, #a855f7)', color: 'white',
            boxShadow: '0 0 20px rgba(0,212,255,0.3)',
          }}>
            {status === 'loading' ? '⏳ Registering...' : '➕ Register Charger'}
          </button>
        </div>

        {/* Steps */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>📋 How to Connect Your Charger</h2>
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
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>{i + 1}</span>
                <p style={{ color: '#94a3b8', paddingTop: 3, fontSize: 13 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}