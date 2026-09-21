import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  if (request.headers.get('X-Internal-Api-Key') !== process.env.INTERNAL_API_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  if (!vapidPublicKey || !vapidPrivateKey) {
    return Response.json({ error: 'Push notifications are not configured.' }, { status: 501 })
  }
  webpush.setVapidDetails('mailto:senzoradebe999@gmail.com', vapidPublicKey, vapidPrivateKey)

  const body = await request.json()
  const { cpId, title, message, url } = body

  if (!cpId || !title || !message) {
    return Response.json({ error: 'cpId, title, and message are required.' }, { status: 400 })
  }

  const admin = getAdminClient()

  const { data: charger } = await admin
    .from('chargers')
    .select('user_id')
    .eq('id', cpId)
    .maybeSingle()

  if (!charger?.user_id) {
    // Unclaimed charger — no owner to notify. Not an error, just nothing to do.
    return Response.json({ sent: 0 })
  }

  const { data: subscriptions } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .eq('user_id', charger.user_id)

  if (!subscriptions || subscriptions.length === 0) {
    return Response.json({ sent: 0 })
  }

  let sent = 0
  const expiredIds: string[] = []

  await Promise.all(subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth_key },
        },
        JSON.stringify({ title, message, url: url || '/dashboard' })
      )
      sent += 1
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode
      // 404/410 mean the browser unsubscribed or the subscription expired —
      // clean it up rather than retrying it forever.
      if (statusCode === 404 || statusCode === 410) {
        expiredIds.push(sub.id)
      } else {
        console.error('Push send failed:', err)
      }
    }
  }))

  if (expiredIds.length > 0) {
    await admin.from('push_subscriptions').delete().in('id', expiredIds)
  }

  return Response.json({ sent, expired: expiredIds.length })
}
