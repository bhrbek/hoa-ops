"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Shield,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTeam } from "@/contexts/team-context"
import { cn } from "@/lib/utils"
import { getActiveCommitments, createCommitment } from "@/app/actions/commitments"
import { CreateCommitmentDialog } from "@/components/commitment/create-commitment-dialog"
import type { CommitmentStatus, CommitmentWithRelations } from "@/types/supabase"

// Avatar color palette for consistent user colors
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-cyan-100 text-cyan-700",
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash = hash & hash
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

interface UICommitment {
  id: string
  title: string
  definitionOfDone: string
  project: string
  buildSignal: string
  status: CommitmentStatus
  ownerId: string
}

interface UITeamMember {
  id: string
  name: string
  initials: string
  color: string
  commitmentCount: number
}

function transformCommitment(commitment: CommitmentWithRelations): UICommitment {
  return {
    id: commitment.id,
    title: commitment.definition_of_done.slice(0, 50) + (commitment.definition_of_done.length > 50 ? '...' : ''),
    definitionOfDone: commitment.definition_of_done,
    project: commitment.project?.title || 'Unknown Project',
    buildSignal: commitment.build_signal?.title || 'Unknown Signal',
    status: commitment.status,
    ownerId: commitment.owner_id,
  }
}

function getStatusIcon(status: CommitmentStatus) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
    case "blocked":
      return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
    case "slipped":
      return <Clock className="h-3.5 w-3.5 text-amber-500" />
    default:
      return <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />
  }
}

function getStatusBadge(status: CommitmentStatus) {
  switch (status) {
    case "done":
      return <Badge variant="success">Done</Badge>
    case "blocked":
      return <Badge variant="destructive">Blocked</Badge>
    case "slipped":
      return <Badge variant="warning">Slipped</Badge>
    default:
      return <Badge variant="outline">Planned</Badge>
  }
}

function getWeekString(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  const monday = new Date(date)
  monday.setDate(date.getDate() - date.getDay() + 1) // Get Monday
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4) // Get Friday
  return `${monday.toLocaleDateString("en-US", options)} - ${friday.toLocaleDateString("en-US", options)}`
}

