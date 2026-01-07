"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, X, Check, Loader2, ChevronDown, ChevronRight, Users, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTeam } from "@/contexts/team-context"
import {
  getDomains,
  getOEMs,
  getActivityTypes,
  createDomain,
  updateDomain,
  deleteDomain,
  createOEM,
  updateOEM,
  deleteOEM,
  createActivityType,
  updateActivityType,
  deleteActivityType,
  getProfiles,
} from "@/app/actions/reference"
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
} from "@/app/actions/teams"
import type { Domain, OEM, Team, TeamMembership, Profile, TeamRole, ActivityType } from "@/types/supabase"

const DOMAIN_COLORS = [
  { value: "default", label: "Gray" },
  { value: "primary", label: "Blue" },
  { value: "cloud", label: "Sky" },
  { value: "security", label: "Red" },
  { value: "network", label: "Purple" },
  { value: "infra", label: "Orange" },
  { value: "warning", label: "Yellow" },
]

export default function AdminSettingsPage() {
  const { isOrgAdmin, isLoading: isLoadingTeam, activeOrg } = useTeam()

  const [domains, setDomains] = React.useState<Domain[]>([])
  const [oems, setOems] = React.useState<OEM[]>([])
  const [activityTypes, setActivityTypes] = React.useState<ActivityType[]>([])
  const [teams, setTeams] = React.useState<Team[]>([])
  const [profiles, setProfiles] = React.useState<Profile[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Domain editing state
  const [editingDomainId, setEditingDomainId] = React.useState<string | null>(null)
  const [editingDomainName, setEditingDomainName] = React.useState("")
  const [editingDomainColor, setEditingDomainColor] = React.useState("default")
  const [newDomainName, setNewDomainName] = React.useState("")
  const [newDomainColor, setNewDomainColor] = React.useState("default")
  const [isAddingDomain, setIsAddingDomain] = React.useState(false)

  // OEM editing state
  const [editingOemId, setEditingOemId] = React.useState<string | null>(null)
  const [editingOemName, setEditingOemName] = React.useState("")
  const [newOemName, setNewOemName] = React.useState("")
  const [isAddingOem, setIsAddingOem] = React.useState(false)

  // Activity Type editing state
  const [editingActivityTypeId, setEditingActivityTypeId] = React.useState<string | null>(null)
  const [editingActivityTypeName, setEditingActivityTypeName] = React.useState("")
  const [editingActivityTypeDescription, setEditingActivityTypeDescription] = React.useState("")
  const [newActivityTypeName, setNewActivityTypeName] = React.useState("")
  const [newActivityTypeDescription, setNewActivityTypeDescription] = React.useState("")
  const [isAddingActivityType, setIsAddingActivityType] = React.useState(false)

  // Team editing state
  const [editingTeamId, setEditingTeamId] = React.useState<string | null>(null)
  const [editingTeamName, setEditingTeamName] = React.useState("")
  const [editingTeamDescription, setEditingTeamDescription] = React.useState("")
  const [newTeamName, setNewTeamName] = React.useState("")
  const [newTeamDescription, setNewTeamDescription] = React.useState("")
  const [isAddingTeam, setIsAddingTeam] = React.useState(false)
  const [expandedTeamId, setExpandedTeamId] = React.useState<string | null>(null)
  const [teamMembers, setTeamMembers] = React.useState<Record<string, (TeamMembership & { user: Profile })[]>>({})
  const [isAddingMember, setIsAddingMember] = React.useState<string | null>(null)
  const [newMemberUserId, setNewMemberUserId] = React.useState("")
  const [newMemberRole, setNewMemberRole] = React.useState<TeamRole>("tsa")

  const [isSaving, setIsSaving] = React.useState(false)

  // Load data - fetch independently so one failure doesn't break all
  React.useEffect(() => {
    async function loadData() {
      if (!activeOrg?.id) return
      setIsLoading(true)

      // Load each independently so failures are isolated
      const [domainsResult, oemsResult, activityTypesResult, teamsResult, profilesResult] = await Promise.allSettled([
        getDomains(),
        getOEMs(),
        getActivityTypes(),
        getTeams(activeOrg.id),
        getProfiles(),
      ])

      if (domainsResult.status === 'fulfilled') setDomains(domainsResult.value)
      else console.error("Failed to load domains:", domainsResult.reason)

      if (oemsResult.status === 'fulfilled') setOems(oemsResult.value)
      else console.error("Failed to load OEMs:", oemsResult.reason)

      if (activityTypesResult.status === 'fulfilled') setActivityTypes(activityTypesResult.value)
      else console.error("Failed to load activity types:", activityTypesResult.reason)

      if (teamsResult.status === 'fulfilled') setTeams(teamsResult.value)
      else console.error("Failed to load teams:", teamsResult.reason)

      if (profilesResult.status === 'fulfilled') setProfiles(profilesResult.value)
      else console.error("Failed to load profiles:", profilesResult.reason)

      setIsLoading(false)
    }
    loadData()
  }, [activeOrg?.id])

  // Domain handlers
  const handleAddDomain = async () => {
    if (!newDomainName.trim()) return
    setIsSaving(true)
    try {
      const domain = await createDomain({ name: newDomainName, color: newDomainColor })
      setDomains([...domains, domain].sort((a, b) => a.name.localeCompare(b.name)))
      setNewDomainName("")
      setNewDomainColor("default")
      setIsAddingDomain(false)
    } catch (error) {
      console.error("Failed to add domain:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateDomain = async (domainId: string) => {
    if (!editingDomainName.trim()) return
    setIsSaving(true)
    try {
      const updated = await updateDomain(domainId, {
        name: editingDomainName,
        color: editingDomainColor
      })
      setDomains(domains.map(d => d.id === domainId ? updated : d))
      setEditingDomainId(null)
    } catch (error) {
      console.error("Failed to update domain:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm("Delete this domain? This cannot be undone.")) return
    setIsSaving(true)
    try {
      await deleteDomain(domainId)
      setDomains(domains.filter(d => d.id !== domainId))
    } catch (error) {
      console.error("Failed to delete domain:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const startEditingDomain = (domain: Domain) => {
    setEditingDomainId(domain.id)
    setEditingDomainName(domain.name)
    setEditingDomainColor(domain.color || "default")
  }

  // OEM handlers
  const handleAddOem = async () => {
    if (!newOemName.trim()) return
    setIsSaving(true)
    try {
      const oem = await createOEM({ name: newOemName })
      setOems([...oems, oem].sort((a, b) => a.name.localeCompare(b.name)))
      setNewOemName("")
      setIsAddingOem(false)
    } catch (error) {
      console.error("Failed to add OEM:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateOem = async (oemId: string) => {
    if (!editingOemName.trim()) return
    setIsSaving(true)
    try {
      const updated = await updateOEM(oemId, { name: editingOemName })
      setOems(oems.map(o => o.id === oemId ? updated : o))
      setEditingOemId(null)
    } catch (error) {
      console.error("Failed to update OEM:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteOem = async (oemId: string) => {
    if (!confirm("Delete this OEM? This cannot be undone.")) return
    setIsSaving(true)
    try {
      await deleteOEM(oemId)
      setOems(oems.filter(o => o.id !== oemId))
    } catch (error) {
      console.error("Failed to delete OEM:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const startEditingOem = (oem: OEM) => {
    setEditingOemId(oem.id)
    setEditingOemName(oem.name)
  }

  // Activity Type handlers
  const handleAddActivityType = async () => {
    if (!newActivityTypeName.trim()) return
    setIsSaving(true)
    try {
      const activityType = await createActivityType({
        name: newActivityTypeName,
        description: newActivityTypeDescription || undefined,
      })
      setActivityTypes([...activityTypes, activityType].sort((a, b) => a.display_order - b.display_order))
      setNewActivityTypeName("")
      setNewActivityTypeDescription("")
      setIsAddingActivityType(false)
    } catch (error) {
      console.error("Failed to add activity type:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateActivityType = async (activityTypeId: string) => {
    if (!editingActivityTypeName.trim()) return
    setIsSaving(true)
    try {
      const updated = await updateActivityType(activityTypeId, {
        name: editingActivityTypeName,
        description: editingActivityTypeDescription || undefined,
      })
      setActivityTypes(activityTypes.map(at => at.id === activityTypeId ? updated : at))
      setEditingActivityTypeId(null)
    } catch (error) {
      console.error("Failed to update activity type:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteActivityType = async (activityTypeId: string) => {
    if (!confirm("Delete this activity type? Existing engagements using this type may be affected.")) return
    setIsSaving(true)
    try {
      await deleteActivityType(activityTypeId)
      setActivityTypes(activityTypes.filter(at => at.id !== activityTypeId))
    } catch (error) {
      console.error("Failed to delete activity type:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const startEditingActivityType = (activityType: ActivityType) => {
    setEditingActivityTypeId(activityType.id)
    setEditingActivityTypeName(activityType.name)
    setEditingActivityTypeDescription(activityType.description || "")
  }

  // Team handlers
  const handleAddTeam = async () => {
    if (!newTeamName.trim() || !activeOrg?.id) return
    setIsSaving(true)
    try {
      const team = await createTeam({
        org_id: activeOrg.id,
        name: newTeamName,
        description: newTeamDescription || undefined,
      })
      setTeams([...teams, team].sort((a, b) => a.name.localeCompare(b.name)))
      setNewTeamName("")
      setNewTeamDescription("")
      setIsAddingTeam(false)
    } catch (error) {
      console.error("Failed to add team:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateTeam = async (teamId: string) => {
    if (!editingTeamName.trim()) return
    setIsSaving(true)
    try {
      const updated = await updateTeam(teamId, {
        name: editingTeamName,
        description: editingTeamDescription || undefined,
      })
      setTeams(teams.map(t => t.id === teamId ? updated : t))
      setEditingTeamId(null)
    } catch (error) {
      console.error("Failed to update team:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Delete this team? This will remove all members. This cannot be undone.")) return
    setIsSaving(true)
    try {
      await deleteTeam(teamId)
      setTeams(teams.filter(t => t.id !== teamId))
      if (expandedTeamId === teamId) setExpandedTeamId(null)
    } catch (error) {
      console.error("Failed to delete team:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const startEditingTeam = (team: Team) => {
    setEditingTeamId(team.id)
    setEditingTeamName(team.name)
    setEditingTeamDescription(team.description || "")
  }

  const toggleTeamExpanded = async (teamId: string) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null)
    } else {
      setExpandedTeamId(teamId)
      // Load members if not already loaded
      if (!teamMembers[teamId]) {
        try {
          const members = await getTeamMembers(teamId)
          setTeamMembers(prev => ({ ...prev, [teamId]: members }))
        } catch (error) {
          console.error("Failed to load team members:", error)
        }
      }
    }
  }

  const handleAddMember = async (teamId: string) => {
    if (!newMemberUserId) return
    setIsSaving(true)
    try {
      await addTeamMember(teamId, newMemberUserId, newMemberRole)
      // Reload members
      const members = await getTeamMembers(teamId)
      setTeamMembers(prev => ({ ...prev, [teamId]: members }))
      setIsAddingMember(null)
      setNewMemberUserId("")
      setNewMemberRole("tsa")
    } catch (error) {
      console.error("Failed to add member:", error)
      // Extract meaningful error message
      const errorMessage = error instanceof Error
        ? (error.message.includes('Server Components') ? 'User may already be a member of this team' : error.message)
        : 'Failed to add member'
      alert(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateMemberRole = async (teamId: string, userId: string, role: TeamRole) => {
    setIsSaving(true)
    try {
      await updateTeamMemberRole(teamId, userId, role)
      // Reload members
      const members = await getTeamMembers(teamId)
      setTeamMembers(prev => ({ ...prev, [teamId]: members }))
    } catch (error) {
      console.error("Failed to update member role:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveMember = async (teamId: string, userId: string) => {
    if (!confirm("Remove this member from the team?")) return
    setIsSaving(true)
    try {
      await removeTeamMember(teamId, userId)
      // Reload members
      const members = await getTeamMembers(teamId)
      setTeamMembers(prev => ({ ...prev, [teamId]: members }))
    } catch (error) {
      console.error("Failed to remove member:", error)
      alert((error as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  // Get profiles that aren't already members of a team
  const getAvailableProfiles = (teamId: string) => {
    const memberIds = (teamMembers[teamId] || []).map(m => m.user_id)
    return profiles.filter(p => !memberIds.includes(p.id))
  }

  if (isLoadingTeam || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!isOrgAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-500">You must be an organization admin to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Settings</h1>
        <p className="text-sm text-slate-500">Manage domains, OEMs, and system configuration</p>
      </header>

      <div className="p-8 max-w-4xl mx-auto space-y-8">
        {/* Domains */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Domains</CardTitle>
                <CardDescription>Technology domains used to categorize engagements</CardDescription>
              </div>
              {!isAddingDomain && (
                <Button variant="outline" size="sm" onClick={() => setIsAddingDomain(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Domain
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Add new domain form */}
              {isAddingDomain && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Input
                    placeholder="Domain name..."
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Select value={newDomainColor} onValueChange={setNewDomainColor}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAIN_COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          {color.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddDomain} disabled={isSaving || !newDomainName.trim()}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingDomain(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Domain list */}
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  {editingDomainId === domain.id ? (
                    <>
                      <Input
                        value={editingDomainName}
                        onChange={(e) => setEditingDomainName(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Select value={editingDomainColor} onValueChange={setEditingDomainColor}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOMAIN_COLORS.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              {color.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => handleUpdateDomain(domain.id)} disabled={isSaving}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingDomainId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge variant={domain.color as "default" | "cloud" | "security" | "network" | "infra" | "warning" | "primary"}>
                        {domain.name}
                      </Badge>
                      <span className="flex-1" />
                      <Button size="sm" variant="ghost" onClick={() => startEditingDomain(domain)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteDomain(domain.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}

              {domains.length === 0 && !isAddingDomain && (
                <p className="text-sm text-slate-500 text-center py-4">No domains configured</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* OEMs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>OEMs / Vendors</CardTitle>
                <CardDescription>Technology vendors and partners tracked in engagements</CardDescription>
              </div>
              {!isAddingOem && (
                <Button variant="outline" size="sm" onClick={() => setIsAddingOem(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add OEM
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Add new OEM form */}
              {isAddingOem && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Input
                    placeholder="OEM name..."
                    value={newOemName}
                    onChange={(e) => setNewOemName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleAddOem} disabled={isSaving || !newOemName.trim()}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingOem(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* OEM list */}
              <div className="grid grid-cols-2 gap-2">
                {oems.map((oem) => (
                  <div
                    key={oem.id}
                    className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    {editingOemId === oem.id ? (
                      <>
                        <Input
                          value={editingOemName}
                          onChange={(e) => setEditingOemName(e.target.value)}
                          className="flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleUpdateOem(oem.id)} disabled={isSaving}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingOemId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-slate-700">{oem.name}</span>
                        <Button size="sm" variant="ghost" onClick={() => startEditingOem(oem)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteOem(oem.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {oems.length === 0 && !isAddingOem && (
                <p className="text-sm text-slate-500 text-center py-4">No OEMs configured</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Teams */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Teams</CardTitle>
                <CardDescription>Manage teams and their members in your organization</CardDescription>
              </div>
              {!isAddingTeam && (
                <Button variant="outline" size="sm" onClick={() => setIsAddingTeam(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Team
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Add new team form */}
              {isAddingTeam && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                  <Input
                    placeholder="Team name..."
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    autoFocus
                  />
                  <Input
                    placeholder="Description (optional)..."
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddTeam} disabled={isSaving || !newTeamName.trim()}>
                      <Check className="h-4 w-4 mr-1" />
                      Create Team
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setIsAddingTeam(false); setNewTeamName(""); setNewTeamDescription(""); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Team list */}
              {teams.map((team) => (
                <div key={team.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  {/* Team header row */}
                  <div className="flex items-center gap-2 p-3 bg-white hover:bg-slate-50 transition-colors">
                    <button
                      onClick={() => toggleTeamExpanded(team.id)}
                      className="p-1 hover:bg-slate-100 rounded"
                    >
                      {expandedTeamId === team.id ? (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      )}
                    </button>

                    {editingTeamId === team.id ? (
                      <>
                        <div className="flex-1 space-y-2">
                          <Input
                            value={editingTeamName}
                            onChange={(e) => setEditingTeamName(e.target.value)}
                            placeholder="Team name"
                            autoFocus
                          />
                          <Input
                            value={editingTeamDescription}
                            onChange={(e) => setEditingTeamDescription(e.target.value)}
                            placeholder="Description (optional)"
                          />
                        </div>
                        <Button size="sm" onClick={() => handleUpdateTeam(team.id)} disabled={isSaving}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTeamId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{team.name}</div>
                          {team.description && (
                            <div className="text-sm text-slate-500">{team.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-sm">
                          <Users className="h-4 w-4" />
                          {teamMembers[team.id]?.length || "..."}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => startEditingTeam(team)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteTeam(team.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Expanded members section */}
                  {expandedTeamId === team.id && (
                    <div className="border-t border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-700">Team Members</span>
                        {isAddingMember !== team.id && teamMembers[team.id] && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsAddingMember(team.id)}
                            disabled={getAvailableProfiles(team.id).length === 0}
                            title={getAvailableProfiles(team.id).length === 0 ? "All users are already members" : undefined}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Member
                          </Button>
                        )}
                      </div>

                      {/* Add member form */}
                      {isAddingMember === team.id && (
                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200 mb-3">
                          <Select value={newMemberUserId} onValueChange={setNewMemberUserId}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select user..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableProfiles(team.id).map((profile) => (
                                <SelectItem key={profile.id} value={profile.id}>
                                  {profile.full_name} ({profile.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={newMemberRole} onValueChange={(v) => setNewMemberRole(v as TeamRole)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tsa">TSA</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={() => handleAddMember(team.id)} disabled={isSaving || !newMemberUserId}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setIsAddingMember(null); setNewMemberUserId(""); }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Members list */}
                      <div className="space-y-2">
                        {(teamMembers[team.id] || []).map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-900">
                                {member.user?.full_name || "Unknown"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {member.user?.email}
                              </div>
                            </div>
                            <Select
                              value={member.role}
                              onValueChange={(role) => handleUpdateMemberRole(team.id, member.user_id, role as TeamRole)}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tsa">TSA</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                              onClick={() => handleRemoveMember(team.id, member.user_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {teamMembers[team.id]?.length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-2">No members yet</p>
                        )}
                        {teamMembers[team.id] && teamMembers[team.id].length > 0 && getAvailableProfiles(team.id).length === 0 && (
                          <p className="text-xs text-slate-400 text-center pt-2">All organization users are already members of this team</p>
                        )}
                        {!teamMembers[team.id] && (
                          <div className="flex justify-center py-2">
                            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {teams.length === 0 && !isAddingTeam && (
                <p className="text-sm text-slate-500 text-center py-4">No teams configured</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Types */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity Types</CardTitle>
                <CardDescription>Types of customer engagements used in the Stream</CardDescription>
              </div>
              {!isAddingActivityType && (
                <Button variant="outline" size="sm" onClick={() => setIsAddingActivityType(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Activity Type
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Add new activity type form */}
              {isAddingActivityType && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                  <Input
                    placeholder="Activity type name..."
                    value={newActivityTypeName}
                    onChange={(e) => setNewActivityTypeName(e.target.value)}
                    autoFocus
                  />
                  <Input
                    placeholder="Description (optional)..."
                    value={newActivityTypeDescription}
                    onChange={(e) => setNewActivityTypeDescription(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddActivityType} disabled={isSaving || !newActivityTypeName.trim()}>
                      <Check className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setIsAddingActivityType(false); setNewActivityTypeName(""); setNewActivityTypeDescription(""); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Activity type list */}
              {activityTypes.map((activityType) => (
                <div
                  key={activityType.id}
                  className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  {editingActivityTypeId === activityType.id ? (
                    <>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editingActivityTypeName}
                          onChange={(e) => setEditingActivityTypeName(e.target.value)}
                          placeholder="Activity type name"
                          autoFocus
                        />
                        <Input
                          value={editingActivityTypeDescription}
                          onChange={(e) => setEditingActivityTypeDescription(e.target.value)}
                          placeholder="Description (optional)"
                        />
                      </div>
                      <Button size="sm" onClick={() => handleUpdateActivityType(activityType.id)} disabled={isSaving}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingActivityTypeId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{activityType.name}</div>
                        {activityType.description && (
                          <div className="text-sm text-slate-500">{activityType.description}</div>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => startEditingActivityType(activityType)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteActivityType(activityType.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}

              {activityTypes.length === 0 && !isAddingActivityType && (
                <p className="text-sm text-slate-500 text-center py-4">No activity types configured</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
