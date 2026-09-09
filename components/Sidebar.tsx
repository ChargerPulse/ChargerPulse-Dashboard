'use client'

import { useState } from 'react'
import { createClient } from '../lib/supabase'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/sites', label: 'Sites & Map', icon: '🌍' },
  { href: '/analytics/energy', label: 'Energy', icon: '🔋' },
  { href: '/events', label: 'Events', icon: '⚡' },
  { href: '/alerts', label: 'Alerts', icon: '🚨' },
  { href: '/settings/tariff', label: 'Tariff', icon: '💰' },
  { href: '/settings/status-page', label: 'Public Status Page', icon: '🌐' },
]

export default function Sidebar({ active }: { active?: string }) {
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const linkStyle = (isActive: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderRadius: 10, textDecoration: 'none',
    fontSize: 14, fontWeight: 700,
    color: isActive ? '#00d4ff' : '#94a3b8',
    background: isActive ? 'rgba(0,212,255,0.1)' : 'transparent',
    border: isActive ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
  })

  const sidebarContent = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 16px 20px' }}>
        <span style={{ fontSize: 22 }}>⚡</span>
        <span style={{ fontWeight: 800, color: '#e2e8f0', fontSize: 16, letterSpacing: 1 }}>CHARGERPULSE</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <a key={item.href} href={item.href} style={linkStyle(active === item.href)} onClick={() => setOpen(false)}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <a href="/register" style={linkStyle(active === '/register')} onClick={() => setOpen(false)}>
          <span>➕</span><span>Add Charger</span>
        </a>
        <a href="/pricing" style={linkStyle(active === '/pricing')} onClick={() => setOpen(false)}>
          <span>⭐</span><span>Upgrade</span>
        </a>
        <button onClick={handleLogout} style={{
          ...linkStyle(false), border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444',
          background: 'rgba(255,68,68,0.08)', cursor: 'pointer', width: '100%', textAlign: 'left',
        }}>
          <span>🚪</span><span>Logout</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="sidebar-mobile-bar" style={{
        display: 'none', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,12,20,0.95)', backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <span style={{ fontWeight: 800, color: '#e2e8f0', fontSize: 14, letterSpacing: 1 }}>CHARGERPULSE</span>
        </div>
        <button onClick={() => setOpen(true)} style={{
          background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: 22, cursor: 'pointer', padding: 4,
        }}>☰</button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 49,
        }} />
      )}
      <div className={open ? 'sidebar-drawer sidebar-drawer-open' : 'sidebar-drawer'} style={{
        position: 'fixed', top: 0, left: open ? 0 : -280, height: '100vh', width: 260,
        background: '#0d1421', borderRight: '1px solid rgba(255,255,255,0.08)',
        padding: '20px 12px', display: 'flex', flexDirection: 'column',
        zIndex: 50, transition: 'left 0.2s ease',
      }}>
        {sidebarContent}
      </div>

      {/* Desktop persistent sidebar */}
      <div className="sidebar-desktop" style={{
        width: 240, minHeight: '100vh', background: 'rgba(13,20,40,0.5)',
        borderRight: '1px solid rgba(255,255,255,0.08)', padding: '24px 12px',
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0,
      }}>
        {sidebarContent}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile-bar { display: flex !important; }
        }
        @media (min-width: 901px) {
          .sidebar-drawer { display: none !important; }
        }
      `}</style>
    </>
  )
}
