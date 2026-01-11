"use client"

import * as React from "react"
import {
  TrendingUp,
  Users,
  FileText,
  Download,
  Calendar,
  ChevronDown,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Wrench,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTeam } from "@/contexts/team-context"
import { getActiveIssueStats, getActiveIssues } from "@/app/actions/issues"

interface IssueStats {
  totalIssues: number
  openIssues: number
  inProgressIssues: number
  resolvedIssues: number
  urgentIssues: number
}

interface IssueTypeTrend {
  issueType: string
  count: number
  openCount: number
}

interface PriorityDistribution {
  priority: string
  count: number
}

function getIssueTypeColor(type: string): string {
  switch (type?.toLowerCase()) {
    case "maintenance":
      return "bg-blue-50 text-blue-700"
    case "complaint":
      return "bg-red-50 text-red-700"
    case "request":
      return "bg-amber-50 text-amber-700"
    case "violation":
      return "bg-purple-50 text-purple-700"
    default:
      return "bg-slate-50 text-slate-700"
  }
}

function getPriorityColor(priority: string): string {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return "bg-red-500"
    case "high":
      return "bg-orange-500"
    case "medium":
      return "bg-yellow-500"
    case "low":
      return "bg-green-500"
    default:
      return "bg-slate-500"
  }
}

export default function ReportsPage() {
  const { activeTeam, isLoading } = useTeam()
  const [stats, setStats] = React.useState<IssueStats | null>(null)
  const [issueTypeTrends, setIssueTypeTrends] = React.useState<IssueTypeTrend[]>([])
  const [priorityDistribution, setPriorityDistribution] = React.useState<PriorityDistribution[]>([])
  const [isLoadingData, setIsLoadingData] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    if (!activeTeam) {
      setStats(null)
      setIssueTypeTrends([])
      setPriorityDistribution([])
      setIsLoadingData(false)
      setError(null)
      return
    }

    setIsLoadingData(true)
    setError(null)
    try {
      // Fetch all report data in parallel
      const [statsData, issuesData] = await Promise.all([
        getActiveIssueStats(),
        getActiveIssues({ limit: 500 })
      ])

      setStats(statsData)

      // Aggregate issue type trends
      const typeMap = new Map<string, { count: number; openCount: number }>()
      issuesData.forEach(i => {
        const issueType = i.issue_type || 'other'
        const existing = typeMap.get(issueType) || { count: 0, openCount: 0 }
        typeMap.set(issueType, {
          count: existing.count + 1,
          openCount: existing.openCount + (i.status === 'open' ? 1 : 0)
        })
      })

      const typeTrends = Array.from(typeMap.entries())
        .map(([issueType, data]) => ({
          issueType,
          count: data.count,
          openCount: data.openCount
        }))
        .sort((a, b) => b.count - a.count)

      setIssueTypeTrends(typeTrends)

      // Aggregate priority distribution
      const priorityMap = new Map<string, number>()
      issuesData.forEach(i => {
        const priority = i.priority || 'medium'
        priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1)
      })

      const priorities = Array.from(priorityMap.entries())
        .map(([priority, count]) => ({ priority, count }))
        .sort((a, b) => {
          const order = ['urgent', 'high', 'medium', 'low']
          return order.indexOf(a.priority) - order.indexOf(b.priority)
        })

      setPriorityDistribution(priorities)
    } catch (err) {
      console.error('Failed to fetch report data:', err)
      setStats(null)
      setIssueTypeTrends([])
      setPriorityDistribution([])
      setError('Failed to load report data. Please try again.')
    } finally {
      setIsLoadingData(false)
    }
  }, [activeTeam?.id])

  // Fetch report data when team changes
  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const isPageLoading = isLoading || isLoadingData

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports</h1>
            <p className="text-sm text-slate-500">
              Business observability and analytics
              {activeTeam && (
                <span className="ml-2 text-slate-400">({activeTeam.name})</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              Q1 2026
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-8">
        {/* Error State */}
        {error && !isPageLoading && (
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
        )}

        {/* Summary Cards */}
        {!error && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-slate-100">
                    <FileText className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalIssues}</p>
                    <p className="text-sm text-slate-500">Total Issues</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-amber-100">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{stats.openIssues}</p>
                    <p className="text-sm text-slate-500">Open Issues</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <Wrench className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.inProgressIssues}</p>
                    <p className="text-sm text-slate-500">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-emerald-100">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{stats.resolvedIssues}</p>
                    <p className="text-sm text-slate-500">Resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Report Tabs */}
        {!error && (
        <Tabs defaultValue="types" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="types" className="gap-2">
              <FileText className="h-4 w-4" />
              Issue Types
            </TabsTrigger>
            <TabsTrigger value="priority" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Priority Distribution
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger>
          </TabsList>

          {/* Issue Types */}
          <TabsContent value="types" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Issues by Type</CardTitle>
                <CardDescription>
                  Breakdown of issues by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isPageLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    <span className="ml-2 text-slate-500">Loading...</span>
                  </div>
                ) : issueTypeTrends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">
                      No issue data yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Create issues to see type breakdowns
                    </p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {issueTypeTrends.map((type) => (
                    <div
                      key={type.issueType}
                      className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className={`px-3 py-1.5 rounded-lg font-medium ${getIssueTypeColor(type.issueType)}`}>
                        {type.issueType.charAt(0).toUpperCase() + type.issueType.slice(1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-500">
                          {type.count} total issues
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-amber-600">
                          {type.openCount}
                        </p>
                        <p className="text-xs text-slate-500">open</p>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Priority Distribution */}
          <TabsContent value="priority" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>
                  Issues broken down by priority level
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isPageLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    <span className="ml-2 text-slate-500">Loading...</span>
                  </div>
                ) : priorityDistribution.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">
                      No priority data yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Create issues to see priority distribution
                    </p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {priorityDistribution.map((item) => {
                    const total = priorityDistribution.reduce((sum, p) => sum + p.count, 0)
                    const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0
                    return (
                      <div
                        key={item.priority}
                        className="flex items-center gap-4 p-4 rounded-lg border border-slate-200"
                      >
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(item.priority)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-900 capitalize">
                              {item.priority}
                            </span>
                            <span className="text-sm text-slate-500">
                              {item.count} issues ({percentage}%)
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getPriorityColor(item.priority)} transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Issue Trends</CardTitle>
                <CardDescription>
                  Issue activity over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <TrendingUp className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-sm text-slate-500">
                    Trend analysis coming soon
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Track issue resolution rates and response times
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}

        {/* Disclaimer */}
        <div className="text-center text-xs text-slate-400 py-4">
          <p>
            These reports provide visibility into HOA issue management.
            Use this data to improve response times and identify common issues.
          </p>
        </div>
      </div>
    </div>
  )
}
