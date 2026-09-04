import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Ownership check before doing anything else, same pattern as the other
  // per-charger routes.
  const { data: charger, error: chargerError } = await supabase
    .from('chargers')
    .select('id, nickname, location')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (chargerError || !charger) {
    return Response.json({ error: 'Charger not found' }, { status: 404 })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: events }, { data: alerts }] = await Promise.all([
    supabase
      .from('events')
      .select('status, ts')
      .eq('cp_id', id)
      .gte('ts', thirtyDaysAgo)
      .order('ts', { ascending: false })
      .limit(50),
    supabase
      .from('alerts')
      .select('triggered_at, resolved_at')
      .eq('cp_id', id)
      .gte('triggered_at', thirtyDaysAgo)
      .order('triggered_at', { ascending: false })
      .limit(20),
  ])

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'AI insights are not configured yet.' }, { status: 501 })
  }

  const eventSummary = (events || [])
    .map(e => `${e.status} at ${e.ts}`)
    .join('\n') || 'No events in the last 30 days.'

  const alertSummary = (alerts || [])
    .map(a => `Triggered ${a.triggered_at}${a.resolved_at ? `, resolved ${a.resolved_at}` : ' (still active)'}`)
    .join('\n') || 'No alerts in the last 30 days.'

  const prompt = `You are writing a short operational health summary for an EV charger, for a fleet operator who is not technical. Be concrete and plain-spoken. 2-3 sentences maximum. If everything looks fine, say so briefly rather than padding it out. If something looks concerning, say specifically what and why it matters practically (e.g. lost revenue, driver inconvenience, needs an on-site check).

Charger: ${charger.nickname} (${charger.location || 'no location set'})

Status events (most recent 50, last 30 days):
${eventSummary}

Alerts (last 30 days):
${alertSummary}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('Anthropic API error:', errBody)
      return Response.json({ error: 'Could not generate insight right now.' }, { status: 502 })
    }

    const data = await res.json()
    const summary = data.content?.[0]?.text || 'No summary generated.'

    return Response.json({ summary, generatedAt: new Date().toISOString() })
  } catch (err) {
    console.error('Insight generation failed:', err)
    return Response.json({ error: 'Could not generate insight right now.' }, { status: 502 })
  }
}
