import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// This is a public, no-login page for demos/pitches — it always shows the
// ChargerPulse founder account's own fleet, not arbitrary customer data.
// Once there are real paying customers with data worth keeping private,
// this should NOT be extended to show their fleets without an explicit,
// opt-in, customer-controlled sharing mechanism.
const DEMO_ACCOUNT_EMAIL = 'senzoradebe999@gmail.com'

export async function GET() {
  const admin = getAdminClient()

  const { data: userList, error: userError } = await admin.auth.admin.listUsers()
  const demoUser = userList?.users.find(u => u.email === DEMO_ACCOUNT_EMAIL)

  if (userError || !demoUser) {
    return Response.json({ error: 'Status data unavailable' }, { status: 503 })
  }

  const [{ data: chargers }, { data: statusRows }, { data: sites }] = await Promise.all([
    admin.from('chargers').select('id, nickname, site_id').eq('user_id', demoUser.id),
    admin.from('charger_status').select('cp_id, status'),
    admin.from('sites').select('id, name, lat, lng').eq('user_id', demoUser.id),
  ])

  const chargerIds = new Set((chargers || []).map(c => c.id))
  const relevantStatus = (statusRows || []).filter(s => chargerIds.has(s.cp_id))

  const counts = { available: 0, charging: 0, faulted: 0, offline: 0 }
  for (const s of relevantStatus) {
    if (s.status in counts) counts[s.status as keyof typeof counts]++
  }
  // Chargers that have never sent a status at all count as offline for
  // display purposes, same convention used elsewhere in the app.
  const knownCount = relevantStatus.length
  counts.offline += Math.max((chargers?.length || 0) - knownCount, 0)

  const totalChargers = chargers?.length || 0
  const onlineCount = counts.available + counts.charging
  const uptimePercent = totalChargers > 0
    ? parseFloat(((onlineCount / totalChargers) * 100).toFixed(1))
    : 0

  const publicSites = (sites || [])
    .filter(s => s.lat !== null && s.lng !== null)
    .map(s => ({ name: s.name, lat: s.lat, lng: s.lng }))

  return Response.json({
    totalChargers,
    uptimePercent,
    counts,
    sites: publicSites,
    generatedAt: new Date().toISOString(),
  })
}
