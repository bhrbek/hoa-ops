"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Flag,
  Folder,
  Link2,
  Users,
  MoreVertical,
  Calendar,
  Loader2,
  RefreshCw,
  Pencil,
  Archive,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatCompactCurrency, formatShortDate } from "@/lib/utils"
import { RichTextDisplay } from "@/components/ui/rich-text-editor"
import { useTeam } from "@/contexts/team-context"
import { getActiveRocks, createRock, updateRock, deleteRock } from "@/app/actions/rocks"
import { createProject, updateProject } from "@/app/actions/projects"
import { getActiveEngagements } from "@/app/actions/engagements"
import { CreateRockDialog } from "@/components/climb/create-rock-dialog"
import { CreateProjectDialog } from "@/components/climb/create-project-dialog"
import { EditRockDialog } from "@/components/climb/edit-rock-dialog"
import { EditProjectDialog } from "@/components/climb/edit-project-dialog"
import { toast } from "sonner"
import type { RockWithProjects, EngagementWithRelations, Rock, RockStatus, Project, ProjectStatus } from "@/types/supabase"

// Avatar color palette for consistent user colors
const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
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

type UIRock = {
  id: string
  title: string
  quarter: string
  status: string
  perfectOutcome: string
  worstOutcome: string | null
  progress: number
  owner: { name: string; initials: string; color: string }
  projects: {
    id: string
    title: string
    owner: { name: string; initials: string; color: string }
    startDate: string
    endDate: string
    status: string
    estimatedHours: number
  }[]
  evidence: {
    id: string
    customer: string
    type: string
    date: string
    revenue: number
  }[]
}

function transformRock(rock: RockWithProjects, engagements: EngagementWithRelations[]): UIRock {
  const ownerName = rock.owner?.full_name || 'Unknown'
  const ownerId = rock.owner?.id || rock.owner_id || rock.id

  // Filter engagements linked to this rock
  const linkedEngagements = engagements.filter(e => e.rock_id === rock.id)

  return {
    id: rock.id,
    title: rock.title,
    quarter: rock.quarter,
    status: rock.status,
    perfectOutcome: rock.perfect_outcome,
    worstOutcome: rock.worst_outcome,
    progress: rock.progress_override ?? 0,
    owner: {
      name: ownerName,
      initials: getInitials(ownerName),
      color: getAvatarColor(ownerId),
    },
    projects: (rock.projects || [])
      .filter(p => !p.deleted_at)
      .map(p => {
        const projOwnerName = (p as { owner?: { full_name: string } }).owner?.full_name || 'Unknown'
        const projOwnerId = p.owner_id || p.id
        return {
          id: p.id,
          title: p.title,
          owner: {
            name: projOwnerName,
            initials: getInitials(projOwnerName),
            color: getAvatarColor(projOwnerId),
          },
          startDate: p.start_date || new Date().toISOString().split('T')[0],
          endDate: p.end_date || new Date().toISOString().split('T')[0],
          status: p.status,
          estimatedHours: p.estimated_hours,
        }
      }),
    evidence: linkedEngagements.map(e => ({
      id: e.id,
      customer: e.customer?.name || e.customer_name,
      type: e.activity_type,
      date: e.date,
      revenue: e.revenue_impact,
    })),
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case "On Track":
      return {
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        badge: "success",
      }
    case "At Risk":
      return {
        icon: AlertTriangle,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        badge: "warning",
      }
    case "Off Track":
      return {
        icon: Clock,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        badge: "destructive",
      }
    default:
      return {
        icon: CheckCircle2,
        color: "text-slate-600",
        bg: "bg-slate-50",
        border: "border-slate-200",
        badge: "default",
      }
  }
}

// Calculate Gantt bar position (simplified for Q1)
function getGanttPosition(startDate: string, endDate: string) {
  const qStart = new Date("2026-01-01")
  const qEnd = new Date("2026-03-31")
  const qDuration = qEnd.getTime() - qStart.getTime()

  const start = new Date(startDate)
  const end = new Date(endDate)

  const startPercent = Math.max(0, (start.getTime() - qStart.getTime()) / qDuration) * 100
  const endPercent = Math.min(100, (end.getTime() - qStart.getTime()) / qDuration) * 100
  const widthPercent = endPercent - startPercent

  return { left: `${startPercent}%`, width: `${widthPercent}%` }
}

