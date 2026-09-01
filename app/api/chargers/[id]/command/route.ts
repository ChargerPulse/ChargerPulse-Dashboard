import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const VALID_ACTIONS = ['RemoteStartTransaction', 'RemoteStopTransaction', 'Reset', 'UnlockConnector']

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: chargerId } = await params
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

  const body = await request.json()
  const action = body.action
  const payload = body.payload || {}

  if (!VALID_ACTIONS.includes(action)) {
    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }

  // Explicit ownership check before doing anything else — this is the
  // single most important gate in this whole route, since it's the one
  // standing between "any logged-in user" and "physically controlling
  // someone else's hardware."
  const { data: charger, error: chargerError } = await supabase
    .from('chargers')
    .select('id')
    .eq('id', chargerId)
    .eq('user_id', user.id)
    .single()

  if (chargerError || !charger) {
    return Response.json({ error: 'Charger not found' }, { status: 404 })
  }

  // Log the command request before sending it — RLS on `commands` also
  // enforces requested_by=self and ownership, as a second independent
  // check on top of the one above.
  const { data: commandRow, error: insertError } = await supabase
    .from('commands')
    .insert({
      cp_id: chargerId,
      action,
      requested_by: user.id,
      payload,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !commandRow) {
    return Response.json({ error: insertError?.message || 'Failed to log command' }, { status: 500 })
  }

  const ocppServerUrl = process.env.OCPP_SERVER_URL || 'https://chargerpulse-1.onrender.com'
  const internalApiKey = process.env.INTERNAL_API_KEY

  if (!internalApiKey) {
    return Response.json({ error: 'Server misconfigured: missing internal API key' }, { status: 500 })
  }

  try {
    const res = await fetch(`${ocppServerUrl}/command/${encodeURIComponent(chargerId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Api-Key': internalApiKey,
      },
      body: JSON.stringify({ action, payload, commandId: commandRow.id }),
      signal: AbortSignal.timeout(25000),
    })

    const data = await res.json()
    return Response.json(data, { status: res.status })
  } catch (err) {
    return Response.json({
      error: 'Could not reach the charging server. Please try again.',
    }, { status: 502 })
  }
}
