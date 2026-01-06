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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { cn, formatCompactCurrency, formatShortDate } from "@/lib/utils"
import { useTeam } from "@/contexts/team-context"

// Mock data
const rocks = [
  {
    id: "1",
    title: "Launch Enterprise API Integration",
    quarter: "Q1 2026",
    status: "On Track",
    perfectOutcome: "5 Beta clients live by Sept 30 with full API integration, generating $500k pipeline.",
    worstOutcome: "API delayed to Q2, losing competitive window and 2 key prospects.",
    progress: 65,
    owner: { name: "Sarah J.", initials: "SJ", color: "bg-indigo-100 text-indigo-700" },
    projects: [
      {
        id: "p1",
        title: "Backend Architecture Upgrade",
        owner: { name: "Mike K.", initials: "MK", color: "bg-pink-100 text-pink-700" },
        startDate: "2026-01-01",
        endDate: "2026-02-15",
        status: "Active",
        estimatedHours: 80,
      },
      {
        id: "p2",
        title: "Client Portal UI Implementation",
        owner: { name: "Alex L.", initials: "AL", color: "bg-teal-100 text-teal-700" },
        startDate: "2026-02-01",
        endDate: "2026-03-15",
        status: "Active",
        estimatedHours: 120,
      },
      {
        id: "p3",
        title: "API Documentation & SDK",
        owner: { name: "David R.", initials: "DR", color: "bg-amber-100 text-amber-700" },
        startDate: "2026-02-15",
        endDate: "2026-03-30",
        status: "Active",
        estimatedHours: 40,
      },
    ],
    evidence: [
      { id: "e1", customer: "Acme Corp", type: "Workshop", date: "2026-01-02", revenue: 45000 },
      { id: "e2", customer: "Globex Inc", type: "Demo", date: "2025-12-28", revenue: 0 },
      { id: "e3", customer: "Initech", type: "POC", date: "2025-12-15", revenue: 125000 },
    ],
  },
  {
    id: "2",
    title: "Q1 Marketing Blitz",
    quarter: "Q1 2026",
    status: "At Risk",
    perfectOutcome: "1000 MQLs generated with 15% conversion to SQL.",
    worstOutcome: "Under 500 MQLs, pipeline gap for Q2.",
    progress: 35,
    owner: { name: "David K.", initials: "DK", color: "bg-orange-100 text-orange-700" },
    projects: [
      {
        id: "p4",
        title: "Content Campaign Launch",
        owner: { name: "Emma W.", initials: "EW", color: "bg-purple-100 text-purple-700" },
        startDate: "2026-01-05",
        endDate: "2026-02-28",
        status: "Active",
        estimatedHours: 60,
      },
      {
        id: "p5",
        title: "Webinar Series",
        owner: { name: "James K.", initials: "JK", color: "bg-blue-100 text-blue-700" },
        startDate: "2026-01-15",
        endDate: "2026-03-15",
        status: "Active",
        estimatedHours: 40,
      },
    ],
    evidence: [
      { id: "e4", customer: "Wayne Enterprises", type: "Workshop", date: "2026-01-01", revenue: 0 },
    ],
  },
  {
    id: "3",
    title: "Expand Sales Team",
    quarter: "Q1 2026",
    status: "On Track",
    perfectOutcome: "3 AEs and 2 SDRs hired and ramped by end of Q1.",
    worstOutcome: "Only 2 hires complete, 60-day ramp delay.",
    progress: 90,
    owner: { name: "Maria S.", initials: "MS", color: "bg-blue-100 text-blue-700" },
    projects: [
      {
        id: "p6",
        title: "AE Recruitment",
        owner: { name: "HR Team", initials: "HR", color: "bg-slate-100 text-slate-700" },
        startDate: "2025-12-01",
        endDate: "2026-02-15",
        status: "Done",
        estimatedHours: 100,
      },
      {
        id: "p7",
        title: "SDR Recruitment",
        owner: { name: "HR Team", initials: "HR", color: "bg-slate-100 text-slate-700" },
        startDate: "2025-12-15",
        endDate: "2026-02-28",
        status: "Done",
        estimatedHours: 60,
      },
      {
        id: "p8",
        title: "Onboarding Program",
        owner: { name: "Training", initials: "TR", color: "bg-green-100 text-green-700" },
        startDate: "2026-02-01",
        endDate: "2026-03-30",
        status: "Active",
        estimatedHours: 80,
      },
    ],
    evidence: [],
  },
]

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

export default function ClimbPage() {
  const [expandedRocks, setExpandedRocks] = React.useState<string[]>(["1"])
  const { activeTeam, isLoading } = useTeam()

  const toggleRock = (rockId: string) => {
    setExpandedRocks((prev) =>
      prev.includes(rockId)
        ? prev.filter((id) => id !== rockId)
        : [...prev, rockId]
    )
  }

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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">The Climb</h1>
            <p className="text-sm text-slate-500">
              Track your quarterly Rocks, supporting projects, and Build Signals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* KPI Summary */}
            <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="text-xs text-slate-500">Avg Progress</p>
                <p className="text-lg font-bold text-slate-900">63%</p>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <p className="text-xs text-slate-500">At Risk</p>
                <p className="text-lg font-bold text-amber-600">1</p>
              </div>
            </div>
            <Button variant="primary" className="gap-2">
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
                        <p className="text-sm text-slate-700">{rock.perfectOutcome}</p>
                      </div>

                      {/* Worst Outcome */}
                      <div className="p-4 rounded-lg border-2 border-red-200 bg-red-50/50">
                        <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          Worst Outcome
                        </div>
                        <p className="text-sm text-slate-700">{rock.worstOutcome}</p>
                      </div>
                    </div>

                    {/* Projects Section (Gantt) */}
                    <div className="px-5 pb-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          Supporting Projects
                        </h4>
                        <Button variant="ghost" size="sm" className="text-blue-600 gap-1">
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
                          return (
                            <div
                              key={project.id}
                              className="grid grid-cols-[240px_1fr] border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                            >
                              {/* Project Info */}
                              <div className="px-4 py-3 flex items-center gap-3">
                                <Avatar className={`h-6 w-6 ${project.owner.color}`}>
                                  <AvatarFallback className={`text-[10px] ${project.owner.color}`}>
                                    {project.owner.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">
                                    {project.title}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatShortDate(project.startDate)} - {formatShortDate(project.endDate)}
                                  </p>
                                </div>
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

        {/* Add New Rock */}
        <div className="mt-6 border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer group">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mb-3">
            <Plus className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Add Another Rock</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Define a new quarterly goal to track. Remember, less is more—aim for 3-7 Rocks per quarter.
          </p>
        </div>
      </div>
    </div>
  )
}
