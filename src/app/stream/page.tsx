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
  Link2,
  Download,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatCurrency, formatDate } from "@/lib/utils"
import { EngagementDrawer } from "@/components/stream/engagement-drawer"
import { useTeam } from "@/contexts/team-context"
import { getActiveEngagements, createEngagement } from "@/app/actions/engagements"
import type { EngagementWithRelations } from "@/types/supabase"

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

type UIEngagement = {
  id: string
  date: string
  customer: string
  domains: string[]
  oems: string[]
  revenue: number
  gp: number
  linkedRock: string | null
  owner: { name: string; initials: string; color: string }
}

function transformEngagement(engagement: EngagementWithRelations): UIEngagement {
  const ownerName = engagement.owner?.full_name || 'Unknown'
  const ownerId = engagement.owner?.id || engagement.owner_id

  return {
    id: engagement.id,
    date: engagement.date,
    customer: engagement.customer?.name || engagement.customer_name,
    domains: engagement.domains?.map(d => d.name) || [],
    oems: engagement.oems?.map(o => o.name) || [],
    revenue: engagement.revenue_impact,
    gp: engagement.gp_impact,
    linkedRock: engagement.rock?.title || null,
    owner: {
      name: ownerName,
      initials: getInitials(ownerName),
      color: getAvatarColor(ownerId),
    },
  }
}

function getDomainBadgeVariant(domain: string) {
  switch (domain.toLowerCase()) {
    case "cloud":
      return "cloud"
    case "security":
      return "security"
    case "infra":
      return "infra"
    case "network":
      return "network"
    default:
      return "default"
  }
}

export default function StreamPage() {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [engagements, setEngagements] = React.useState<UIEngagement[]>([])
  const [isLoadingData, setIsLoadingData] = React.useState(true)
  const { activeTeam, isLoading } = useTeam()

  const fetchEngagements = React.useCallback(async () => {
    if (!activeTeam) {
      setEngagements([])
      setIsLoadingData(false)
      return
    }

    setIsLoadingData(true)
    try {
      const data = await getActiveEngagements({ limit: 100 })
      setEngagements(data.map(transformEngagement))
    } catch (error) {
      console.error('Failed to fetch engagements:', error)
      setEngagements([])
    } finally {
      setIsLoadingData(false)
    }
  }, [activeTeam?.id])

  // Fetch engagements when team changes
  React.useEffect(() => {
    fetchEngagements()
  }, [fetchEngagements])

  const handleCreateEngagement = async (formData: {
    customer_name: string
    date: string
    activity_type: "Workshop" | "Demo" | "POC" | "Advisory"
    revenue_impact: number
    gp_impact: number
    notes: string
    rock_id: string | null
    domain_ids: string[]
    oem_ids: string[]
    asset_ids: string[]
  }) => {
    if (!activeTeam) return

    await createEngagement({
      team_id: activeTeam.id,
      customer_name: formData.customer_name,
      date: formData.date,
      activity_type: formData.activity_type,
      revenue_impact: formData.revenue_impact,
      gp_impact: formData.gp_impact,
      notes: formData.notes,
      rock_id: formData.rock_id || undefined,
      domain_ids: formData.domain_ids,
      oem_ids: formData.oem_ids,
    })

    await fetchEngagements()
  }

  const filteredEngagements = engagements.filter(
    (e) =>
      e.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.domains.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.oems.some((o) => o.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const isPageLoading = isLoading || isLoadingData

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">The Stream</h1>
            <p className="text-sm text-slate-500">
              Track and manage engagement activities
              {activeTeam && (
                <span className="ml-2 text-slate-400">({activeTeam.name})</span>
              )}
            </p>
          </div>
          <Button variant="primary" className="gap-2" onClick={() => setDrawerOpen(true)}>
            <Plus className="h-4 w-4" />
            Log Engagement
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
              <span className="ml-3 text-slate-500">Loading engagements...</span>
            </div>
          ) : engagements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-slate-400 mb-2">No engagements yet</div>
              <p className="text-sm text-slate-500 max-w-md">
                Log your first engagement to start tracking customer activities and building your business observability.
              </p>
              <Button variant="primary" className="mt-4 gap-2" onClick={() => setDrawerOpen(true)}>
                <Plus className="h-4 w-4" />
                Log Engagement
              </Button>
            </div>
          ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-900 w-28">Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 w-48">Customer</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 w-32">Domain</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 w-48">OEMs</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 text-right w-28">Revenue</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 text-right w-24">GP</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 w-56">Linked Rock</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 w-32">Owner</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEngagements.map((engagement) => (
                  <tr
                    key={engagement.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(engagement.date)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {engagement.customer}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {engagement.domains.map((domain) => (
                          <Badge
                            key={domain}
                            variant={getDomainBadgeVariant(domain) as "cloud" | "security" | "infra" | "network" | "default"}
                          >
                            {domain}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {engagement.oems.map((oem) => (
                          <Badge key={oem} variant="default" className="bg-slate-100 text-slate-600 ring-slate-200">
                            {oem}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-600">
                      {formatCurrency(engagement.revenue)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-600">
                      {formatCurrency(engagement.gp)}
                    </td>
                    <td className="px-6 py-4">
                      {engagement.linkedRock ? (
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-blue-600 font-medium truncate max-w-[180px]">
                            {engagement.linkedRock}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar className={`h-6 w-6 ${engagement.owner.color}`}>
                          <AvatarFallback className={`text-[10px] font-bold ${engagement.owner.color}`}>
                            {engagement.owner.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-slate-700 text-sm">{engagement.owner.name}</span>
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
              Showing 1 to {filteredEngagements.length} of {engagements.length} entries
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

      {/* Engagement Drawer */}
      <EngagementDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={handleCreateEngagement}
      />
    </div>
  )
}
