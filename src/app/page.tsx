"use client"

import * as React from "react"
import Link from "next/link"
import {
  Calendar,
  TrendingUp,
  Users,
  ChevronRight,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatShortDate } from "@/lib/utils"
import { EngagementDrawer } from "@/components/stream/engagement-drawer"
import { useTeam } from "@/contexts/team-context"
import { getActiveRocks } from "@/app/actions/rocks"
import { getActiveIssues, getActiveIssueStats } from "@/app/actions/issues"
import { VistaSkeleton } from "@/components/vista/vista-skeleton"
import type { RockWithProjects, IssueWithRelations } from "@/types/supabase"

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

// Types
interface IssueStats {
  totalIssues: number
  openIssues: number
  inProgressIssues: number
  resolvedIssues: number
  urgentIssues: number
}

interface UIRock {
  id: string
  title: string
  status: string
  progress: number
  owner: { name: string; initials: string; color: string }
  projects: { id: string; title: string; status: string }[]
}

interface UILog {
  id: string
  title: string
  type: string
  date: string
  priority: string
  status: string
}

// Mock data for sections not yet wired to real data
const myTasks = [
  { id: "t1", title: "Review Acme Corp proposal", due: "Today", priority: "high", completed: false },
  { id: "t2", title: "Prepare demo environment", due: "Tomorrow", priority: "medium", completed: false },
  { id: "t3", title: "Update capacity forecast", due: "This week", priority: "low", completed: true },
]

const capacityData = {
  water: 20, // Admin overhead (protected)
  rocks: 45, // Strategic work
  engagements: 25, // Field work
  available: 10,
}

// Transform functions
function transformRock(rock: RockWithProjects): UIRock {
  const ownerName = rock.owner?.full_name || 'Unknown'
  const ownerId = rock.owner?.id || rock.owner_id || rock.id

  return {
    id: rock.id,
    title: rock.title,
    status: rock.status,
    progress: rock.progress_override ?? 0,
    owner: {
      name: ownerName,
      initials: getInitials(ownerName),
      color: getAvatarColor(ownerId),
    },
    projects: (rock.projects || [])
      .filter(p => !p.deleted_at)
      .slice(0, 5) // Limit projects shown in dashboard
      .map(p => ({
        id: p.id,
        title: p.title,
        status: p.status === 'Done' ? 'Done' : 'Active',
      })),
  }
}

function transformToLog(e: IssueWithRelations): UILog {
  const issueType = e.issue_type || 'issue'
  return {
    id: e.id,
    title: e.title || e.customer_name || 'Untitled Issue',
    type: issueType.charAt(0).toUpperCase() + issueType.slice(1).replace('_', ' '),
    date: formatShortDate(e.date),
    priority: e.priority || 'medium',
    status: e.status || 'open',
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "on_track":
    case "On Track":
      return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" />On Track</Badge>
    case "at_risk":
    case "At Risk":
      return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" />At Risk</Badge>
    case "off_track":
    case "Off Track":
      return <Badge variant="destructive" className="gap-1">Off Track</Badge>
    default:
      return <Badge variant="default">{status}</Badge>
  }
}