function getWeekOf(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export default function CommitmentBoardPage() {
  const { activeTeam, isLoading } = useTeam()
  const [currentWeek, setCurrentWeek] = React.useState(new Date())
  const [commitments, setCommitments] = React.useState<UICommitment[]>([])
  const [teamMembers, setTeamMembers] = React.useState<UITeamMember[]>([])
  const [isLoadingData, setIsLoadingData] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    if (!activeTeam) {
      setCommitments([])
      setTeamMembers([])
      setIsLoadingData(false)
      setError(null)
      return
    }

    setIsLoadingData(true)
    setError(null)
    try {
      const weekOf = getWeekOf(currentWeek)
      const data = await getActiveCommitments(weekOf)
      const transformed = data.map(transformCommitment)
      setCommitments(transformed)

      // Build team members from commitment owners
      const memberMap = new Map<string, UITeamMember>()
      data.forEach(c => {
        if (c.owner && !memberMap.has(c.owner.id)) {
          memberMap.set(c.owner.id, {
            id: c.owner.id,
            name: c.owner.full_name,
            initials: getInitials(c.owner.full_name),
            color: getAvatarColor(c.owner.id),
            commitmentCount: 0,
          })
        }
      })

      // Count commitments per member
      transformed.forEach(c => {
        const member = memberMap.get(c.ownerId)
        if (member) {
          member.commitmentCount++
        }
      })

      setTeamMembers(Array.from(memberMap.values()))
    } catch (err) {
      console.error('Failed to fetch commitments:', err)
      setCommitments([])
      setTeamMembers([])
      setError('Failed to load commitments. Please try again.')
    } finally {
      setIsLoadingData(false)
    }
  }, [activeTeam?.id, currentWeek])

  // Fetch commitments when team or week changes
  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateCommitment = async (data: {
    project_id: string
    build_signal_id: string
    definition_of_done: string
    week_of?: string
    notes?: string
  }) => {
    await createCommitment({
      ...data,
      week_of: data.week_of || getWeekOf(currentWeek),
    })
    await fetchData()
  }

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeek(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeek(newDate)
  }

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date())
  }

  const getCommitmentsForMember = (memberId: string) => {
    return commitments.filter(c => c.ownerId === memberId)
  }

  const isPageLoading = isLoading || isLoadingData

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Commitment Board
            </h1>
            <p className="text-sm text-slate-500">
              Weekly execution tracking
              {activeTeam && (
                <span className="ml-2 text-slate-400">({activeTeam.name})</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Week Navigation */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goToPreviousWeek}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="min-w-[180px]"
                onClick={goToCurrentWeek}
              >
                {getWeekString(currentWeek)}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goToNextWeek}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Flame className="h-4 w-4 text-amber-500" />
              Light Beacon
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="gap-2"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New Commitment
            </Button>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Commitment Board Grid */}
        <Card>
          <CardContent className="p-0">
            {isPageLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                <span className="ml-3 text-slate-500">Loading commitments...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to Load</h3>
                <p className="text-sm text-slate-500 max-w-md mb-4">{error}</p>
                <Button variant="outline" className="gap-2" onClick={() => fetchData()}>
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : teamMembers.length === 0 && commitments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Commitments This Week</h3>
                <p className="text-sm text-slate-500 max-w-md mb-4">
                  Create commitments to track your weekly execution against Projects and Build Signals.
                </p>
                <Button
                  variant="primary"
                  className="gap-2"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create Commitment
                </Button>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px]">
                {/* Header Row */}
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="w-48 px-4 py-3 text-left bg-slate-50">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Team Member
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left bg-slate-50">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Weekly Commitments
                      </span>
                    </th>
                  </tr>
                </thead>

                {/* Body Rows - Team Members */}
                <tbody>
                  {teamMembers.map((member) => {
                    const memberCommitments = getCommitmentsForMember(member.id)
                    const doneCount = memberCommitments.filter(c => c.status === 'done').length
                    const totalCount = memberCommitments.length

                    return (
                    <tr key={member.id} className="border-b border-slate-100">
                      {/* Member Cell */}
                      <td className="px-4 py-3 bg-slate-50 align-top">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className={cn("h-8 w-8", member.color)}>
                              <AvatarFallback className={member.color}>
                                {member.initials}
                              </AvatarFallback>
                            </Avatar>
                            {totalCount >= 5 && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                                <Shield className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {member.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {doneCount}/{totalCount} done
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Commitments Cell */}
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-2">
                          {memberCommitments.map((commitment) => (
                            <div
                              key={commitment.id}
                              className={cn(
                                "p-3 rounded-lg border text-xs transition-colors cursor-pointer hover:shadow-sm min-w-[200px] max-w-[280px]",
                                commitment.status === "done"
                                  ? "bg-emerald-50 border-emerald-200"
                                  : commitment.status === "blocked"
                                  ? "bg-red-50 border-red-200"
                                  : commitment.status === "slipped"
                                  ? "bg-amber-50 border-amber-200"
                                  : "bg-white border-slate-200 hover:border-slate-300"
                              )}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex items-center gap-1.5">
                                  {getStatusIcon(commitment.status)}
                                  <span
                                    className={cn(
                                      "font-medium",
                                      commitment.status === "done"
                                        ? "text-emerald-700 line-through"
                                        : "text-slate-700"
                                    )}
                                  >
                                    {commitment.title}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 -mr-1"
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-slate-500 mt-1 truncate">
                                {commitment.project}
                              </p>
                              <p className="text-slate-400 mt-0.5 truncate text-[10px]">
                                → {commitment.buildSignal}
                              </p>
                            </div>
                          ))}

                          {/* Add commitment button */}
                          <button
                            className="p-3 rounded-lg border border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors min-w-[100px] flex items-center justify-center gap-1"
                            onClick={() => setIsCreateDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4" />
                            <span className="text-xs">Add</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border-2 border-slate-300" />
            <span>Planned</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span>Done</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span>Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-amber-500" />
            <span>Slipped</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-blue-500" />
            <span>Shield Up (90%+ capacity)</span>
          </div>
        </div>

        {/* Rules Reminder */}
        <div className="mt-6 p-4 bg-slate-100 rounded-lg text-center text-xs text-slate-500">
          <p>
            <strong>Commitment Rules:</strong> Each commitment must link to a{" "}
            <span className="font-semibold">Project</span> and a{" "}
            <span className="font-semibold">Build Signal</span>. Commitments
            never link to Engagements.
          </p>
        </div>
      </div>

      {/* Create Commitment Dialog */}
      <CreateCommitmentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreateCommitment}
        weekOf={getWeekOf(currentWeek)}
      />
    </div>
  )
}
