'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

const SiteMap = dynamic(() => import('./SiteMap'), { ssr: false })

interface Site {
  id: string
  name: string
  lat: number | null
  lng: number | null
  address: string | null
  chargerCount: number
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ name: '', address: '', lat: '', lng: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/sites')
      const data = await res.json()
      if (Array.isArray(data)) setSites(data)
    } catch (err) {
      console.error('Fetch failed:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchSites() }, [])

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setStatus('error')
      setMessage('Site name is required.')
      return
    }
    setStatus('loading')
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(`Site "${formData.name}" added.`)
        setFormData({ name: '', address: '', lat: '', lng: '' })
        fetchSites()
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
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>Sites</h1>
            <p style={{ color: '#64748b' }}>Group chargers by physical location</p>
          </div>
          <a href="/dashboard" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
            Back to Dashboard
          </a>
        </div>

        {status === 'success' && (
          <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <strong style={{ color: '#00ff88' }}>Site Added: </strong>
            <span style={{ color: '#94a3b8' }}>{message}</span>
          </div>
        )}

        {status === 'error' && (
          <div style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <strong style={{ color: '#ff4444' }}>Error: </strong>
            <span style={{ color: '#94a3b8' }}>{message}</span>
          </div>
        )}

        <div className="card" style={{ padding: 32, marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>Add a Site</h2>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Site Name <span style={{ color: '#ff4444' }}>*</span></label>
            <input type="text" value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Durban Depot" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Address</label>
            <input type="text" value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 12 Point Road, Durban" style={inputStyle} />
          </div>

          <div className="grid-2" style={{ marginBottom: 8 }}>
            <div>
              <label style={labelStyle}>Latitude</label>
              <input type="text" value={formData.lat}
                onChange={e => setFormData({ ...formData, lat: e.target.value })}
                placeholder="e.g. -29.8587" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Longitude</label>
              <input type="text" value={formData.lng}
                onChange={e => setFormData({ ...formData, lng: e.target.value })}
                placeholder="e.g. 31.0218" style={inputStyle} />
            </div>
          </div>
          <p style={{ color: '#334155', fontSize: 11, marginBottom: 24 }}>
            Optional — add coordinates now to place this site on the fleet map later. Find them by long-pressing a location in Google Maps.
          </p>

          <button onClick={handleSubmit} disabled={status === 'loading'} style={{
            width: '100%', padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 800,
            cursor: status === 'loading' ? 'not-allowed' : 'pointer', border: 'none',
            background: status === 'loading' ? 'rgba(0,212,255,0.2)' : 'linear-gradient(135deg, #00d4ff, #a855f7)',
            color: 'white', boxShadow: '0 0 20px rgba(0,212,255,0.3)',
          }}>
            {status === 'loading' ? 'Adding...' : 'Add Site'}
          </button>
        </div>

        <div className="card" style={{ padding: 28, marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>Fleet Map</h2>
          <SiteMap sites={sites} />
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>Your Sites</h2>

          {loading ? (
            <p style={{ color: '#64748b' }}>Loading...</p>
          ) : sites.length === 0 ? (
            <p style={{ color: '#64748b' }}>No sites yet. Add one above to start grouping chargers by location.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sites.map(site => (
                <div key={site.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div>
                    <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{site.name}</p>
                    <p style={{ color: '#64748b', fontSize: 13 }}>
                      {site.address || 'No address set'}
                      {site.lat !== null && site.lng !== null && (
                        <span style={{ color: '#334155' }}> · {site.lat.toFixed(4)}, {site.lng.toFixed(4)}</span>
                      )}
                    </p>
                  </div>
                  <span style={{
                    background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
                    color: '#00d4ff', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  }}>
                    {site.chargerCount} {site.chargerCount === 1 ? 'charger' : 'chargers'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
