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
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: tariff } = await supabase
    .from('tariffs')
    .select('price_per_kwh, currency')
    .eq('user_id', user.id)
    .maybeSingle()

  return Response.json(tariff || { price_per_kwh: 0, currency: 'ZAR' })
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json()
  const pricePerKwh = Number(body.pricePerKwh)
  const currency = (body.currency || 'ZAR').trim().toUpperCase()

  if (isNaN(pricePerKwh) || pricePerKwh < 0) {
    return Response.json({ error: 'Price per kWh must be a non-negative number.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('tariffs')
    .upsert({ user_id: user.id, price_per_kwh: pricePerKwh, currency, updated_at: new Date().toISOString() })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true, price_per_kwh: pricePerKwh, currency })
}
