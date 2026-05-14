import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data: chargers } = await supabase
      .from('chargers')
      .select('*')

    if (!chargers || chargers.length === 0) {
      return new Response('No chargers found', { status: 404 })
    }

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .gte('ts', since.toISOString())

    const rows = chargers.map(charger => {
      const chargerEvents = (events || []).filter(e => e.cp_id === charger.id)
      const total = chargerEvents.length
      const available = chargerEvents.filter(e => e.status === 'Available').length
      const faulted = chargerEvents.filter(e => e.status === 'Faulted').length
      const uptime = total > 0 ? ((available / total) * 100).toFixed(1) : '0'
      const lastEvent = chargerEvents.sort((a, b) =>
        new Date(b.ts).getTime() - new Date(a.ts).getTime())[0]

      return [
        charger.id,
        charger.nickname || charger.id,
        charger.location || 'N/A',
        `${uptime}%`,
        total,
        available,
        faulted,
        lastEvent ? new Date(lastEvent.ts).toLocaleString() : 'No data',
        new Date(charger.created_at).toLocaleDateString(),
      ]
    })

    const headers = [
      'Charger ID',
      'Name',
      'Location',
      `Uptime % (${days}d)`,
      'Total Events',
      'Available Events',
      'Fault Events',
      'Last Seen',
      'Registered',
    ]

    const csv = [
      `ChargerPulse Uptime Report — Last ${days} days`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const filename = `chargerpulse-report-${days}d-${new Date().toISOString().split('T')[0]}.csv`

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return new Response('Export failed', { status: 500 })
  }
}