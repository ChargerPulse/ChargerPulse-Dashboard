import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
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
}

// Depot detail: the site, its chargers, and depot-level statistics.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getSupabase(await cookies())

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: site } = await supabase
    .from('sites')
    .select('id, name, address, country, lat, lng, manager_name, manager_phone, manager_email, grid_status, backup_battery_active, backup_runtime_hours')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!site) return Response.json({ error: 'Depot not found' }, { status: 404 })

  const { data: chargers } = await supabase
    .from('chargers')
    .select('id, nickname')
    .eq('site_id', id)
    .eq('user_id', user.id)

  const list = chargers || []
  const ids = list.map(c => c.id)
  const nameById = new Map(list.map(c => [c.id, c.nickname || c.id]))

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const thirtyDaysAgo = new Date(now - 30 * day).toISOString()
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  let statusRows: { cp_id: string; status: string }[] = []
  let events: { cp_id: string; status: string; ts: string; connector_id: number | null }[] = []
  let sessions: { cp_id: string; energy_kwh: number | null; started_at: string }[] = []

  if (ids.length > 0) {
    const [s, e, ss] = await Promise.all([
      supabase.from('charger_status').select('cp_id, status').in('cp_id', ids),
      supabase.from('events').select('cp_id, status, ts, connector_id')
        .in('cp_id', ids).gte('ts', thirtyDaysAgo).order('ts', { ascending: false }),
      supabase.from('sessions').select('cp_id, energy_kwh, started_at')
        .in('cp_id', ids).gte('started_at', thirtyDaysAgo),
    ])
    statusRows = s.data || []
    events = e.data || []
    sessions = ss.data || []
  }

  // Same availability-ratio method the main dashboard uses, so depot numbers
  // agree with the charger pages.
  const uptime = (evs: typeof events, since: number) => {
    const f = evs.filter(ev => new Date(ev.ts).getTime() > since)
    if (f.length === 0) return 0
    return parseFloat(((f.filter(ev => ev.status === 'Available').length / f.length) * 100).toFixed(1))
  }

  const PRIORITY: Record<string, number> = { faulted: 3, charging: 2, available: 1, offline: 0 }
  const statusById = new Map<string, string>()
  for (const r of statusRows) {
    const cur = statusById.get(r.cp_id)
    if (!cur || PRIORITY[r.status] > PRIORITY[cur]) statusById.set(r.cp_id, r.status)
  }

  const chargerStats = list.map(c => {
    const evs = events.filter(ev => ev.cp_id === c.id)
    const mine = sessions.filter(ss => ss.cp_id === c.id)
    return {
      id: c.id,
      nickname: c.nickname || c.id,
      status: statusById.get(c.id) || 'offline',
      uptime24h: uptime(evs, now - day),
      uptime7d: uptime(evs, now - 7 * day),
      uptime30d: uptime(evs, now - 30 * day),
      sessions30d: mine.length,
      energy30dKwh: parseFloat(mine.reduce((sum, ss) => sum + (ss.energy_kwh || 0), 0).toFixed(2)),
    }
  })

  const todaySessions = sessions.filter(ss => new Date(ss.started_at) >= startOfToday)
  const avg = (key: 'uptime24h' | 'uptime7d' | 'uptime30d') =>
    chargerStats.length === 0
      ? 0
      : parseFloat((chargerStats.reduce((sum, c) => sum + c[key], 0) / chargerStats.length).toFixed(1))

  const count = (st: string) => chargerStats.filter(c => c.status === st).length

  const faultHistory = events
    .filter(ev => ev.status === 'Faulted' || ev.status === 'Unavailable')
    .slice(0, 20)
    .map(ev => ({
      charger: nameById.get(ev.cp_id) || ev.cp_id,
      chargerId: ev.cp_id,
      connectorId: ev.connector_id,
      status: ev.status,
      ts: ev.ts,
    }))

  return Response.json({
    site,
    chargers: chargerStats,
    summary: {
      chargerCount: chargerStats.length,
      available: count('available'),
      charging: count('charging'),
      faulted: count('faulted'),
      offline: count('offline'),
      uptime24h: avg('uptime24h'),
      uptime7d: avg('uptime7d'),
      uptime30d: avg('uptime30d'),
      sessionsToday: todaySessions.length,
      energyTodayKwh: parseFloat(todaySessions.reduce((sum, ss) => sum + (ss.energy_kwh || 0), 0).toFixed(2)),
      sessions30d: sessions.length,
      energy30dKwh: parseFloat(sessions.reduce((sum, ss) => sum + (ss.energy_kwh || 0), 0).toFixed(2)),
    },
    faultHistory,
  })
}

// Edit depot details (name, address, country, manager contact).
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getSupabase(await cookies())

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json()
  const name = (body.name || '').trim()
  if (!name) return Response.json({ error: 'Depot name is required.' }, { status: 400 })

  const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '') || null

  const { error } = await supabase
    .from('sites')
    .update({
      name,
      address: clean(body.address),
      country: clean(body.country),
      manager_name: clean(body.managerName),
      manager_phone: clean(body.managerPhone),
      manager_email: clean(body.managerEmail),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
