import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
const FROM_EMAIL = process.env.ALERT_FROM_EMAIL || 'senzoradebe999@gmail.com'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendWelcomeEmail(customerEmail: string, customerName: string, planName: string) {
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #020817; color: #e2e8f0;">
      <div style="background: linear-gradient(135deg, #00d4ff, #a855f7); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900;">⚡ Welcome to ChargerPulse!</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 16px;">Your EV chargers are now protected 24/7</p>
      </div>
      <div style="background: #0d1421; padding: 40px; border: 1px solid rgba(255,255,255,0.08);">
        <p style="font-size: 16px; color: #e2e8f0;">Hi ${customerName || 'there'}! 👋</p>
        <p style="color: #94a3b8; line-height: 1.7;">
          Thank you for subscribing to <strong style="color: #00d4ff;">ChargerPulse ${planName}</strong>!
          Your EV charging infrastructure is now being monitored 24/7.
        </p>
        <div style="background: rgba(0,212,255,0.06); border: 1px solid rgba(0,212,255,0.2); border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h2 style="color: #00d4ff; margin: 0 0 16px; font-size: 16px;">🚀 Get started in 3 steps:</h2>
          <p style="color: #94a3b8; margin: 0 0 8px;"><strong style="color: #e2e8f0;">1.</strong> Log into your dashboard: <a href="https://chargerpulse-dashboard.onrender.com/dashboard" style="color: #00d4ff;">chargerpulse-dashboard.onrender.com/dashboard</a></p>
          <p style="color: #94a3b8; margin: 0 0 8px;"><strong style="color: #e2e8f0;">2.</strong> Click <strong style="color: #00ff88;">+ ADD</strong> to register your charger</p>
          <p style="color: #94a3b8; margin: 0;"><strong style="color: #e2e8f0;">3.</strong> Point your charger to: <strong style="color: #00d4ff; font-family: monospace;">wss://chargerpulse-1.onrender.com/YOUR_ID</strong></p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://chargerpulse-dashboard.onrender.com/dashboard"
             style="background: linear-gradient(135deg, #00d4ff, #a855f7); color: white; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 15px; display: inline-block;">
            Go to My Dashboard →
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.7;">
          Need help? Just reply to this email — I personally read every message.<br/>
          <strong style="color: #e2e8f0;">Senzo Ngoyi</strong><br/>
          Founder, ChargerPulse
        </p>
      </div>
      <div style="background: #080c14; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: #334155; font-size: 12px; margin: 0;">
          ChargerPulse |
          <a href="https://chargerpulse-dashboard.onrender.com/terms" style="color: #334155;">Terms</a> |
          <a href="https://chargerpulse-dashboard.onrender.com/privacy" style="color: #334155;">Privacy</a>
        </p>
      </div>
    </div>
  `

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: customerEmail }] }],
      from: { email: FROM_EMAIL, name: 'Senzo from ChargerPulse' },
      subject: '⚡ Welcome to ChargerPulse — Your chargers are now protected!',
      content: [{ type: 'text/html', value: body }],
    }),
  })

  if (response.ok) {
    console.log(`✅ Welcome email sent to ${customerEmail}`)
  } else {
    console.error(`❌ Failed to send welcome email: ${response.status}`)
  }
}

async function recordSubscription(customerEmail: string, planName: string, customerId: string) {
  try {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email === customerEmail)

    if (user) {
      await supabaseAdmin.from('user_subscriptions').upsert({
        user_id: user.id,
        status: 'active',
        plan: planName,
        subscribed_at: new Date().toISOString(),
        lemon_squeezy_customer_id: customerId,
      })
      console.log(`✅ Subscription recorded for ${customerEmail}`)
    } else {
      console.log(`⚠️ No user found for ${customerEmail} — will activate on first login`)
    }
  } catch (err) {
    console.error('❌ Failed to record subscription:', err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-signature')

    if (WEBHOOK_SECRET && signature) {
      const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET)
      hmac.update(rawBody)
      const digest = hmac.digest('hex')
      if (digest !== signature) {
        return new Response('Unauthorized', { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody)
    const eventName = payload.meta?.event_name

    console.log(`📦 Webhook received: ${eventName}`)

    if (eventName === 'order_created' || eventName === 'subscription_created') {
      const customerEmail = payload.data?.attributes?.user_email ||
        payload.data?.attributes?.customer_email
      const customerName = payload.data?.attributes?.user_name ||
        payload.data?.attributes?.customer_name || ''
      const planName = payload.data?.attributes?.product_name ||
        payload.data?.attributes?.variant_name || 'Pro'
      const customerId = payload.data?.attributes?.customer_id?.toString() || ''

      if (customerEmail) {
        await sendWelcomeEmail(customerEmail, customerName, planName)
        await recordSubscription(customerEmail, planName, customerId)
      }
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Error', { status: 500 })
  }
}