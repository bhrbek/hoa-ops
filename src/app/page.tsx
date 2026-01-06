"use client"

import * as React from "react"
import Link from "next/link"
import { Calendar, TrendingUp, DollarSign, Users, Presentation, ChevronRight, CheckCircle2, Circle, Plus, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatCompactCurrency } from "@/lib/utils"
import { EngagementDrawer } from "@/components/stream/engagement-drawer"
import { useTeam } from "@/contexts/team-context"

// Mock data
const scorecard = [
  {
    title: "Revenue Influenced",
    value: 1250000,
    format: "currency",
    change: "+12%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Engagements",
    value: 47,
    format: "number",
    change: "+8",
    trend: "up",
    icon: Users,
  },
  {
    title: "Rock Velocity",
    value: 72,
    format: "percent",
    change: "+5%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "Workshops Delivered",
    value: 12,
    format: "number",
    change: "+3",
    trend: "up",
    icon: Presentation,
  },
]

const activeRocks = [
  {
    id: "1",
    title: "Q1 Enterprise Cloud Migration",
    owner: { name: "Sarah J.", initials: "SJ", color: "bg-blue-100 text-blue-700" },
    status: "On Track",
    progress: 65,
    projects: [
      { id: "p1", title: "AWS Architecture Design", status: "Done" },
      { id: "p2", title: "Data Migration Planning", status: "Active" },
      { id: "p3", title: "Security Compliance Review", status: "Active" },
    ],
  },
  {
    id: "2",
    title: "Network Modernization Initiative",
    owner: { name: "Mike R.", initials: "MR", color: "bg-amber-100 text-amber-700" },
    status: "At Risk",
    progress: 35,
    projects: [
      { id: "p4", title: "SD-WAN Evaluation", status: "Active" },
      { id: "p5", title: "Vendor Selection", status: "Active" },
    ],
  },
  {
    id: "3",
    title: "Security Operations Overhaul",
    owner: { name: "Alex T.", initials: "AT", color: "bg-emerald-100 text-emerald-700" },
    status: "On Track",
    progress: 90,
    projects: [
      { id: "p6", title: "SIEM Implementation", status: "Done" },
      { id: "p7", title: "Incident Response Playbook", status: "Done" },
      { id: "p8", title: "Team Training", status: "Active" },
    ],
  },
]

const myTasks = [
  { id: "t1", title: "Review Acme Corp proposal", due: "Today", priority: "high", completed: false },
  { id: "t2", title: "Prepare demo environment", due: "Tomorrow", priority: "medium", completed: false },
  { id: "t3", title: "Update capacity forecast", due: "This week", priority: "low", completed: true },
]

const recentLogs = [
  { id: "l1", customer: "Globex Inc", type: "Workshop", date: "Jan 2", revenue: 45000 },
  { id: "l2", customer: "Acme Corp", type: "Demo", date: "Jan 1", revenue: 0 },
  { id: "l3", customer: "Initech", type: "Advisory", date: "Dec 30", revenue: 125000 },
]

const capacityData = {
  water: 20, // Admin overhead (protected)
  rocks: 45, // Strategic work
  engagements: 25, // Field work
  available: 10,
}

function getStatusBadge(status: string) {
  switch (status) {
    case "On Track":
      return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" />On Track</Badge>
    case "At Risk":
      return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" />At Risk</Badge>
    case "Off Track":
      return <Badge variant="destructive" className="gap-1">Off Track</Badge>
    default:
      return <Badge variant="default">{status}</Badge>
  }
}

export default function VistaPage() {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const { activeTeam, isLoading } = useTeam()

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
              <Card key={metric.title} className="relative overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{metric.title}</p>
                      <p className="text-3xl font-bold text-emerald-600 mt-2">
                        {metric.format === "currency"
                          ? formatCompactCurrency(metric.value)
                          : metric.format === "percent"
                            ? `${metric.value}%`
                            : metric.value}
                      </p>
                      <p className="text-xs text-emerald-600 font-medium mt-1">{metric.change} this quarter</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50">
                      <metric.icon className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-300" />
              </Card>
            ))}
          </div>
        </section>

        {/* Row 2: Strategy & Capacity */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Rocks (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Rocks</h2>
              <Link href="/climb">
              <Button variant="ghost" size="sm" className="text-blue-600 gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            </div>
            <div className="space-y-4">
              {activeRocks.map((rock) => (
                <Card key={rock.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-8 w-8 ${rock.owner.color}`}>
                          <AvatarFallback className={rock.owner.color}>{rock.owner.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-slate-900">{rock.title}</h3>
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
                          rock.status === "At Risk" ? "bg-amber-500" :
                          rock.progress >= 80 ? "bg-emerald-500" : "bg-blue-500"
                        }
                      />
                    </div>

                    {/* Nested Projects */}
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
                  </CardContent>
                </Card>
              ))}
            </div>
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
          </div>
          <Card>
            <Tabs defaultValue="tasks" className="w-full">
              <CardHeader className="pb-0">
                <TabsList>
                  <TabsTrigger value="tasks">My Tasks</TabsTrigger>
                  <TabsTrigger value="logs">Recent Logs</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
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

                <TabsContent value="logs" className="mt-0">
                  <div className="space-y-3">
                    {recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-50">
                            <Users className="h-4 w-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{log.customer}</p>
                            <p className="text-xs text-slate-500">{log.type} • {log.date}</p>
                          </div>
                        </div>
                        {log.revenue > 0 && (
                          <span className="text-sm font-semibold text-emerald-600">
                            {formatCompactCurrency(log.revenue)}
                          </span>
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
      <EngagementDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  )
}