export default function RocksPage() {
  const [expandedRocks, setExpandedRocks] = React.useState<string[]>([])
  const [rocks, setRocks] = React.useState<UIRock[]>([])
  const [rawRocks, setRawRocks] = React.useState<RockWithProjects[]>([])
  const [isLoadingData, setIsLoadingData] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = React.useState(false)
  const [selectedRockId, setSelectedRockId] = React.useState<string | undefined>()
  const [editingRock, setEditingRock] = React.useState<Rock | null>(null)
  const [editingProject, setEditingProject] = React.useState<{ project: Project; rockTitle: string } | null>(null)
  const { activeTeam, isLoading } = useTeam()

  // Function to fetch/refresh data
  // showLoading: if false, refresh silently in background (preserves view context)
  const fetchData = React.useCallback(async (showLoading = true) => {
    if (!activeTeam) {
      setRocks([])
      setRawRocks([])
      setIsLoadingData(false)
      setError(null)
      return
    }

    if (showLoading) {
      setIsLoadingData(true)
    }
    setError(null)
    try {
      // Fetch rocks and engagements in parallel
      const [rocksData, engagementsData] = await Promise.all([
        getActiveRocks(),
        getActiveEngagements({ limit: 500 })
      ])

      setRawRocks(rocksData)
      const transformedRocks = rocksData.map(rock => transformRock(rock, engagementsData))
      setRocks(transformedRocks)

      // Auto-expand first rock only on initial load (when showLoading is true)
      if (showLoading && transformedRocks.length > 0 && expandedRocks.length === 0) {
        setExpandedRocks([transformedRocks[0].id])
      }
    } catch (err) {
      console.error('Failed to fetch rocks:', err)
      if (showLoading) {
        // Only clear data on initial load failure, not background refresh
        setRocks([])
        setRawRocks([])
      }
      setError('Failed to load rocks. Please try again.')
    } finally {
      if (showLoading) {
        setIsLoadingData(false)
      }
    }
  }, [activeTeam?.id])

  // Fetch rocks and engagements when team changes
  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle creating a new rock
  const handleCreateRock = async (data: {
    team_id: string
    title: string
    owner_id: string
    quarter: string
    perfect_outcome: string
    worst_outcome?: string
  }) => {
    const newRock = await createRock(data)
    // Silent refresh - preserves expanded state and scroll position
    await fetchData(false)
    // Auto-expand the newly created rock
    setExpandedRocks(prev => [...prev, newRock.id])
  }

  // Handle creating a new project
  const handleCreateProject = async (data: {
    rock_id: string
    title: string
    owner_id: string
    start_date: string
    end_date: string
    estimated_hours: number
  }) => {
    await createProject(data)
    // Silent refresh - preserves expanded state and scroll position
    await fetchData(false)
  }

  // Open project dialog with a specific rock selected
  const openProjectDialog = (rockId: string) => {
    setSelectedRockId(rockId)
    setIsProjectDialogOpen(true)
  }

  const toggleRock = (rockId: string) => {
    setExpandedRocks((prev) =>
      prev.includes(rockId)
        ? prev.filter((id) => id !== rockId)
        : [...prev, rockId]
    )
  }

  // Handle changing rock status
  const handleStatusChange = async (rockId: string, newStatus: RockStatus) => {
    try {
      await updateRock(rockId, { status: newStatus })
      toast.success(`Rock marked as ${newStatus}`)
      await fetchData()
    } catch (err) {
      console.error('Failed to update rock status:', err)
      toast.error('Failed to update rock status')
    }
  }

  // Handle archiving (soft delete) a rock
  const handleArchiveRock = async (rockId: string) => {
    if (!confirm('Are you sure you want to archive this rock? This action can be undone by an admin.')) {
      return
    }
    try {
      await deleteRock(rockId)
      toast.success('Rock archived successfully')
      await fetchData()
    } catch (err) {
      console.error('Failed to archive rock:', err)
      toast.error('Failed to archive rock')
    }
  }

  // Handle opening edit dialog for a rock
  const openEditDialog = (rock: RockWithProjects) => {
    // Convert RockWithProjects to Rock for the edit dialog
    const rockData: Rock = {
      id: rock.id,
      team_id: rock.team_id,
      title: rock.title,
      owner_id: rock.owner_id,
      quarter: rock.quarter,
      status: rock.status,
      perfect_outcome: rock.perfect_outcome,
      worst_outcome: rock.worst_outcome,
      progress_override: rock.progress_override,
      created_at: rock.created_at,
      updated_at: rock.updated_at,
      deleted_at: rock.deleted_at,
      deleted_by: rock.deleted_by,
    }
    setEditingRock(rockData)
    setIsEditDialogOpen(true)
  }

  // Handle saving rock edits
  const handleEditRock = async (rockId: string, data: {
    title?: string
    owner_id?: string
    status?: RockStatus
    perfect_outcome?: string
    worst_outcome?: string
  }) => {
    await updateRock(rockId, data)
    // Silent refresh - preserves expanded state
    await fetchData(false)
  }

  // Handle opening edit dialog for a project
  const openEditProjectDialog = (project: Project, rockTitle: string) => {
    setEditingProject({ project, rockTitle })
    setIsEditProjectDialogOpen(true)
  }

  // Handle saving project edits
  const handleEditProject = async (projectId: string, data: {
    title?: string
    owner_id?: string
    status?: ProjectStatus
    start_date?: string
    end_date?: string
    estimated_hours?: number
  }) => {
    await updateProject(projectId, data)
    // Silent refresh - preserves expanded state
    await fetchData(false)
  }

  const isPageLoading = isLoading || isLoadingData

  // Calculate summary stats
  const avgProgress = rocks.length > 0
    ? Math.round(rocks.reduce((sum, r) => sum + r.progress, 0) / rocks.length)
    : 0
  const atRiskCount = rocks.filter(r => r.status === 'At Risk' || r.status === 'Off Track').length

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm uppercase tracking-wider mb-1">
              <Calendar className="h-4 w-4" />
              Q1 2026
              {activeTeam && (
                <span className="ml-2 text-slate-400 font-normal normal-case">
                  ({activeTeam.name})
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rocks</h1>
            <p className="text-sm text-slate-500">
              Track your quarterly Rocks, supporting projects, and Build Signals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* KPI Summary */}
            <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="text-xs text-slate-500">Avg Progress</p>
                <p className="text-lg font-bold text-slate-900">{avgProgress}%</p>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <p className="text-xs text-slate-500">At Risk</p>
                <p className={cn("text-lg font-bold", atRiskCount > 0 ? "text-amber-600" : "text-slate-400")}>
                  {atRiskCount}
                </p>
              </div>
            </div>
            <Button variant="primary" className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Rock
            </Button>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <Button variant="secondary" size="sm" className="gap-2">
            All Owners
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            Status: On Track
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Rocks Accordion */}
        {isPageLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <span className="ml-3 text-slate-500">Loading rocks...</span>
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
        ) : rocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Flag className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Rocks Yet</h3>
            <p className="text-sm text-slate-500 max-w-md mb-4">
              Rocks represent your quarterly strategic priorities. Create your first Rock to start tracking capability creation.
            </p>
            <Button variant="primary" className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Your First Rock
            </Button>
          </div>
        ) : (
        <div className="space-y-4">
          {rocks.map((rock) => {
            const isExpanded = expandedRocks.includes(rock.id)
            const statusConfig = getStatusConfig(rock.status)
            const StatusIcon = statusConfig.icon

            // Warning: High activity, low build
            const highActivityLowBuild =
              rock.evidence.length > 5 && rock.progress < 10

            return (
              <Card
                key={rock.id}
                className={cn(
                  "overflow-hidden transition-all",
                  isExpanded && "shadow-lg"
                )}
              >
                {/* Rock Header */}
                <div
                  className="p-5 flex items-start gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleRock(rock.id)}
                >
                  {/* Expand Toggle */}
                  <button className="mt-1 text-slate-400 hover:text-slate-600 transition-colors">
                    {isExpanded ? (
                      <ChevronDown className="h-6 w-6" />
                    ) : (
                      <ChevronRight className="h-6 w-6" />
                    )}
                  </button>

                  {/* Icon */}
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-white">
                    <Flag className="h-6 w-6" />
                  </div>

                  {/* Title & Meta */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900">{rock.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="default" className="text-xs">ROCK</Badge>
                      <span className="text-sm text-slate-500">Owner: {rock.owner.name}</span>
                      <span className="text-sm text-slate-400">•</span>
                      <span className="text-sm text-slate-500">{rock.quarter}</span>
                    </div>
                  </div>

                  {/* Status & Progress */}
                  <div className="flex items-center gap-6">
                    {/* Owner Avatar */}
                    <Avatar className={`h-8 w-8 ${rock.owner.color}`}>
                      <AvatarFallback className={rock.owner.color}>
                        {rock.owner.initials}
                      </AvatarFallback>
                    </Avatar>

                    {/* Progress */}
                    <div className="w-32">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-semibold text-slate-700">{rock.progress}%</span>
                      </div>
                      <Progress
                        value={rock.progress}
                        className="h-2"
                        indicatorClassName={
                          rock.status === "At Risk"
                            ? "bg-amber-500"
                            : rock.progress >= 80
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                        }
                      />
                    </div>

                    {/* Status Badge */}
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold",
                        statusConfig.bg,
                        statusConfig.color,
                        `border ${statusConfig.border}`
                      )}
                    >
                      <StatusIcon className="h-4 w-4" />
                      {rock.status}
                    </div>

                    {/* Rock Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Rock actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            const rawRock = rawRocks.find(r => r.id === rock.id)
                            if (rawRock) openEditDialog(rawRock)
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Rock
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {rock.status !== 'Done' && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(rock.id, 'Done')
                            }}
                            className="text-emerald-600"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark as Done
                          </DropdownMenuItem>
                        )}
                        {rock.status !== 'On Track' && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(rock.id, 'On Track')
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark On Track
                          </DropdownMenuItem>
                        )}
                        {rock.status !== 'At Risk' && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(rock.id, 'At Risk')
                            }}
                            className="text-amber-600"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Mark At Risk
                          </DropdownMenuItem>
                        )}
                        {rock.status !== 'Off Track' && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(rock.id, 'Off Track')
                            }}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Mark Off Track
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleArchiveRock(rock.id)
                          }}
                          className="text-slate-500"
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive Rock
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50">
                    {/* Outcomes Section */}
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Perfect Outcome */}
                      <div className="p-4 rounded-lg border-2 border-emerald-200 bg-emerald-50/50">
                        <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Perfect Outcome
                        </div>
                        <RichTextDisplay
                          content={rock.perfectOutcome}
                          className="text-sm text-slate-700"
                        />
                      </div>

                      {/* Worst Outcome */}
                      <div className="p-4 rounded-lg border-2 border-red-200 bg-red-50/50">
                        <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          Worst Outcome
                        </div>
                        <RichTextDisplay
                          content={rock.worstOutcome || ""}
                          className="text-sm text-slate-700"
                        />
                      </div>
                    </div>

                    {/* Projects Section (Gantt) */}
                    <div className="px-5 pb-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          Supporting Projects
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 gap-1"
                          onClick={() => openProjectDialog(rock.id)}
                        >
                          <Plus className="h-4 w-4" />
                          Add Project
                        </Button>
                      </div>

                      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        {/* Gantt Header */}
                        <div className="grid grid-cols-[240px_1fr] border-b border-slate-200 bg-slate-50">
                          <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">
                            Project
                          </div>
                          <div className="px-4 py-2 grid grid-cols-3 text-xs font-semibold text-slate-400 uppercase">
                            <span>Jan</span>
                            <span className="text-center">Feb</span>
                            <span className="text-right">Mar</span>
                          </div>
                        </div>

                        {/* Gantt Rows */}
                        {rock.projects.map((project) => {
                          const ganttPos = getGanttPosition(project.startDate, project.endDate)
                          // Find raw project data for editing
                          const rawRock = rawRocks.find(r => r.id === rock.id)
                          const rawProject = rawRock?.projects?.find(p => p.id === project.id)
                          return (
                            <div
                              key={project.id}
                              className="grid grid-cols-[240px_1fr] border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group"
                            >
                              {/* Project Info */}
                              <div className="px-4 py-3 flex items-center gap-3">
                                <Avatar className={`h-6 w-6 ${project.owner.color}`}>
                                  <AvatarFallback className={`text-[10px] ${project.owner.color}`}>
                                    {project.owner.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-slate-900 truncate">
                                    {project.title}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatShortDate(project.startDate)} - {formatShortDate(project.endDate)}
                                  </p>
                                </div>
                                {/* Edit button - appears on hover */}
                                {rawProject && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openEditProjectDialog(rawProject as Project, rock.title)
                                    }}
                                  >
                                    <Pencil className="h-3 w-3" />
                                    <span className="sr-only">Edit project</span>
                                  </Button>
                                )}
                              </div>

                              {/* Gantt Bar */}
                              <div className="px-4 py-3 relative">
                                <div className="h-6 relative bg-slate-100 rounded">
                                  <div
                                    className={cn(
                                      "absolute h-full rounded transition-all",
                                      project.status === "Done"
                                        ? "bg-emerald-400"
                                        : "bg-blue-400"
                                    )}
                                    style={ganttPos}
                                  />
                                  {/* Today marker */}
                                  <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                                    style={{ left: "5%" }}
                                    title="Today"
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Evidence Locker */}
                    <div className="px-5 pb-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Link2 className="h-4 w-4" />
                          Evidence Locker
                          {highActivityLowBuild && (
                            <Badge variant="warning" className="ml-2 gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              High Activity / Low Build
                            </Badge>
                          )}
                        </h4>
                        <span className="text-xs text-slate-400">
                          {rock.evidence.length} linked engagements
                        </span>
                      </div>

                      {rock.evidence.length > 0 ? (
                        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                          {rock.evidence.map((ev) => (
                            <div
                              key={ev.id}
                              className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-slate-100">
                                  <Users className="h-4 w-4 text-slate-500" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{ev.customer}</p>
                                  <p className="text-xs text-slate-500">
                                    {ev.type} • {formatShortDate(ev.date)}
                                  </p>
                                </div>
                              </div>
                              {ev.revenue > 0 && (
                                <span className="text-sm font-semibold text-emerald-600">
                                  {formatCompactCurrency(ev.revenue)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg border border-dashed border-slate-300 p-6 text-center">
                          <Link2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">No engagements linked yet</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Link engagements from The Stream to build evidence
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
        )}

        {/* Add New Rock */}
        <div
          onClick={() => setIsCreateDialogOpen(true)}
          className="mt-6 border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mb-3">
            <Plus className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Add Another Rock</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Define a new quarterly goal to track. Remember, less is more—aim for 3-7 Rocks per quarter.
          </p>
        </div>
      </div>

      {/* Create Rock Dialog */}
      <CreateRockDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreateRock}
      />

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        defaultRockId={selectedRockId}
        rocks={rawRocks as Rock[]}
        onSave={handleCreateProject}
      />

      {/* Edit Rock Dialog */}
      {editingRock && (
        <EditRockDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) setEditingRock(null)
          }}
          rock={editingRock}
          onSave={handleEditRock}
        />
      )}

      {/* Edit Project Dialog */}
      {editingProject && (
        <EditProjectDialog
          open={isEditProjectDialogOpen}
          onOpenChange={(open) => {
            setIsEditProjectDialogOpen(open)
            if (!open) setEditingProject(null)
          }}
          project={editingProject.project}
          rockTitle={editingProject.rockTitle}
          onSave={handleEditProject}
        />
      )}
    </div>
  )
}
