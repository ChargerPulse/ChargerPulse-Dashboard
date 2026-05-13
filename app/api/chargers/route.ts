import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Return env var status so we can debug
  if (!url || !key) {
    return Response.json({ 
      error: 'Missing env vars', 
      url: url ? 'SET' : 'MISSING', 
      key: key ? 'SET' : 'MISSING' 
    })
  }

  const supabase = createClient(url, key)

  const { data: chargers, error: chargersError } = await supabase
    .from('chargers')
    .select('id, nickname, created_at')

  if (chargersError) {
    return Response.json({ error: 'Chargers query failed', details: chargersError })
  }

  if (!chargers || chargers.length === 0) {
    return Response.json({ error: 'No chargers found', chargers })
  }

  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const chargerData = await Promise.all(
    chargers.map(async (charger) => {
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('status, ts')
        .eq('cp_id', charger.id)
        .gte('ts', thirtyDaysAgo.toISOString())
        .order('ts', { ascending: false })

      if (eventsError) {
        return { id: charger.id, error: eventsError }
      }

      if (!events || events.length === 0) {
        return { id: charger.id, nickname: charger.nickname, uptime24h: 0, uptime7d: 0, uptime30d: 0, lastUpdate: 'No data yet' }
      }

      const calcUptime = (since: Date) => {
        const filtered = events.filter(e => new Date(e.ts) > since)
        if (filtered.length === 0) return 0
        const available = filtered.filter(e => e.status === 'Available').length
        return parseFloat(((available / filtered.length) * 100).toFixed(1))
      }

      return {
        id: charger.id,
        nickname: charger.nickname,
        uptime24h: calcUptime(oneDayAgo),
        uptime7d: calcUptime(sevenDaysAgo),
        uptime30d: calcUptime(thirtyDaysAgo),
        lastUpdate: new Date(events[0].ts).toLocaleTimeString()
      }
    })
  )

  return Response.json(chargerData)
}