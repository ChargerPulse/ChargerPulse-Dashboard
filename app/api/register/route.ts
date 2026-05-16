import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
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
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { chargerId, nickname, location } = await request.json()

    if (!chargerId || !nickname) {
      return Response.json({ error: 'Charger ID and Name are required' }, { status: 400 })
    }

    if (chargerId.includes(' ')) {
      return Response.json({ error: 'Charger ID cannot contain spaces' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('chargers')
      .select('id')
      .eq('id', chargerId)
      .single()

    if (existing) {
      return Response.json({ error: 'A charger with this ID already exists' }, { status: 409 })
    }

    const { error } = await supabase
      .from('chargers')
      .insert({ id: chargerId, nickname, location: location || null, user_id: user.id })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, chargerId, nickname })
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}