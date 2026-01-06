// Debug endpoint to diagnose server-side issues
// REMOVE THIS FILE IN PRODUCTION

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    }
  }

  try {
    const cookieStore = await cookies()
    results.cookies = {
      activeTeamCookie: cookieStore.get('hw_active_team')?.value || null,
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
      // Test profile query
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

      // Test team memberships query
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

      // Test teams query
      const { data: teams, error: teamsError } = await (supabase as any)
        .from('teams')
        .select('id, name')
        .is('deleted_at', null)

      results.teams = {
        count: teams?.length || 0,
        data: teams,
        error: teamsError?.message || null,
      }
    }
  } catch (e) {
    results.supabaseError = String(e)
    results.supabaseErrorStack = e instanceof Error ? e.stack : null
  }

  return NextResponse.json(results, { status: 200 })
}
