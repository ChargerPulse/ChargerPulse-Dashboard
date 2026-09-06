import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

  const { data: chargers } = await supabase
    .from('chargers')
    .select('id, nickname')
    .eq('user_id', user.id)

  if (!chargers || chargers.length === 0) {
    return Response.json({
      today: { kwh: 0, sessions: 0, revenue: 0 },
      week: { kwh: 0, sessions: 0, revenue: 0 },
      month: { kwh: 0, sessions: 0, revenue: 0 },
      byCharger: [],
      dailyTrend: [],
      currency: 'ZAR',
    })
  }

  const chargerIds = chargers.map(c => c.id)
  const nicknameById = new Map(chargers.map(c => [c.id, c.nickname]))

  const now = new Date()
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [{ data: monthSessions }, { data: tariff }] = await Promise.all([
    supabase
      .from('sessions')
      .select('cp_id, energy_kwh, started_at')
      .in('cp_id', chargerIds)
      .gte('started_at', thirtyDaysAgo.toISOString())
      .not('energy_kwh', 'is', null),
    supabase
      .from('tariffs')
      .select('price_per_kwh, currency')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const pricePerKwh = tariff?.price_per_kwh || 0
  const currency = tariff?.currency || 'ZAR'

  const summarize = (since: Date) => {
    const rows = (monthSessions || []).filter(s => new Date(s.started_at) >= since)
    const kwh = rows.reduce((sum, s) => sum + (s.energy_kwh || 0), 0)
    return {
      kwh: parseFloat(kwh.toFixed(2)),
      sessions: rows.length,
      revenue: parseFloat((kwh * pricePerKwh).toFixed(2)),
    }
  }

  const byChargerMap = new Map<string, { kwh: number; sessions: number }>()
  for (const s of monthSessions || []) {
    const entry = byChargerMap.get(s.cp_id) || { kwh: 0, sessions: 0 }
    entry.kwh += s.energy_kwh || 0
    entry.sessions += 1
    byChargerMap.set(s.cp_id, entry)
  }
  const byCharger = Array.from(byChargerMap.entries()).map(([cp_id, v]) => ({
    id: cp_id,
    nickname: nicknameById.get(cp_id) || cp_id,
    kwh: parseFloat(v.kwh.toFixed(2)),
    sessions: v.sessions,
  })).sort((a, b) => b.kwh - a.kwh)

  // Last 14 days, one point per day, for a simple trend line.
  const dailyTrend: { date: string; kwh: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0); dayStart.setDate(dayStart.getDate() - i)
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    const kwh = (monthSessions || [])
      .filter(s => {
        const t = new Date(s.started_at)
        return t >= dayStart && t < dayEnd
      })
      .reduce((sum, s) => sum + (s.energy_kwh || 0), 0)
    dailyTrend.push({ date: dayStart.toISOString().slice(0, 10), kwh: parseFloat(kwh.toFixed(2)) })
  }

  return Response.json({
    today: summarize(startOfToday),
    week: summarize(sevenDaysAgo),
    month: summarize(thirtyDaysAgo),
    byCharger,
    dailyTrend,
    currency,
  })
}
