'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'

interface Site {
  id: string
  name: string
  lat: number | null
  lng: number | null
  address: string | null
  chargerCount: number
}

export default function SiteMap({ sites }: { sites: Site[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  const located = sites.filter(s => s.lat !== null && s.lng !== null)

  useEffect(() => {
    if (!containerRef.current || located.length === 0) return

    let cancelled = false

    // Leaflet touches `window` on import, so it must load client-side only —
    // a static import would break the server-rendered build.
    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return

      // Guards against React 18 strict-mode double-invoking this effect in
      // dev, which would otherwise try to init Leaflet on the same DOM node
      // twice and throw.
      if (mapRef.current) return

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
      })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      const markerIcon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#00d4ff;border:2px solid white;box-shadow:0 0 8px rgba(0,212,255,0.6);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      const bounds = L.latLngBounds([])
      for (const site of located) {
        const marker = L.marker([site.lat as number, site.lng as number], { icon: markerIcon }).addTo(map)
        marker.bindPopup(
          `<strong>${escapeHtml(site.name)}</strong><br/>${site.chargerCount} ${site.chargerCount === 1 ? 'charger' : 'chargers'}${site.address ? `<br/>${escapeHtml(site.address)}` : ''}`
        )
        bounds.extend([site.lat as number, site.lng as number])
      }

      if (located.length === 1) {
        map.setView([located[0].lat as number, located[0].lng as number], 13)
      } else {
        map.fitBounds(bounds, { padding: [30, 30] })
      }
    })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [located.length])

  if (located.length === 0) {
    return (
      <div style={{
        padding: 40, textAlign: 'center', color: '#64748b',
        border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12,
      }}>
        Add latitude/longitude to a site above to see it here.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}
    />
  )
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
