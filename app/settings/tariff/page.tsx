'use client'

import { useState, useEffect } from 'react'

export default function TariffSettingsPage() {
  const [pricePerKwh, setPricePerKwh] = useState('')
  const [currency, setCurrency] = useState('ZAR')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/tariff')
      .then(res => res.json())
      .then(data => {
        if (data.price_per_kwh) setPricePerKwh(data.price_per_kwh.toString())
        if (data.currency) setCurrency(data.currency)
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/tariff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricePerKwh, currency }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(`Tariff set to ${data.currency} ${data.price_per_kwh}/kWh.`)
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

  const labelStyle = {
    display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 700,
    letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 8,
  }

  return (
    <div className="space-bg" style={{ padding: 32 }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>Tariff</h1>
            <p style={{ color: '#64748b' }}>Set your price per kWh to enable revenue estimates</p>
          </div>
          <a href="/dashboard" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
            ← Dashboard
          </a>
        </div>

        {status === 'success' && (
          <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <span style={{ color: '#94a3b8' }}>{message}</span>
          </div>
        )}
        {status === 'error' && (
          <div style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <strong style={{ color: '#ff4444' }}>Error: </strong>
            <span style={{ color: '#94a3b8' }}>{message}</span>
          </div>
        )}

        <div className="card" style={{ padding: 32 }}>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Price per kWh</label>
              <input type="number" step="0.01" min="0" value={pricePerKwh}
                onChange={e => setPricePerKwh(e.target.value)}
                placeholder="e.g. 3.50" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Currency</label>
              <input type="text" value={currency}
                onChange={e => setCurrency(e.target.value.toUpperCase())}
                placeholder="ZAR" maxLength={3} style={inputStyle} />
            </div>
          </div>

          <p style={{ color: '#334155', fontSize: 12, marginBottom: 24 }}>
            This applies a single flat rate across your whole fleet. Revenue shown on the dashboard is an estimate (energy delivered × price), not a real billing/invoicing system.
          </p>

          <button onClick={handleSubmit} disabled={status === 'loading'} style={{
            width: '100%', padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 800,
            cursor: status === 'loading' ? 'not-allowed' : 'pointer', border: 'none',
            background: status === 'loading' ? 'rgba(245,158,11,0.2)' : 'linear-gradient(135deg, #f59e0b, #a855f7)',
            color: 'white', boxShadow: '0 0 20px rgba(245,158,11,0.3)',
          }}>
            {status === 'loading' ? 'Saving...' : 'Save Tariff'}
          </button>
        </div>

      </div>
    </div>
  )
}
