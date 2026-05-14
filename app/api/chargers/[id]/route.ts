import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: charger, error: chargerError } = await supabase
      .from('chargers')
      .select('*')
      .eq('id', id)
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

    const calcUptime = (since: Date) => {
      const filtered = (events || []).filter(e => new Date(e.ts) > since)
      if (filtered.length === 0) return 0
      const available = filtered.filter(e => e.status === 'Available').length
      return parseFloat(((available / filtered.length) * 100).toFixed(1))
    }

    return Response.json({
      charger,
      uptime24h: calcUptime(oneDayAgo),
      uptime7d: calcUptime(sevenDaysAgo),
      uptime30d: calcUptime(thirtyDaysAgo),
      recentEvents: events || [],
      alerts: alerts || [],
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}