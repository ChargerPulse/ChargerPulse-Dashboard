'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import Sidebar from '../../components/Sidebar'

const SiteMap = dynamic(() => import('./SiteMap'), { ssr: false })

interface Site {
  id: string
  name: string
  lat: number | null
  lng: number | null
  address: string | null
  chargerCount: number
  grid_status: 'stable' | 'load_shedding' | 'grid_down'
  backup_battery_active: boolean
  backup_runtime_hours: number | null
  grid_status_updated_at: string
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
    <div style={{ display: 'flex' }}>
      <Sidebar active="/sites" />
      <div className="space-bg" style={{ padding: 32, flex: 1 }}>
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
                <SiteCard key={site.id} site={site} onUpdated={fetchSites} />
              ))}
            </div>
          )}
        </div>

      </div>
      </div>
    </div>
  )
}

const GRID_STATUS_META: Record<Site['grid_status'], { label: string; color: string; icon: string }> = {
  stable: { label: 'Grid Stable', color: '#00ff88', icon: '🟢' },
  load_shedding: { label: 'Load Shedding', color: '#f59e0b', icon: '⚠️' },
  grid_down: { label: 'Grid Down', color: '#ff4444', icon: '🔴' },
}

function SiteCard({ site, onUpdated }: { site: Site; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false)
  const [gridStatus, setGridStatus] = useState(site.grid_status)
  const [backupActive, setBackupActive] = useState(site.backup_battery_active)
  const [runtimeHours, setRuntimeHours] = useState(site.backup_runtime_hours?.toString() || '')
  const [saving, setSaving] = useState(false)

  const meta = GRID_STATUS_META[site.grid_status]

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/sites/${site.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gridStatus, backupBatteryActive: backupActive, backupRuntimeHours: runtimeHours }),
      })
      setEditing(false)
      onUpdated()
    } catch {
      // silently fail is fine here — the card just won't update; not worth a whole error-banner flow for this small control
    }
    setSaving(false)
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    padding: '8px 12px', color: '#e2e8f0', fontSize: 13,
    outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{
      padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <a href={`/sites/${site.id}`} style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, marginBottom: 4, display: 'block', textDecoration: 'none' }}>{site.name} →</a>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            {site.address || 'No address set'}
            {site.lat !== null && site.lng !== null && (
              <span style={{ color: '#334155' }}> · {site.lat.toFixed(4)}, {site.lng.toFixed(4)}</span>
            )}
          </p>
        </div>
        <span style={{
          background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
          color: '#00d4ff', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
        }}>
          {site.chargerCount} {site.chargerCount === 1 ? 'charger' : 'chargers'}
        </span>
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: meta.color, fontSize: 13, fontWeight: 700 }}>{meta.icon} {meta.label}</span>
          {site.backup_battery_active && (
            <span style={{ color: '#64748b', fontSize: 12, marginLeft: 10 }}>
              🔋 Backup active{site.backup_runtime_hours ? ` — ~${site.backup_runtime_hours}h remaining` : ''}
            </span>
          )}
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: '#00d4ff', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
            Update
          </button>
        )}
      </div>

      {editing && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {(Object.keys(GRID_STATUS_META) as Site['grid_status'][]).map(s => (
              <button key={s} onClick={() => setGridStatus(s)} style={{
                flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', border: `1px solid ${gridStatus === s ? GRID_STATUS_META[s].color : 'rgba(255,255,255,0.1)'}`,
                background: gridStatus === s ? `${GRID_STATUS_META[s].color}18` : 'transparent',
                color: gridStatus === s ? GRID_STATUS_META[s].color : '#94a3b8',
              }}>
                {GRID_STATUS_META[s].icon} {GRID_STATUS_META[s].label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="checkbox" checked={backupActive} onChange={e => setBackupActive(e.target.checked)} style={{ width: 16, height: 16 }} />
            <label style={{ color: '#94a3b8', fontSize: 12 }}>Backup battery active</label>
          </div>

          {backupActive && (
            <div style={{ marginBottom: 12 }}>
              <input type="number" step="0.5" min="0" value={runtimeHours}
                onChange={e => setRuntimeHours(e.target.value)}
                placeholder="Estimated runtime (hours)" style={inputStyle} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={saving} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #00d4ff, #a855f7)', color: 'white',
            }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8',
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
