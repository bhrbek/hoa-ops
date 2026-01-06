"use client"

import * as React from "react"
import type {
  Team,
  Org,
  TeamRole,
  TeamMembershipWithUser,
  UserWithRoles,
  ActiveTeamContext as ActiveTeamContextType,
  Profile,
} from "@/types/supabase"

interface TeamContextValue {
  // Current team state
  activeTeam: Team | null
  activeOrg: Org | null
  currentRole: TeamRole | null
  isOrgAdmin: boolean
  isLoading: boolean
  error: string | null

  // User info (profile + email for display)
  user: (Profile & { email: string }) | null
  teamMembers: TeamMembershipWithUser[]

  // Available teams for switching (includes role and org info)
  availableTeams: (Team & { role: TeamRole; org: Org })[]

  // Actions
  switchTeam: (teamId: string) => Promise<void>
  refreshTeamData: () => Promise<void>
}

const TeamContext = React.createContext<TeamContextValue | null>(null)

interface TeamProviderProps {
  children: React.ReactNode
  initialTeam?: ActiveTeamContextType | null
  initialUser?: UserWithRoles | null
}

export function TeamProvider({
  children,
  initialTeam = null,
  initialUser = null,
}: TeamProviderProps) {
  const [activeTeam, setActiveTeam] = React.useState<Team | null>(
    initialTeam?.team ?? null
  )
  const [activeOrg, setActiveOrg] = React.useState<Org | null>(
    initialTeam?.org ?? null
  )
  const [currentRole, setCurrentRole] = React.useState<TeamRole | null>(
    initialTeam?.role ?? null
  )
  const [isOrgAdmin, setIsOrgAdmin] = React.useState<boolean>(
    initialTeam?.isOrgAdmin ?? false
  )
  const [user, setUser] = React.useState<(Profile & { email: string }) | null>(
    initialUser ? { ...initialUser, email: initialUser.email || "" } : null
  )
  const [teamMembers, setTeamMembers] = React.useState<TeamMembershipWithUser[]>([])
  const [availableTeams, setAvailableTeams] = React.useState<(Team & { role: TeamRole; org: Org })[]>([])
  const [isLoading, setIsLoading] = React.useState(!initialTeam)
  const [error, setError] = React.useState<string | null>(null)

  // Load initial data
  React.useEffect(() => {
    if (!initialTeam || !initialUser) {
      loadTeamData()
    } else {
      // Extract available teams from user's teams (UserWithRoles type)
      setAvailableTeams(initialUser.teams || [])
      loadTeamMembers(initialTeam.team.id)
    }
  }, [])

  async function loadTeamData() {
    console.log('[TeamContext] loadTeamData starting...')
    setIsLoading(true)
    setError(null)

    try {
      // Dynamic imports to avoid issues during SSR
      const { getActiveTeam, getCurrentUserWithRoles } = await import(
        "@/app/actions/auth"
      )

      console.log('[TeamContext] Fetching team and user data...')
      const [teamContext, userWithRoles] = await Promise.all([
        getActiveTeam(),
        getCurrentUserWithRoles(),
      ])

      console.log('[TeamContext] Results:', {
        teamContext: teamContext ? {
          teamId: teamContext.team?.id,
          teamName: teamContext.team?.name,
          isOrgAdmin: teamContext.isOrgAdmin
        } : 'NULL - no team context!',
        userWithRoles: userWithRoles ? {
          email: userWithRoles.email,
          teamsCount: userWithRoles.teams?.length,
          teams: userWithRoles.teams?.map(t => ({ id: t.id, name: t.name })),
          orgsAdminCount: userWithRoles.orgsAdmin?.length
        } : 'NULL - no user!'
      })

      if (userWithRoles) {
        setUser({ ...userWithRoles, email: userWithRoles.email || "" })
        setAvailableTeams(userWithRoles.teams || [])
      }

      if (teamContext) {
        setActiveTeam(teamContext.team)
        setActiveOrg(teamContext.org)
        setCurrentRole(teamContext.role)
        setIsOrgAdmin(teamContext.isOrgAdmin)
        console.log('[TeamContext] Setting isOrgAdmin to:', teamContext.isOrgAdmin)
        await loadTeamMembers(teamContext.team.id)
      } else {
        console.log('[TeamContext] No teamContext returned!')
      }
    } catch (err) {
      console.error("[TeamContext] Failed to load team data:", err)
      setError("Failed to load team data")
    } finally {
      console.log('[TeamContext] loadTeamData complete')
      setIsLoading(false)
    }
  }

  async function loadTeamMembers(teamId: string) {
    try {
      const { getTeamMembers } = await import("@/app/actions/teams")
      const members = await getTeamMembers(teamId)
      setTeamMembers(members)
    } catch (err) {
      console.error("Failed to load team members:", err)
    }
  }

  async function handleSwitchTeam(teamId: string) {
    if (teamId === activeTeam?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const { switchTeam: switchTeamAction } = await import("@/app/actions/teams")
      const { getActiveTeam } = await import("@/app/actions/auth")

      await switchTeamAction(teamId)

      // Reload team context after switching
      const teamContext = await getActiveTeam()

      if (teamContext) {
        setActiveTeam(teamContext.team)
        setActiveOrg(teamContext.org)
        setCurrentRole(teamContext.role)
        setIsOrgAdmin(teamContext.isOrgAdmin)
        await loadTeamMembers(teamContext.team.id)
      }
    } catch (err) {
      console.error("Failed to switch team:", err)
      setError("Failed to switch team")
    } finally {
      setIsLoading(false)
    }
  }

  async function refreshTeamData() {
    await loadTeamData()
  }

  const value: TeamContextValue = {
    activeTeam,
    activeOrg,
    currentRole,
    isOrgAdmin,
    isLoading,
    error,
    user,
    teamMembers,
    availableTeams,
    switchTeam: handleSwitchTeam,
    refreshTeamData,
  }

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export function useTeam() {
  const context = React.useContext(TeamContext)
  if (!context) {
    throw new Error("useTeam must be used within a TeamProvider")
  }
  return context
}

// Convenience hooks for common patterns
export function useActiveTeam() {
  const { activeTeam, isLoading } = useTeam()
  return { team: activeTeam, isLoading }
}

export function useTeamMembers() {
  const { teamMembers, isLoading } = useTeam()
  return { members: teamMembers, isLoading }
}

export function useTeamRole() {
  const { currentRole, isOrgAdmin, isLoading } = useTeam()
  return {
    role: currentRole,
    isOrgAdmin,
    isManager: currentRole === "manager",
    isTSA: currentRole === "tsa",
    isLoading,
  }
}
