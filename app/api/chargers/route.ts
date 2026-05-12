import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

export async function GET() {
  try {
    console.log('Fetching chargers...')
    
    // Just fetch chargers first
    const { data: chargers, error } = await supabase
      .from('chargers')
      .select('*')

    if (error) {
      console.error('Supabase error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    console.log('Chargers:', chargers)
    return Response.json(chargers || [])
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}