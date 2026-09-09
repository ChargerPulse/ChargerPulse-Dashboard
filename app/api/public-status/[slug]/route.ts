import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Uses the plain anon client (no user session) since this is intentionally
  // public. Safe because get_public_status() is a security-definer function
  // that only ever returns pre-aggregated, non-sensitive fields — there's no
  // direct table access here for a caller to exploit.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.rpc('get_public_status', { status_slug: slug })

  if (error) {
    console.error('Public status fetch error:', error)
    return Response.json({ error: 'Could not load status' }, { status: 500 })
  }

  if (data?.error === 'not_found') {
    return Response.json({ error: 'Status page not found' }, { status: 404 })
  }

  return Response.json(data)
}
