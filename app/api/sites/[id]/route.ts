import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const VALID_STATUSES = ['stable', 'load_shedding', 'grid_down']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json()
  const gridStatus = body.gridStatus
  const backupBatteryActive = !!body.backupBatteryActive
  const backupRuntimeHours = body.backupRuntimeHours === '' || body.backupRuntimeHours === undefined
    ? null : Number(body.backupRuntimeHours)

  if (!VALID_STATUSES.includes(gridStatus)) {
    return Response.json({ error: `gridStatus must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
  }
  if (backupRuntimeHours !== null && (isNaN(backupRuntimeHours) || backupRuntimeHours < 0)) {
    return Response.json({ error: 'Backup runtime must be a non-negative number.' }, { status: 400 })
  }

  // RLS (sites 'manage own' policy) already prevents this from touching a
  // site that isn't the caller's own.
  const { error } = await supabase
    .from('sites')
    .update({
      grid_status: gridStatus,
      backup_battery_active: backupBatteryActive,
      backup_runtime_hours: backupRuntimeHours,
      grid_status_updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
