import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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

    // Check subscription status
    const { data: subscription } = await getAdminClient()
      .from('user_subscriptions')
      .select('status, trial_ends_at, plan')
      .eq('user_id', user.id)
      .single()

    const now = new Date()
    const isActive = subscription?.status === 'active'
    const isTrial = subscription?.status === 'trial' &&
      subscription?.trial_ends_at &&
      new Date(subscription.trial_ends_at) > now
    const hasAccess = isActive || isTrial

    // Check if this is their first charger (free trial)
    const { count } = await getAdminClient()
      .from('chargers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count || 0) >= 1 && !hasAccess) {

    // Allow first charger for free (trial)
    // Block if no subscription and already has chargers
    if (!hasAccess && (count || 0) >= 1) {
      return Response.json({
        error: 'UPGRADE_REQUIRED',
        message: 'Upgrade to a paid plan to add more chargers.',
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

    // Create trial subscription on first charger registration
    if (!subscription) {
      await getAdminClient().from('user_subscriptions').insert({
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