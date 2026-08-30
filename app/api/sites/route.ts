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

export async function GET() {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json([])

  const { data: sites, error } = await supabase
    .from('sites')
    .select('id, name, lat, lng, address, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Sites fetch error:', error)
    return Response.json([])
  }

  // Charger counts per site, for the "3 chargers" label in the list.
  const { data: chargers } = await supabase
    .from('chargers')
    .select('id, site_id')
    .not('site_id', 'is', null)

  const countBySite = new Map<string, number>()
  for (const c of chargers || []) {
    if (c.site_id) countBySite.set(c.site_id, (countBySite.get(c.site_id) || 0) + 1)
  }

  return Response.json(
    (sites || []).map(s => ({ ...s, chargerCount: countBySite.get(s.id) || 0 }))
  )
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const name = (body.name || '').trim()
  const lat = body.lat === '' || body.lat === undefined ? null : Number(body.lat)
  const lng = body.lng === '' || body.lng === undefined ? null : Number(body.lng)
  const address = (body.address || '').trim() || null

  if (!name) {
    return Response.json({ error: 'Site name is required.' }, { status: 400 })
  }
  if (lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) {
    return Response.json({ error: 'Latitude must be a number between -90 and 90.' }, { status: 400 })
  }
  if (lng !== null && (isNaN(lng) || lng < -180 || lng > 180)) {
    return Response.json({ error: 'Longitude must be a number between -180 and 180.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('sites')
    .insert({ user_id: user.id, name, lat, lng, address })
    .select('id, name')
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ site: data })
}
