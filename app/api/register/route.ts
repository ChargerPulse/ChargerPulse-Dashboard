import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getPlanLimit(plan: string | null, status: string | null): number {
  if (status === 'active') {
    const p = (plan || '').toLowerCase()
    if (p.includes('enterprise') || p.includes('unlimited')) return 999
    if (p.includes('plus')) return 5
    if (p.includes('pro')) return 1
    return 1
  }
  if (status === 'trial') return 1
  return 0
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = getAdminClient()

    const { data: subscription } = await admin
      .from('user_subscriptions')
      .select('status, trial_ends_at, plan')
      .eq('user_id', user.id)
      .single()

    const now = new Date()
    const isActive = subscription?.status === 'active'
    const isTrial = subscription?.status === 'trial' &&
      subscription?.trial_ends_at &&
      new Date(subscription.trial_ends_at) > now
    const isExpired = subscription?.status === 'trial' &&
      subscription?.trial_ends_at &&
      new Date(subscription.trial_ends_at) <= now

    const { count } = await admin
      .from('chargers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const chargerCount = count || 0
    const planLimit = getPlanLimit(
      subscription?.plan || null,
      isActive ? 'active' : isTrial ? 'trial' : 'none'
    )

    if (isExpired) {
      return Response.json({
        error: 'UPGRADE_REQUIRED',
        message: 'Your free trial has expired. Upgrade to continue monitoring your chargers.',
      }, { status: 403 })
    }

    if (!isActive && !isTrial && chargerCount >= 1) {
      return Response.json({
        error: 'UPGRADE_REQUIRED',
        message: 'Upgrade to a paid plan to add chargers.',
      }, { status: 403 })
    }

    if (chargerCount >= planLimit) {
      const planName = subscription?.plan || 'your current plan'
      return Response.json({
        error: 'UPGRADE_REQUIRED',
        message: chargerCount >= 1
          ? `You have reached the limit of ${planLimit} charger${planLimit > 1 ? 's' : ''} on ${planName}. Upgrade to add more!`
          : 'Upgrade to a paid plan to add chargers.',
      }, { status: 403 })
    }

    const { chargerId, nickname, location } = await request.json()

    if (!chargerId || !nickname) {
      return Response.json({ error: 'Charger ID and Name are required' }, { status: 400 })
    }

    if (chargerId.includes(' ')) {
      return Response.json({ error: 'Charger ID cannot contain spaces' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('chargers')
      .select('id')
      .eq('id', chargerId)
      .single()

    if (existing) {
      return Response.json({ error: 'A charger with this ID already exists' }, { status: 409 })
    }

    const { error } = await supabase
      .from('chargers')
      .insert({ id: chargerId, nickname, location: location || null, user_id: user.id })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    if (!subscription) {
      await admin.from('user_subscriptions').insert({
        user_id: user.id,
        status: 'trial',
        trial_ends_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    return Response.json({ success: true, chargerId, nickname })
  } catch (err) {
    console.error('Register error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}