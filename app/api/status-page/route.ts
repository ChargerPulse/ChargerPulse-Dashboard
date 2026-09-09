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

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/

export async function GET() {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { data } = await supabase
    .from('public_status_pages')
    .select('slug, display_name, enabled')
    .eq('user_id', user.id)
    .maybeSingle()

  return Response.json(data || null)
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = getSupabase(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json()
  const slug = (body.slug || '').trim().toLowerCase()
  const displayName = (body.displayName || '').trim() || null
  const enabled = body.enabled !== false

  if (!SLUG_PATTERN.test(slug)) {
    return Response.json({
      error: 'Slug must be 3-63 characters, lowercase letters/numbers/hyphens only, and cannot start or end with a hyphen.'
    }, { status: 400 })
  }

  const { error } = await supabase
    .from('public_status_pages')
    .upsert({ user_id: user.id, slug, display_name: displayName, enabled })

  if (error) {
    // Unique constraint violation on slug
    if (error.code === '23505') {
      return Response.json({ error: 'That slug is already taken. Try another.' }, { status: 409 })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true, slug, displayName, enabled })
}
