import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .order('triggered_at', { ascending: false })

    if (error) throw error
    return Response.json(alerts || [])
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return Response.json([])
  }
}