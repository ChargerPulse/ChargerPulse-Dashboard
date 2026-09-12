import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { calculateRisk } from '@/lib/risk'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Explicit ownership check, not just reliance on RLS — this is the
    // caller's own record, or nothing.
    const { data: charger, error: chargerError } = await supabase
      .from('chargers')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (chargerError || !charger) {
      return Response.json({ error: 'Charger not found' }, { status: 404 })
    }

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('cp_id', id)
      .order('ts', { ascending: false })
      .limit(50)

    const { data: alerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('cp_id', id)
      .order('triggered_at', { ascending: false })

    const { data: statusRows } = await supabase
      .from('charger_status')
      .select('connector_id, status, updated_at')
      .eq('cp_id', id)
      .order('connector_id', { ascending: true })

    // Same priority as the list view: a fault anywhere is the most
    // attention-worthy thing to surface as the single "overall" status.
    const STATUS_PRIORITY: Record<string, number> = { faulted: 3, charging: 2, available: 1, offline: 0 }
    let liveStatus: string | null = null
    for (const r of statusRows || []) {
      if (!liveStatus || STATUS_PRIORITY[r.status] > STATUS_PRIORITY[liveStatus]) {
        liveStatus = r.status
      }
    }

    // Per-connector — with multiple connectors, more than one session can
    // be active simultaneously. Returning only the single most recent one
    // (regardless of which connector) would let Stop target the wrong
    // connector's session.
    const { data: activeSessions } = await supabase
      .from('sessions')
      .select('connector_id, ocpp_transaction_id')
      .eq('cp_id', id)
      .is('stopped_at', null)
      .order('started_at', { ascending: false })

    const calcUptime = (since: Date) => {
      const filtered = (events || []).filter(e => new Date(e.ts) > since)
      if (filtered.length === 0) return 0
      const available = filtered.filter(e => e.status === 'Available').length
      return parseFloat(((available / filtered.length) * 100).toFixed(1))
    }

    const uptime24h = calcUptime(oneDayAgo)
    const uptime7d = calcUptime(sevenDaysAgo)
    const uptime30d = calcUptime(thirtyDaysAgo)

    const faultCount7d = (events || []).filter(
      e => e.status === 'Faulted' && new Date(e.ts) > sevenDaysAgo
    ).length

    const risk = calculateRisk({
      faultCount7d,
      uptime24h,
      uptime7d,
      uptime30d,
      isOffline: !liveStatus || liveStatus === 'offline',
    })

    return Response.json({
      charger,
      liveStatus,
      connectorStatuses: statusRows || [],
      activeSessionsByConnector: activeSessions || [],
      uptime24h,
      uptime7d,
      uptime30d,
      riskLevel: risk.level,
      riskReasons: risk.reasons,
      recentEvents: events || [],
      alerts: alerts || [],
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()

  const userScoped = createServerClient(
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

  const { data: { user } } = await userScoped.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const updates: Record<string, string | null> = {}

  if ('siteId' in body) {
    updates.site_id = body.siteId === '' || body.siteId === undefined ? null : body.siteId
  }
  if ('nickname' in body) {
    const nickname = (body.nickname || '').trim()
    if (!nickname) {
      return Response.json({ error: 'Nickname cannot be empty.' }, { status: 400 })
    }
    updates.nickname = nickname
  }
  if ('location' in body) {
    updates.location = (body.location || '').trim() || null
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  // RLS (chargers update policy: user_id = auth.uid()) already prevents this
  // from touching a charger that isn't the caller's own.
  const { error } = await userScoped
    .from('chargers')
    .update(updates)
    .eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
