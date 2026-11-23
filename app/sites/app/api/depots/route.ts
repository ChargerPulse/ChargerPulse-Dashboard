import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Depots overview: every site the user owns, with charger counts, live
// availability, uptime and recent faults, in one call.
export async function GET() {
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
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, address, country, manager_name, manager_phone')
    .eq('user_id', user.id)
    .order('name')

  const siteList = sites || []
  if (siteList.length === 0) return Response.json({ depots: [], totals: null })

  const { data: chargers } = await supabase
    .from('chargers')
    .select('id, site_id')
    .eq('user_id', user.id)
    .not('site_id', 'is', null)

  const chargerList = chargers || []
  const ids = chargerList.map(c => c.id)
  const siteByCharger = new Map(chargerList.map(c => [c.id, c.site_id as string]))

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const since30 = new Date(now - 30 * day).toISOString()

  let statusRows: { cp_id: string; status: string }[] = []
  let events: { cp_id: string; status: string; ts: string }[] = []

  if (ids.length > 0) {
    const [s, e] = await Promise.all([
      supabase.from('charger_status').select('cp_id, status').in('cp_id', ids),
      supabase.from('events').select('cp_id, status, ts').in('cp_id', ids).gte('ts', since30),
    ])
    statusRows = s.data || []
    events = e.data || []
  }

  // Most attention-worthy status across a charger's connectors.
  const PRIORITY: Record<string, number> = { faulted: 3, charging: 2, available: 1, offline: 0 }
  const statusById = new Map<string, string>()
  for (const r of statusRows) {
    const cur = statusById.get(r.cp_id)
    if (!cur || PRIORITY[r.status] > PRIORITY[cur]) statusById.set(r.cp_id, r.status)
  }

  const uptimeOf = (evs: typeof events, sinceMs: number) => {
    const f = evs.filter(ev => new Date(ev.ts).getTime() > sinceMs)
    if (f.length === 0) return null
    return parseFloat(((f.filter(ev => ev.status === 'Available').length / f.length) * 100).toFixed(1))
  }

  const depots = siteList.map(site => {
    const mine = chargerList.filter(c => c.site_id === site.id).map(c => c.id)
    const statuses = mine.map(id => statusById.get(id) || 'offline')
    const evs = events.filter(ev => siteByCharger.get(ev.cp_id) === site.id)
    const faults24h = evs.filter(ev => ev.status === 'Faulted' && new Date(ev.ts).getTime() > now - day).length
    return {
      id: site.id,
      name: site.name,
      address: site.address,
      country: site.country,
      managerName: site.manager_name,
      managerPhone: site.manager_phone,
      chargerCount: mine.length,
      up: statuses.filter(s => s === 'available' || s === 'charging').length,
      faulted: statuses.filter(s => s === 'faulted').length,
      offline: statuses.filter(s => s === 'offline').length,
      uptime24h: uptimeOf(evs, now - day),
      uptime7d: uptimeOf(evs, now - 7 * day),
      faults24h,
    }
  })

  const totals = {
    depots: depots.length,
    chargers: depots.reduce((a, d) => a + d.chargerCount, 0),
    up: depots.reduce((a, d) => a + d.up, 0),
    faulted: depots.reduce((a, d) => a + d.faulted, 0),
    offline: depots.reduce((a, d) => a + d.offline, 0),
  }

  return Response.json({ depots, totals })
  }
  
