'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../../../components/Sidebar'

export default function StatusPageSettings() {
  const [slug, setSlug] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/status-page')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSlug(data.slug || '')
          setDisplayName(data.display_name || '')
          setEnabled(data.enabled !== false)
        }
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/status-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, displayName, enabled }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage('Saved.')
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

  const publicUrl = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/status/${slug}` : ''

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar active="/settings/status-page" />
      <div className="space-bg" style={{ padding: 32, flex: 1 }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>Public Status Page</h1>
          <p style={{ color: '#64748b' }}>A shareable, no-login page showing your fleet's live health — great for demos and pitches</p>
        </div>

        {status === 'success' && (
          <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <span style={{ color: '#94a3b8' }}>{message}</span>
            {publicUrl && (
              <p style={{ marginTop: 8 }}>
                <a href={publicUrl} target="_blank" rel="noreferrer" style={{ color: '#00ff88', fontWeight: 700 }}>{publicUrl} →</a>
              </p>
            )}
          </div>
        )}
        {status === 'error' && (
          <div style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <strong style={{ color: '#ff4444' }}>Error: </strong>
            <span style={{ color: '#94a3b8' }}>{message}</span>
          </div>
        )}

        <div className="card" style={{ padding: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>URL Slug</label>
            <input type="text" value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase())}
              placeholder="e.g. chargerpulse-demo" style={inputStyle} />
            <p style={{ color: '#334155', fontSize: 11, marginTop: 6 }}>
              Lowercase letters, numbers, hyphens only. Your page: <span style={{ color: '#64748b' }}>/status/{slug || '...'}</span>
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Display Name</label>
            <input type="text" value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. ChargerPulse Durban Network" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)}
              style={{ width: 18, height: 18 }} />
            <label style={{ color: '#94a3b8', fontSize: 13 }}>Page is publicly visible</label>
          </div>

          <p style={{ color: '#334155', fontSize: 11, marginBottom: 24 }}>
            Shows aggregate charger count, live online count, 24h uptime, and approximate site locations on a map. No charger IDs, addresses, or customer details are ever shown publicly.
          </p>

          <button onClick={handleSubmit} disabled={status === 'loading' || !slug} style={{
            width: '100%', padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 800,
            cursor: (status === 'loading' || !slug) ? 'not-allowed' : 'pointer', border: 'none',
            background: (status === 'loading' || !slug) ? 'rgba(0,212,255,0.2)' : 'linear-gradient(135deg, #00d4ff, #a855f7)',
            color: 'white', boxShadow: '0 0 20px rgba(0,212,255,0.3)',
          }}>
            {status === 'loading' ? 'Saving...' : 'Save'}
          </button>
        </div>

      </div>
      </div>
    </div>
  )
}
