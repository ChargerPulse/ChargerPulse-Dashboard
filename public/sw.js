// Minimal service worker — its main job is satisfying the browser's
// installability requirement for "Add to Home Screen", not offline
// functionality. This is a live monitoring dashboard; caching charger
// status/energy data would mean showing stale, possibly wrong information
// when offline, which is worse than just not working offline at all.
//
// Static assets (icons, manifest) get a light cache since they never
// change; everything else always goes to the network.

const STATIC_CACHE = 'chargerpulse-static-v1'
const STATIC_ASSETS = ['/icon-192.png', '/icon-512.png', '/manifest.json']

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    )
  }
  // Everything else (pages, API calls) — no interception, straight to network.
})

self.addEventListener('push', (event) => {
  let data = { title: 'ChargerPulse', message: 'You have a new alert.', url: '/dashboard' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    // Non-JSON payload — fall back to the default text above.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.message,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
