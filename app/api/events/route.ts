import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('ts', { ascending: false })
      .limit(200)

    if (error) return Response.json([])
    return Response.json(data || [])
  } catch {
    return Response.json([])
  }
}