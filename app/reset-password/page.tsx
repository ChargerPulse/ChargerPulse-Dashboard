'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [message, setMessage] = useState('')

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '12px 16px',
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: 16,
  }

  const handleReset = async () => {
    if (!password || !confirm) {
      setStatus('error')
      setMessage('Both fields are required.')
      return
    }
    if (password !== confirm) {
      setStatus('error')
      setMessage('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setStatus('error')
      setMessage('Password must be at least 6 characters.')
      return
    }
    setStatus('loading')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('success')
      setMessage('Password updated successfully! Redirecting...')
      setTimeout(() => { window.location.href = '/dashboard' }, 2000)
    }
  }

  return (
    <div className="space-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #00d4ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>⚡</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>ChargerPulse</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Set your new password</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 24, textAlign: 'center' }}>
            Reset Password
          </h2>

          {status === 'error' && (
            <div style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ color: '#ff4444', fontSize: 13 }}>❌ {message}</p>
            </div>
          )}

          {status === 'success' && (
            <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ color: '#00ff88', fontSize: 13 }}>✅ {message}</p>
            </div>
          )}

          <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>New Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            style={inputStyle}
          />

          <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && handleReset()}
          />

          <button
            onClick={handleReset}
            disabled={status === 'loading'}
            style={{
              width: '100%', padding: 14, borderRadius: 10, fontSize: 15,
              fontWeight: 800, cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              border: 'none', background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
              color: 'white', boxShadow: '0 0 20px rgba(0,212,255,0.3)', marginTop: 8,
            }}
          >
            {status === 'loading' ? '⏳ Updating...' : '🔐 Update Password'}
          </button>
        </div>

        <p style={{ textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 24 }}>
          🔒 Secured by Supabase Auth
        </p>
      </div>
    </div>
  )
}