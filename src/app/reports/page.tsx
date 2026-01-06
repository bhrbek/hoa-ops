"use client"

import * as React from "react"
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Download,
  Calendar,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTeam } from "@/contexts/team-context"

// Mock data for reports
const revenueByAsset = [
  { asset: "Enterprise Cloud Demo", type: "demo", revenue: 245000, engagements: 12 },
  { asset: "Security Architecture Deck", type: "deck", revenue: 189000, engagements: 8 },
  { asset: "Wi-Fi 7 POC Kit", type: "demo", revenue: 156000, engagements: 5 },
  { asset: "SD-WAN Whitepaper", type: "whitepaper", revenue: 98000, engagements: 15 },
  { asset: "Network Assessment Tool", type: "tool", revenue: 87000, engagements: 22 },
]

const oemPairs = [
  { oem1: "Cisco", oem2: "Palo Alto", count: 45, avgRevenue: 125000 },
  { oem1: "AWS", oem2: "HashiCorp", count: 38, avgRevenue: 98000 },
  { oem1: "Azure", oem2: "Fortinet", count: 32, avgRevenue: 112000 },
  { oem1: "Arista", oem2: "Cisco", count: 28, avgRevenue: 156000 },
  { oem1: "Juniper", oem2: "Palo Alto", count: 24, avgRevenue: 89000 },
]

const domainTrends = [
  { domain: "Cloud", engagements: 156, revenue: 1250000, growth: "+15%" },
  { domain: "Security", engagements: 124, revenue: 980000, growth: "+22%" },
  { domain: "Network", engagements: 98, revenue: 756000, growth: "+8%" },
  { domain: "Collaboration", engagements: 67, revenue: 425000, growth: "-3%" },
  { domain: "Data Center", engagements: 45, revenue: 312000, growth: "+5%" },
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getAssetTypeColor(type: string): string {
  switch (type) {
    case "demo":
      return "bg-blue-50 text-blue-700"
    case "deck":
      return "bg-amber-50 text-amber-700"
    case "whitepaper":
      return "bg-emerald-50 text-emerald-700"
    case "tool":
      return "bg-purple-50 text-purple-700"
    default:
      return "bg-slate-50 text-slate-700"
  }
}

export default function ReportsPage() {
  const { activeTeam, isLoading } = useTeam()

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
        {/* Report Tabs */}
        <Tabs defaultValue="assets" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="assets" className="gap-2">
              <FileText className="h-4 w-4" />
              Revenue by Asset
            </TabsTrigger>
            <TabsTrigger value="oems" className="gap-2">
              <Users className="h-4 w-4" />
              OEM Pairs
            </TabsTrigger>
            <TabsTrigger value="domains" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Domain Trends
            </TabsTrigger>
          </TabsList>

          {/* Revenue by Asset */}
          <TabsContent value="assets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Asset</CardTitle>
                <CardDescription>
                  Track which assets drive the most revenue from engagements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueByAsset.map((item, index) => (
                    <div
                      key={item.asset}
                      className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 truncate">
                            {item.asset}
                          </span>
                          <Badge className={getAssetTypeColor(item.type)}>
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">
                          {item.engagements} engagements
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">
                          {formatCurrency(item.revenue)}
                        </p>
                        <p className="text-xs text-slate-500">influenced revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OEM Pairs */}
          <TabsContent value="oems" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>OEM Buying Patterns</CardTitle>
                <CardDescription>
                  Most common OEM combinations in successful engagements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {oemPairs.map((pair, index) => (
                    <div
                      key={`${pair.oem1}-${pair.oem2}`}
                      className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">{pair.oem1}</Badge>
                          <span className="text-slate-400">+</span>
                          <Badge variant="default">{pair.oem2}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {pair.count} joint appearances
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-700">
                          {formatCurrency(pair.avgRevenue)}
                        </p>
                        <p className="text-xs text-slate-500">avg. deal size</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Domain Trends */}
          <TabsContent value="domains" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Domain Trends</CardTitle>
                <CardDescription>
                  Technology domain activity and revenue trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {domainTrends.map((domain) => (
                    <div
                      key={domain.domain}
                      className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {domain.domain}
                          </span>
                          <Badge
                            variant={
                              domain.growth.startsWith("+") ? "success" : "destructive"
                            }
                          >
                            {domain.growth}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">
                          {domain.engagements} engagements this quarter
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">
                          {formatCurrency(domain.revenue)}
                        </p>
                        <p className="text-xs text-slate-500">influenced revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <div className="text-center text-xs text-slate-400 py-4">
          <p>
            These reports are for business observability only.
            Revenue and engagement metrics do NOT influence Rock health.
          </p>
        </div>
      </div>
    </div>
  )
}