export default function VistaPage() {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const { activeTeam, isLoading: isTeamLoading } = useTeam()

  // Data states
  const [stats, setStats] = React.useState<IssueStats | null>(null)
  const [rocks, setRocks] = React.useState<UIRock[]>([])
  const [recentLogs, setRecentLogs] = React.useState<UILog[]>([])
  const [isLoadingData, setIsLoadingData] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Scorecard data for HOA operations
  const scorecard = React.useMemo(() => [
    {
      title: "Total Issues",
      value: stats?.totalIssues ?? 0,
      format: "number" as const,
      change: "all time",
      icon: Users,
      href: "/stream",
    },
    {
      title: "Open Issues",
      value: stats?.openIssues ?? 0,
      format: "number" as const,
      change: "need attention",
      icon: AlertTriangle,
      href: "/stream?status=open",
    },
    {
      title: "In Progress",
      value: stats?.inProgressIssues ?? 0,
      format: "number" as const,
      change: "being worked",
      icon: TrendingUp,
      href: "/stream?status=in_progress",
    },
    {
      title: "Urgent",
      value: stats?.urgentIssues ?? 0,
      format: "number" as const,
      change: "high priority",
      icon: Clock,
      href: "/stream?priority=urgent",
    },
  ], [stats])

  const fetchData = React.useCallback(async () => {
    if (!activeTeam) {
      setStats(null)
      setRocks([])
      setRecentLogs([])
      setIsLoadingData(false)
      setError(null)
      return
    }

    setIsLoadingData(true)
    setError(null)
    try {
      const [statsData, rocksData, issuesData] = await Promise.all([
        getActiveIssueStats(),
        getActiveRocks(),
        getActiveIssues({ limit: 5 }),
      ])

      setStats(statsData)
      setRocks(rocksData.slice(0, 3).map(transformRock))
      setRecentLogs(issuesData.map(transformToLog))
    } catch (err) {
      console.error('Failed to fetch Vista data:', err)
      setStats(null)
      setRocks([])
      setRecentLogs([])
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setIsLoadingData(false)
    }
  }, [activeTeam?.id])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const isPageLoading = isTeamLoading || isLoadingData

  // Show skeleton while loading
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">The Vista</h1>
              <p className="text-sm text-slate-500">Your strategic overview</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Q1 2026
              </Button>
              <Button variant="primary" className="gap-2" onClick={() => setDrawerOpen(true)}>
                <Plus className="h-4 w-4" />
                Log Engagement
              </Button>
            </div>
          </div>
        </header>
        <div className="p-8">
          <VistaSkeleton />
        </div>
        <EngagementDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">The Vista</h1>
              <p className="text-sm text-slate-500">Your strategic overview</p>
            </div>
          </div>
        </header>
        <div className="p-8">
          <Card>
            <CardContent className="p-0">
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
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">The Vista</h1>
            <p className="text-sm text-slate-500">
              Your strategic overview
              {activeTeam && (
                <span className="ml-2 text-slate-400">({activeTeam.name})</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              Q1 2026
            </Button>
            <Button variant="primary" className="gap-2" onClick={() => setDrawerOpen(true)}>
              <Plus className="h-4 w-4" />
              Log Engagement
            </Button>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-8">
        {/* Row 1: Scorecard */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">The Scorecard</h2>
            <Badge variant="success" className="text-xs">Live</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scorecard.map((metric) => (
              <Link key={metric.title} href={metric.href}>
                <Card className="relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{metric.title}</p>
                        <p className="text-3xl font-bold text-emerald-600 mt-2">
                          {metric.value}
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-1">{metric.change}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-slate-100 transition-colors">
                        <metric.icon className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-300" />
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Row 2: Strategy & Capacity */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Rocks (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Rocks</h2>
              <Link href="/rocks">
              <Button variant="ghost" size="sm" className="text-blue-600 gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            </div>
            {rocks.length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <TrendingUp className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">No active rocks</p>
                    <p className="text-xs text-slate-400 mt-1">Create a rock to track strategic initiatives</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
            <div className="space-y-4">
              {rocks.map((rock) => (
                <Link key={rock.id} href={`/rocks?rock=${rock.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-8 w-8 ${rock.owner.color}`}>
                            <AvatarFallback className={rock.owner.color}>{rock.owner.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{rock.title}</h3>
                            <p className="text-xs text-slate-500">Owner: {rock.owner.name}</p>
                          </div>
                        </div>
                        {getStatusBadge(rock.status)}
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500">Progress</span>
                          <span className="font-semibold text-slate-700">{rock.progress}%</span>
                        </div>
                        <Progress
                          value={rock.progress}
                          className="h-2"
                          indicatorClassName={
                            rock.status === "at_risk" || rock.status === "At Risk" ? "bg-amber-500" :
                            rock.progress >= 80 ? "bg-emerald-500" : "bg-blue-500"
                          }
                        />
                      </div>

                      {/* Nested Projects */}
                      {rock.projects.length > 0 && (
                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-xs font-medium text-slate-400 uppercase mb-2">Projects</p>
                        <div className="space-y-2">
                          {rock.projects.map((project) => (
                            <div key={project.id} className="flex items-center gap-2 text-sm">
                              {project.status === "Done" ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Circle className="h-4 w-4 text-slate-300" />
                              )}
                              <span className={project.status === "Done" ? "text-slate-400 line-through" : "text-slate-700"}>
                                {project.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            )}
          </div>

          {/* Capacity Visualization (1/3 width) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">My Capacity</h2>
              <span className="text-xs text-slate-400">This Week</span>
            </div>
            <Card>
              <CardContent className="p-5">
                {/* Liquid Tank Visualization */}
                <div className="relative h-64 w-full rounded-xl bg-slate-100 overflow-hidden border-2 border-slate-200 mb-4">
                  {/* Water zone (top 20% - protected) */}
                  <div
                    className="absolute inset-x-0 top-0 bg-gradient-to-b from-sky-200 to-sky-300/80 flex items-center justify-center"
                    style={{ height: `${capacityData.water}%` }}
                  >
                    <span className="text-xs font-medium text-sky-700">Water (Admin)</span>
                  </div>

                  {/* Available space */}
                  <div
                    className="absolute inset-x-0 bg-slate-50"
                    style={{
                      top: `${capacityData.water}%`,
                      height: `${capacityData.available}%`
                    }}
                  />

                  {/* Engagements */}
                  <div
                    className="absolute inset-x-0 bg-gradient-to-t from-emerald-500 to-emerald-400 flex items-center justify-center"
                    style={{
                      bottom: `${capacityData.rocks}%`,
                      height: `${capacityData.engagements}%`
                    }}
                  >
                    <span className="text-xs font-medium text-white">Engagements</span>
                  </div>

                  {/* Rocks (Strategy) */}
                  <div
                    className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-700 to-slate-600 flex items-center justify-center"
                    style={{ height: `${capacityData.rocks}%` }}
                  >
                    <span className="text-xs font-medium text-white">Rocks (Strategy)</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-sky-300" />
                      <span className="text-slate-600">Water (Admin)</span>
                    </div>
                    <span className="font-medium text-slate-900">{capacityData.water}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-slate-600" />
                      <span className="text-slate-600">Rocks</span>
                    </div>
                    <span className="font-medium text-slate-900">{capacityData.rocks}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-emerald-500" />
                      <span className="text-slate-600">Engagements</span>
                    </div>
                    <span className="font-medium text-slate-900">{capacityData.engagements}%</span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="text-sm text-emerald-700 font-medium">
                    {capacityData.available > 0
                      ? `${capacityData.available}% capacity available`
                      : "At capacity this week"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Row 3: My Stream */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">My Stream</h2>
            <Link href="/stream">
              <Button variant="ghost" size="sm" className="text-blue-600 gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <Card>
            <Tabs defaultValue="logs" className="w-full">
              <CardHeader className="pb-0">
                <TabsList>
                  <TabsTrigger value="logs">Recent Logs</TabsTrigger>
                  <TabsTrigger value="tasks">My Tasks</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="logs" className="mt-0">
                  {recentLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Users className="h-12 w-12 text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500">No recent engagements</p>
                      <p className="text-xs text-slate-400 mt-1">Log an engagement to see it here</p>
                    </div>
                  ) : (
                  <div className="space-y-3">
                    {recentLogs.map((log) => (
                      <Link key={log.id} href="/stream">
                        <div
                          className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-blue-100 transition-colors">
                              <Users className="h-4 w-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{log.title}</p>
                              <p className="text-xs text-slate-500">{log.type} • {log.date}</p>
                            </div>
                          </div>
                          <Badge
                            variant={log.priority === 'urgent' ? 'destructive' : log.priority === 'high' ? 'warning' : 'default'}
                            className="text-xs"
                          >
                            {log.priority}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                  )}
                </TabsContent>

                <TabsContent value="tasks" className="mt-0">
                  <div className="space-y-3">
                    {myTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          task.completed
                            ? "bg-slate-50 border-slate-100"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        } transition-colors`}
                      >
                        <button className="shrink-0">
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-300 hover:text-slate-400" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            task.completed ? "text-slate-400 line-through" : "text-slate-900"
                          }`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-slate-500">Due: {task.due}</p>
                        </div>
                        {!task.completed && task.priority === "high" && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </section>
      </div>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 lg:hidden h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Engagement Drawer */}
      <EngagementDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={() => fetchData()}
      />
    </div>
  )
}
