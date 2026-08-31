import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
    if (!user) return Response.json([])

    // RLS (alerts select policy) already scopes this to the caller's own
    // chargers, but the join keeps the query itself explicit too.
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*, chargers!inner(user_id)')
      .eq('chargers.user_id', user.id)
      .order('triggered_at', { ascending: false })

    if (error) throw error
    return Response.json(alerts || [])
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return Response.json([])
  }
}
