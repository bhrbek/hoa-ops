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
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTeam } from "@/contexts/team-context"
import { getActiveEngagementStats, getOEMBuyingPatterns, getActiveEngagements } from "@/app/actions/engagements"

interface EngagementStats {
  totalRevenue: number
  totalGP: number
  engagementCount: number
  workshopCount: number
}

interface OEMPair {
  oem1_name: string
  oem2_name: string
  pair_count: number
}

interface DomainTrend {
  domain: string
  engagements: number
  revenue: number
}

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
  const [stats, setStats] = React.useState<EngagementStats | null>(null)
  const [oemPairs, setOemPairs] = React.useState<OEMPair[]>([])
  const [domainTrends, setDomainTrends] = React.useState<DomainTrend[]>([])
  const [isLoadingData, setIsLoadingData] = React.useState(true)

  // Fetch report data when team changes
  React.useEffect(() => {
    async function fetchData() {
      if (!activeTeam) {
        setStats(null)
        setOemPairs([])
        setDomainTrends([])
        setIsLoadingData(false)
        return
      }

      setIsLoadingData(true)
      try {
        // Fetch all report data in parallel
        const [statsData, oemData, engagementsData] = await Promise.all([
          getActiveEngagementStats(),
          getOEMBuyingPatterns(10),
          getActiveEngagements({ limit: 500 })
        ])

        setStats(statsData)
        setOemPairs(oemData)

        // Aggregate domain trends from engagements
        const domainMap = new Map<string, { engagements: number; revenue: number }>()
        engagementsData.forEach(e => {
          e.domains?.forEach(d => {
            const existing = domainMap.get(d.name) || { engagements: 0, revenue: 0 }
            domainMap.set(d.name, {
              engagements: existing.engagements + 1,
              revenue: existing.revenue + e.revenue_impact
            })
          })
        })

        const trends = Array.from(domainMap.entries())
          .map(([domain, data]) => ({
            domain,
            engagements: data.engagements,
            revenue: data.revenue
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10)

        setDomainTrends(trends)
      } catch (error) {
        console.error('Failed to fetch report data:', error)
        setStats(null)
        setOemPairs([])
        setDomainTrends([])
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [activeTeam?.id])

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
                {isPageLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    <span className="ml-2 text-slate-500">Loading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">
                      Asset-based revenue tracking coming soon
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Link assets to engagements to see revenue attribution
                    </p>
                  </div>
                )}
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
                {isPageLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    <span className="ml-2 text-slate-500">Loading...</span>
                  </div>
                ) : oemPairs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">
                      No OEM pairing data yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Log engagements with multiple OEMs to see patterns
                    </p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {oemPairs.map((pair, index) => (
                    <div
                      key={`${pair.oem1_name}-${pair.oem2_name}`}
                      className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">{pair.oem1_name}</Badge>
                          <span className="text-slate-400">+</span>
                          <Badge variant="default">{pair.oem2_name}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {pair.pair_count} joint appearances
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                )}
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
                {isPageLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    <span className="ml-2 text-slate-500">Loading...</span>
                  </div>
                ) : domainTrends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <TrendingUp className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">
                      No domain data yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Log engagements with domains to see trends
                    </p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {domainTrends.map((domain) => (
                    <div
                      key={domain.domain}
                      className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-slate-900">
                          {domain.domain}
                        </span>
                        <p className="text-sm text-slate-500">
                          {domain.engagements} engagements
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
                )}
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
