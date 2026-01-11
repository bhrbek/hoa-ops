"use client"

import * as React from "react"
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Download,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDate } from "@/lib/utils"
import { EngagementDrawer } from "@/components/stream/engagement-drawer"
import { useTeam } from "@/contexts/team-context"
import { getActiveIssues, createIssue } from "@/app/actions/issues"
import type { IssueWithRelations } from "@/types/supabase"

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
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(userId: string): string {
  // Generate consistent color based on user ID
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
    hash = hash & hash
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

type UIIssue = {
  id: string
  date: string
  title: string
  issueType: string
  priority: string
  status: string
  dueDate: string | null
  assignedTo: string | null
  linkedPriority: string | null
  owner: { name: string; initials: string; color: string }
}

function transformIssue(issue: IssueWithRelations): UIIssue {
  const ownerName = issue.owner?.full_name || 'Unknown'
  const ownerId = issue.owner?.id || issue.owner_id

  return {
    id: issue.id,
    date: issue.date,
    title: issue.title || issue.customer_name || 'Untitled Issue',
    issueType: issue.issue_type || 'issue',
    priority: issue.priority || 'medium',
    status: issue.status || 'open',
    dueDate: issue.due_date || null,
    assignedTo: issue.assigned_to || null,
    linkedPriority: issue.rock?.title || null,
    owner: {
      name: ownerName,
      initials: getInitials(ownerName),
      color: getAvatarColor(ownerId),
    },
  }
}

function getPriorityBadgeVariant(priority: string): "destructive" | "warning" | "default" | "outline" {
  switch (priority.toLowerCase()) {
    case "urgent":
      return "destructive"
    case "high":
      return "warning"
    case "medium":
      return "default"
    case "low":
      return "outline"
    default:
      return "default"
  }
}

function getStatusBadgeVariant(status: string): "default" | "warning" | "success" | "outline" {
  switch (status.toLowerCase()) {
    case "open":
      return "default"
    case "in_progress":
      return "warning"
    case "resolved":
      return "success"
    case "closed":
      return "outline"
    default:
      return "default"
  }
}

function getIssueTypeBadgeVariant(issueType: string) {
  switch (issueType.toLowerCase()) {
    case "maintenance":
      return "cloud"
    case "complaint":
      return "destructive"
    case "request":
      return "infra"
    case "violation":
      return "warning"
    default:
      return "default"
  }
}

export default function StreamPage() {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [issues, setIssues] = React.useState<UIIssue[]>([])
  const [isLoadingData, setIsLoadingData] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const { activeTeam, isLoading } = useTeam()

  const fetchIssues = React.useCallback(async () => {
    if (!activeTeam) {
      setIssues([])
      setIsLoadingData(false)
      setError(null)
      return
    }

    setIsLoadingData(true)
    setError(null)
    try {
      const data = await getActiveIssues({ limit: 100 })
      setIssues(data.map(transformIssue))
    } catch (err) {
      console.error('Failed to fetch issues:', err)
      setIssues([])
      setError('Failed to load issues. Please try again.')
    } finally {
      setIsLoadingData(false)
    }
  }, [activeTeam?.id])

  // Fetch issues when team changes
  React.useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  const handleCreateIssue = async (formData: {
    title: string
    description?: string
    date: string
    issue_type: string
    priority: string
    status: string
    notes: string
    rock_id: string | null
    vendor_ids: string[]
  }) => {
    if (!activeTeam) return

    // Combine description and notes for the issue description
    const fullDescription = formData.description
      ? `${formData.description}\n\nNotes: ${formData.notes}`
      : formData.notes

    await createIssue({
      team_id: activeTeam.id,
      title: formData.title,
      description: fullDescription || undefined,
      issue_type: formData.issue_type,
      priority: formData.priority as 'urgent' | 'high' | 'medium' | 'low',
      status: formData.status as 'open' | 'in_progress' | 'resolved' | 'closed',
      priority_id: formData.rock_id || undefined,
      vendor_ids: formData.vendor_ids,
    })

    await fetchIssues()
  }

  const filteredIssues = issues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.issueType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.priority.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isPageLoading = isLoading || isLoadingData

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Issue Tracker</h1>
            <p className="text-sm text-slate-500">
              Track and manage HOA issues
              {activeTeam && (
                <span className="ml-2 text-slate-400">({activeTeam.name})</span>
              )}
            </p>
          </div>
          <Button variant="primary" className="gap-2" onClick={() => setDrawerOpen(true)}>
            <Plus className="h-4 w-4" />
            New Issue
          </Button>
        </div>
      </header>

      <div className="p-8">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search activities, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />

          {/* Date Filter */}
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>

          {/* Owner Filter */}
          <Button variant="outline" size="sm" className="gap-2">
            Owner: <span className="font-semibold">All</span>
            <ChevronDown className="h-4 w-4" />
          </Button>

          {/* Add Filter */}
          <Button variant="outline" size="sm" className="gap-2 border-dashed">
            <Filter className="h-4 w-4" />
            Add Filter
          </Button>

          <div className="flex-1" />

          {/* Export */}
          <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isPageLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <span className="ml-3 text-slate-500">Loading issues...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to Load</h3>
              <p className="text-sm text-slate-500 max-w-md mb-4">{error}</p>
              <Button variant="outline" className="gap-2" onClick={() => fetchIssues()}>
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          ) : issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-slate-400 mb-2">No issues yet</div>
              <p className="text-sm text-slate-500 max-w-md">
                Create your first issue to start tracking HOA maintenance, complaints, and requests.
              </p>
              <Button variant="primary" className="mt-4 gap-2" onClick={() => setDrawerOpen(true)}>
                <Plus className="h-4 w-4" />
                New Issue
              </Button>
            </div>
          ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-900 w-28">Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 w-64">Title</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 w-32">Type</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 w-28">Priority</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 w-28">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 w-28">Due Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 w-32">Owner</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(issue.date)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {issue.title}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={getIssueTypeBadgeVariant(issue.issueType) as "cloud" | "destructive" | "infra" | "warning" | "default"}
                      >
                        {issue.issueType.charAt(0).toUpperCase() + issue.issueType.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={getPriorityBadgeVariant(issue.priority)}
                      >
                        {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={getStatusBadgeVariant(issue.status)}
                      >
                        {issue.status.replace('_', ' ').charAt(0).toUpperCase() + issue.status.replace('_', ' ').slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {issue.dueDate ? formatDate(issue.dueDate) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar className={`h-6 w-6 ${issue.owner.color}`}>
                          <AvatarFallback className={`text-[10px] font-bold ${issue.owner.color}`}>
                            {issue.owner.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-slate-700 text-sm">{issue.owner.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
            <p className="text-xs text-slate-500">
              Showing 1 to {filteredIssues.length} of {issues.length} entries
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          </>
          )}
        </div>
      </div>

      {/* Issue Drawer */}
      <EngagementDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={handleCreateIssue}
      />
    </div>
  )
}
