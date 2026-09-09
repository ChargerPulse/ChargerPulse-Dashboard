'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'

interface Site { lat: number; lng: number; name: string }

export default function StatusMap({ sites }: { sites: Site[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!containerRef.current || sites.length === 0) return
    let cancelled = false

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, { scrollWheelZoom: false })
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
      for (const site of sites) {
        L.marker([site.lat, site.lng], { icon: markerIcon }).addTo(map)
        bounds.extend([site.lat, site.lng])
      }

      if (sites.length === 1) {
        map.setView([sites[0].lat, sites[0].lng], 12)
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
  }, [sites])

  return (
    <div
      ref={containerRef}
      style={{ height: 280, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}
    />
  )
}
