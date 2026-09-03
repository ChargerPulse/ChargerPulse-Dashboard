import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { calculateRisk } from '@/lib/risk'

type ChargerStatus = 'available' | 'charging' | 'faulted' | 'offline'

export async function GET() {
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
      return Response.json([])
    }

    const { data: chargers, error: chargersError } = await supabase
      .from('chargers')
      .select('id, nickname, created_at')
      .eq('user_id', user.id)

    if (chargersError) {
      console.error('Chargers error:', chargersError)
      return Response.json([])
    }

    if (!chargers || chargers.length === 0) return Response.json([])

    const chargerIds = chargers.map(c => c.id)

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [{ data: statusRows }, { data: sessionRows }, { data: faultRows }] = await Promise.all([
      supabase
        .from('charger_status')
        .select('cp_id, status')
        .in('cp_id', chargerIds),
      supabase
        .from('sessions')
        .select('cp_id, energy_kwh')
        .in('cp_id', chargerIds)
        .gte('started_at', startOfToday.toISOString()),
      supabase
        .from('events')
        .select('cp_id')
        .in('cp_id', chargerIds)
        .eq('status', 'Faulted')
        .gte('ts', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const faultCountByCharger = new Map<string, number>()
    for (const f of faultRows || []) {
      faultCountByCharger.set(f.cp_id, (faultCountByCharger.get(f.cp_id) || 0) + 1)
    }

    const statusByCharger = new Map(
      (statusRows || []).map(r => [r.cp_id, r.status])
    )

    const sessionsTodayByCharger = new Map<string, number>()
    const energyTodayByCharger = new Map<string, number>()
    for (const s of sessionRows || []) {
      sessionsTodayByCharger.set(s.cp_id, (sessionsTodayByCharger.get(s.cp_id) || 0) + 1)
      if (typeof s.energy_kwh === 'number') {
        energyTodayByCharger.set(s.cp_id, (energyTodayByCharger.get(s.cp_id) || 0) + s.energy_kwh)
      }
    }

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
          .order('ts', { ascending: false })

        // charger_status / today's sessions may exist even if there's no
        // recent StatusNotification history, so these are read independent
        // of the `events`-derived uptime numbers below.
        const liveExtras = {
          status: statusByCharger.get(charger.id) as ChargerStatus | undefined,
          sessionsToday: sessionsTodayByCharger.has(charger.id)
            ? sessionsTodayByCharger.get(charger.id)
            : undefined,
          energyTodayKwh: energyTodayByCharger.has(charger.id)
            ? energyTodayByCharger.get(charger.id)
            : undefined,
        }

        if (!events || events.length === 0) {
          const risk = calculateRisk({
            faultCount7d: faultCountByCharger.get(charger.id) || 0,
            uptime24h: 0,
            uptime7d: 0,
            uptime30d: 0,
            isOffline: liveExtras.status === 'offline' || liveExtras.status === undefined,
          })
          return {
            id: charger.id,
            nickname: charger.nickname,
            uptime24h: 0,
            uptime7d: 0,
            uptime30d: 0,
            lastUpdate: 'No data yet',
            riskLevel: risk.level,
            riskReasons: risk.reasons,
            ...liveExtras,
          }
        }

        const calcUptime = (since: Date) => {
          const filtered = events.filter(e => new Date(e.ts) > since)
          if (filtered.length === 0) return 0
          const available = filtered.filter(e => e.status === 'Available').length
          return parseFloat(((available / filtered.length) * 100).toFixed(1))
        }

        const uptime24h = calcUptime(oneDayAgo)
        const uptime7d = calcUptime(sevenDaysAgo)
        const uptime30d = calcUptime(thirtyDaysAgo)
        const risk = calculateRisk({
          faultCount7d: faultCountByCharger.get(charger.id) || 0,
          uptime24h,
          uptime7d,
          uptime30d,
          isOffline: liveExtras.status === 'offline' || liveExtras.status === undefined,
        })

        return {
          id: charger.id,
          nickname: charger.nickname,
          uptime24h,
          uptime7d,
          uptime30d,
          lastUpdate: new Date(events[0].ts).toLocaleTimeString(),
          riskLevel: risk.level,
          riskReasons: risk.reasons,
          ...liveExtras,
        }
      })
    )

    return Response.json(chargerData)
  } catch (error) {
    console.error('API error:', error)
    return Response.json([])
  }
}