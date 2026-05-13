import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data: chargers } = await supabase.from('chargers').select('*')
    if (!chargers || chargers.length === 0) return Response.json([])

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const chargerData = await Promise.all(
      chargers.map(async (charger) => {
        const { data: events } = await supabase
          .from('events')
          .select('status, ts')
          .eq('cp_id', charger.id)
          .gte('ts', thirtyDaysAgo.toISOString())

        if (!events || events.length === 0) {
          return {
            id: charger.id,
            uptime24h: 0,
            uptime7d: 0,
            uptime30d: 0,
            lastUpdate: 'No data yet'
          }
        }

        const calcUptime = (since: Date) => {
          const filtered = events.filter(e => new Date(e.ts) > since)
          if (filtered.length === 0) return 0
          const available = filtered.filter(e => e.status === 'Available').length
          return parseFloat(((available / filtered.length) * 100).toFixed(1))
        }

        return {
          id: charger.id,
          uptime24h: calcUptime(oneDayAgo),
          uptime7d: calcUptime(sevenDaysAgo),
          uptime30d: calcUptime(thirtyDaysAgo),
          lastUpdate: new Date(events[events.length - 1].ts).toLocaleTimeString()
        }
      })
    )

    return Response.json(chargerData)
  } catch (error) {
    console.error('Error:', error)
    return Response.json([])
  }
}