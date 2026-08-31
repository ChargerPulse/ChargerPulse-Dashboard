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

    // RLS (events select policy) already scopes this to the caller's own
    // chargers, but the join keeps the query itself explicit too.
    const { data, error } = await supabase
      .from('events')
      .select('*, chargers!inner(user_id)')
      .eq('chargers.user_id', user.id)
      .order('ts', { ascending: false })
      .limit(200)

    if (error) return Response.json([])
    return Response.json(data || [])
  } catch {
    return Response.json([])
  }
}
