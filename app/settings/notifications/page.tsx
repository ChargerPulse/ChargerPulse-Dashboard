'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../../../components/Sidebar'

const COLORS = { cyan: '#00d4ff', purple: '#a855f7', green: '#00ff88', red: '#ff4444', text: '#e2e8f0', muted: '#94a3b8', faint: '#64748b', border: 'rgba(255,255,255,0.08)' }

// Converts a VAPID public key (base64url) into the Uint8Array format the
// browser's PushManager API expects.
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function NotificationSettingsPage() {
  const [pushSupported, setPushSupported] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushSupported(false)
      return
    }
    navigator.serviceWorker.ready.then(async (registration) => {
      const existing = await registration.pushManager.getSubscription()
      setPushEnabled(!!existing)
    }).catch(() => {})
  }, [])

  const enablePush = async () => {
    setPushLoading(true)
    setPushError(null)
    try {
      if (Notification.permission === 'denied') {
        setPushError('Notifications are blocked for this site in your browser settings. Enable them there first.')
        setPushLoading(false)
        return
      }
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushError('Permission was not granted.')
        setPushLoading(false)
        return
      }

      const keyRes = await fetch('/api/push/vapid-public-key')
      const keyData = await keyRes.json()
      if (!keyRes.ok) {
        setPushError(keyData.error || 'Push notifications are not set up yet.')
        setPushLoading(false)
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      })

      if (res.ok) {
        setPushEnabled(true)
      } else {
        const data = await res.json()
        setPushError(data.error || 'Failed to save subscription.')
      }
    } catch {
      setPushError('Something went wrong enabling push notifications.')
    } finally {
      setPushLoading(false)
    }
  }

  const disablePush = async () => {
    setPushLoading(true)
    setPushError(null)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }
      setPushEnabled(false)
    } catch {
      setPushError('Something went wrong disabling push notifications.')
    } finally {
      setPushLoading(false)
    }
  }

  const cardStyle = {
    background: 'rgba(13,20,40,0.75)', border: `1px solid ${COLORS.border}`,
    borderRadius: 16, backdropFilter: 'blur(20px)' as const,
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar active="/settings/notifications" />
      <div className="space-bg" style={{ padding: 32, flex: 1 }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>Notifications</h1>
          <p style={{ color: COLORS.faint }}>Choose how you want to hear about charger alerts</p>
        </div>

        <div style={{ ...cardStyle, padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ color: COLORS.text, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>📱 Push Notifications</p>
              <p style={{ color: COLORS.faint, fontSize: 13 }}>Get an alert on this device the moment a charger goes down or recovers.</p>
            </div>
          </div>

          {!pushSupported ? (
            <p style={{ color: COLORS.faint, fontSize: 13 }}>Your browser doesn&apos;t support push notifications.</p>
          ) : (
            <>
              {pushError && <p style={{ color: COLORS.red, fontSize: 13, marginBottom: 12 }}>{pushError}</p>}
              <button
                onClick={pushEnabled ? disablePush : enablePush}
                disabled={pushLoading}
                style={{
                  padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none',
                  cursor: pushLoading ? 'not-allowed' : 'pointer',
                  background: pushEnabled ? 'rgba(255,68,68,0.1)' : 'linear-gradient(135deg, #00d4ff, #a855f7)',
                  color: pushEnabled ? COLORS.red : 'white',
                  boxShadow: pushEnabled ? 'none' : '0 0 20px rgba(0,212,255,0.3)',
                }}
              >
                {pushLoading ? 'Working...' : pushEnabled ? 'Disable push notifications' : 'Enable push notifications'}
              </button>
              {pushEnabled && (
                <p style={{ color: COLORS.green, fontSize: 12, marginTop: 10 }}>✅ Enabled on this device</p>
              )}
              <p style={{ color: COLORS.faint, fontSize: 11, marginTop: 14 }}>
                This is per-device — enabling it here only turns on notifications for this browser/phone. Email alerts keep working regardless.
              </p>
            </>
          )}
        </div>

      </div>
      </div>
    </div>
  )
}
