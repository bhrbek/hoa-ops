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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatCurrency, formatDate } from "@/lib/utils"
import { EngagementDrawer } from "@/components/stream/engagement-drawer"
import { useTeam } from "@/contexts/team-context"

// Mock engagement data
const engagements = [
  {
    id: "1",
    date: "2026-01-02",
    customer: "Acme Corporation",
    domains: ["Cloud"],
    oems: ["AWS", "HashiCorp"],
    revenue: 15000,
    gp: 4200,
    linkedRock: "Q1 Enterprise Cloud Migration",
    owner: { name: "Sarah J.", initials: "SJ", color: "bg-indigo-100 text-indigo-700" },
  },
  {
    id: "2",
    date: "2026-01-01",
    customer: "Globex Inc.",
    domains: ["Security"],
    oems: ["Cisco", "Palo Alto", "+2"],
    revenue: 8500,
    gp: 2100,
    linkedRock: null,
    owner: { name: "Mike R.", initials: "MR", color: "bg-amber-100 text-amber-700" },
  },
  {
    id: "3",
    date: "2025-12-30",
    customer: "Soylent Corp",
    domains: ["Infra"],
    oems: ["Dell"],
    revenue: 22000,
    gp: 5500,
    linkedRock: "Network Modernization Initiative",
    owner: { name: "Jessica T.", initials: "JT", color: "bg-pink-100 text-pink-700" },
  },
  {
    id: "4",
    date: "2025-12-29",
    customer: "Initech",
    domains: ["Cloud"],
    oems: ["Azure"],
    revenue: 12000,
    gp: 3000,
    linkedRock: "Q1 Enterprise Cloud Migration",
    owner: { name: "David B.", initials: "DB", color: "bg-teal-100 text-teal-700" },
  },
  {
    id: "5",
    date: "2025-12-28",
    customer: "Stark Industries",
    domains: ["Security"],
    oems: ["Fortinet", "CrowdStrike"],
    revenue: 45000,
    gp: 12250,
    linkedRock: "Security Operations Overhaul",
    owner: { name: "Sarah J.", initials: "SJ", color: "bg-indigo-100 text-indigo-700" },
  },
  {
    id: "6",
    date: "2025-12-27",
    customer: "Wayne Enterprises",
    domains: ["Network", "Security"],
    oems: ["Cisco", "Arista"],
    revenue: 67000,
    gp: 18500,
    linkedRock: null,
    owner: { name: "Alex T.", initials: "AT", color: "bg-emerald-100 text-emerald-700" },
  },
]

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
  const { activeTeam, isLoading } = useTeam()

  const filteredEngagements = engagements.filter(
    (e) =>
      e.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.domains.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.oems.some((o) => o.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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
        </div>
      </div>

      {/* Engagement Drawer */}
      <EngagementDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  )
}
