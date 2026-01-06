// Debug endpoint to diagnose server-side issues
// REMOVE THIS FILE IN PRODUCTION

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getActiveTeam, getCurrentUserWithRoles } from '@/app/actions/auth'
import { getActiveRocks } from '@/app/actions/rocks'
import { getActiveEngagements, getActiveEngagementStats } from '@/app/actions/engagements'
import { getTeamMembers } from '@/app/actions/teams'

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    }
  }

  let activeTeamId: string | null = null

  try {
    const cookieStore = await cookies()
    activeTeamId = cookieStore.get('hw_active_team')?.value || null
    results.cookies = {
      activeTeamCookie: activeTeamId,
      hasAuthCookies: cookieStore.getAll().some(c => c.name.includes('supabase')),
    }
  } catch (e) {
    results.cookiesError = String(e)
  }

  try {
    const supabase = await createClient()
    results.supabaseClientCreated = true

    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getUser()
    results.auth = {
      hasUser: !!authData?.user,
      userId: authData?.user?.id || null,
      email: authData?.user?.email || null,
      error: authError?.message || null,
    }

    if (authData?.user) {
      // Test 1: Simple profile query
      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', authData.user.id)
        .maybeSingle()

      results.profile = {
        found: !!profile,
        data: profile,
        error: profileError?.message || null,
      }

      // Test 2: Simple team memberships query
      const { data: memberships, error: membershipError } = await (supabase as any)
        .from('team_memberships')
        .select('id, team_id, role')
        .eq('user_id', authData.user.id)
        .is('deleted_at', null)

      results.memberships = {
        count: memberships?.length || 0,
        data: memberships,
        error: membershipError?.message || null,
      }

      // Test 3: Simple teams query
      const { data: teams, error: teamsError } = await (supabase as any)
        .from('teams')
        .select('id, name')
        .is('deleted_at', null)

      results.teams = {
        count: teams?.length || 0,
        data: teams,
        error: teamsError?.message || null,
      }

      // Test 4: Simple orgs query
      const { data: orgs, error: orgsError } = await (supabase as any)
        .from('orgs')
        .select('id, name')

      results.orgs = {
        count: orgs?.length || 0,
        data: orgs,
        error: orgsError?.message || null,
      }

      // Test 5: COMPLEX - Teams with org join (used by getActiveTeam)
      if (activeTeamId) {
        const { data: teamWithOrg, error: teamWithOrgError } = await (supabase as any)
          .from('teams')
          .select('*, org:orgs(*)')
          .eq('id', activeTeamId)
          .is('deleted_at', null)
          .maybeSingle()

        results.teamWithOrgJoin = {
          found: !!teamWithOrg,
          data: teamWithOrg,
          error: teamWithOrgError?.message || null,
          errorDetails: teamWithOrgError,
        }
      }

      // Test 6: COMPLEX - Memberships with nested team/org (used by getCurrentUserWithRoles)
      const { data: membershipsWithTeam, error: membershipsWithTeamError } = await (supabase as any)
        .from('team_memberships')
        .select(`
          id,
          role,
          team:teams(
            id,
            name,
            description,
            org:orgs(id, name)
          )
        `)
        .eq('user_id', authData.user.id)
        .is('deleted_at', null)

      results.membershipsWithTeamOrg = {
        count: membershipsWithTeam?.length || 0,
        data: membershipsWithTeam,
        error: membershipsWithTeamError?.message || null,
        errorDetails: membershipsWithTeamError,
      }

      // Test 7: org_admins check
      const { data: orgAdmin, error: orgAdminError } = await (supabase as any)
        .from('org_admins')
        .select('id, org_id')
        .eq('user_id', authData.user.id)

      results.orgAdmins = {
        count: orgAdmin?.length || 0,
        data: orgAdmin,
        error: orgAdminError?.message || null,
      }

      // Test 8: Rocks query (simple)
      if (activeTeamId) {
        const { data: rocks, error: rocksError } = await (supabase as any)
          .from('rocks')
          .select('id, title')
          .eq('team_id', activeTeamId)
          .is('deleted_at', null)
          .limit(3)

        results.rocks = {
          count: rocks?.length || 0,
          data: rocks,
          error: rocksError?.message || null,
        }
      }

      // Test 9: Engagements query (simple)
      if (activeTeamId) {
        const { data: engagements, error: engagementsError } = await (supabase as any)
          .from('engagements')
          .select('id, activity_type')
          .eq('team_id', activeTeamId)
          .is('deleted_at', null)
          .limit(3)

        results.engagements = {
          count: engagements?.length || 0,
          data: engagements,
          error: engagementsError?.message || null,
        }
      }
    }
  } catch (e) {
    results.supabaseError = String(e)
    results.supabaseErrorStack = e instanceof Error ? e.stack : null
  }

  // ============================================
  // TEST ACTUAL SERVER ACTIONS
  // ============================================
  results.serverActions = {}

  // Test getActiveTeam server action
  try {
    const activeTeamResult = await getActiveTeam()
    results.serverActions.getActiveTeam = {
      success: true,
      hasData: !!activeTeamResult,
      teamId: activeTeamResult?.team?.id || null,
      teamName: activeTeamResult?.team?.name || null,
      orgName: activeTeamResult?.org?.name || null,
      role: activeTeamResult?.role || null,
      isOrgAdmin: activeTeamResult?.isOrgAdmin || false,
    }
  } catch (e) {
    results.serverActions.getActiveTeam = {
      success: false,
      error: String(e),
      stack: e instanceof Error ? e.stack : null,
    }
  }

  // Test getCurrentUserWithRoles server action
  try {
    const userWithRoles = await getCurrentUserWithRoles()
    results.serverActions.getCurrentUserWithRoles = {
      success: true,
      hasData: !!userWithRoles,
      email: userWithRoles?.email || null,
      teamCount: userWithRoles?.teams?.length || 0,
      orgsAdminCount: userWithRoles?.orgsAdmin?.length || 0,
    }
  } catch (e) {
    results.serverActions.getCurrentUserWithRoles = {
      success: false,
      error: String(e),
      stack: e instanceof Error ? e.stack : null,
    }
  }

  // Test getActiveRocks server action
  try {
    const rocks = await getActiveRocks()
    results.serverActions.getActiveRocks = {
      success: true,
      count: rocks?.length || 0,
      rocks: rocks?.map(r => ({ id: r.id, title: r.title })) || [],
    }
  } catch (e) {
    results.serverActions.getActiveRocks = {
      success: false,
      error: String(e),
      stack: e instanceof Error ? e.stack : null,
    }
  }

  // Test getActiveEngagementStats server action
  try {
    const stats = await getActiveEngagementStats()
    results.serverActions.getActiveEngagementStats = {
      success: true,
      hasData: !!stats,
      data: stats,
    }
  } catch (e) {
    results.serverActions.getActiveEngagementStats = {
      success: false,
      error: String(e),
      stack: e instanceof Error ? e.stack : null,
    }
  }

  // Test getActiveEngagements server action
  try {
    const engagements = await getActiveEngagements()
    results.serverActions.getActiveEngagements = {
      success: true,
      count: engagements?.length || 0,
    }
  } catch (e) {
    results.serverActions.getActiveEngagements = {
      success: false,
      error: String(e),
      stack: e instanceof Error ? e.stack : null,
    }
  }

  // Test getTeamMembers server action (only if activeTeamId exists)
  if (activeTeamId) {
    try {
      const members = await getTeamMembers(activeTeamId)
      results.serverActions.getTeamMembers = {
        success: true,
        count: members?.length || 0,
        members: members?.map(m => ({ id: m.id, role: m.role, email: m.user?.email })) || [],
      }
    } catch (e) {
      results.serverActions.getTeamMembers = {
        success: false,
        error: String(e),
        stack: e instanceof Error ? e.stack : null,
      }
    }
  }

  return NextResponse.json(results, { status: 200 })
}
