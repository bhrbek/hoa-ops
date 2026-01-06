import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test 1: Get auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({ error: 'Auth error', details: authError.message })
    }

    if (!user) {
      return NextResponse.json({ error: 'No user', details: 'auth.getUser() returned null' })
    }

    // Test 2: Query team_memberships directly (no joins)
    const { data: memberships, error: membershipsError } = await (supabase as any)
      .from('team_memberships')
      .select('id, team_id, role')
      .eq('user_id', user.id)
      .is('deleted_at', null)

    // Test 3: Query teams directly
    const { data: teams, error: teamsError } = await (supabase as any)
      .from('teams')
      .select('id, name, org_id')
      .is('deleted_at', null)

    // Test 4: Query org_admins directly
    const { data: orgAdmins, error: orgAdminsError } = await (supabase as any)
      .from('org_admins')
      .select('id, org_id')
      .eq('user_id', user.id)

    // Test 5: Query with join
    const { data: membershipsWithTeams, error: joinError } = await (supabase as any)
      .from('team_memberships')
      .select(`
        id,
        role,
        team:teams(id, name, org_id)
      `)
      .eq('user_id', user.id)
      .is('deleted_at', null)

    return NextResponse.json({
      auth: {
        userId: user.id,
        email: user.email,
      },
      memberships: {
        data: memberships,
        error: membershipsError?.message,
        count: memberships?.length
      },
      teams: {
        data: teams,
        error: teamsError?.message,
        count: teams?.length
      },
      orgAdmins: {
        data: orgAdmins,
        error: orgAdminsError?.message,
        count: orgAdmins?.length
      },
      membershipsWithTeams: {
        data: membershipsWithTeams,
        error: joinError?.message,
        count: membershipsWithTeams?.length
      }
    })
  } catch (err) {
    return NextResponse.json({ error: 'Exception', details: String(err) })
  }
}
