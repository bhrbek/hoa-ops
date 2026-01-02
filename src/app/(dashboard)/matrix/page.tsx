'use client'

import { useState, useEffect, useCallback } from 'react'
import { useJar } from '@/contexts/jar-context'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { Engagement, UserProfile } from '@/types/database'
import { DEFAULT_DOMAINS } from '@/lib/constants'
import {
  BarChart3,
  Download,
  Radio,
  Shield,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { format, subMonths, startOfYear } from 'date-fns'
import { cn } from '@/lib/utils'

export default function MatrixPage() {
  const { user, loading: contextLoading } = useJar()
  const supabase = createClient()

  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [signalMode, setSignalMode] = useState(false)
  const [dateRange, setDateRange] = useState('ytd')

  const fetchData = useCallback(async () => {
    setLoading(true)

    let startDate: string
    const now = new Date()

    switch (dateRange) {
      case '30d':
        startDate = format(subMonths(now, 1), 'yyyy-MM-dd')
        break
      case '90d':
        startDate = format(subMonths(now, 3), 'yyyy-MM-dd')
        break
      case 'ytd':
      default:
        startDate = format(startOfYear(now), 'yyyy-MM-dd')
    }

    const { data: engagementsData } = await supabase
      .from('engagements')
      .select('*')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false })

    const { data: usersData } = await supabase.from('profiles').select('*')

    setEngagements(engagementsData || [])
    setUsers(usersData || [])
    setLoading(false)
  }, [dateRange, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter by signal mode
  const filteredEngagements = signalMode
    ? engagements.filter((e) => e.is_strategic_signal)
    : engagements

  // Calculate domain volumes
  const domainVolumes = DEFAULT_DOMAINS.map((domain) => {
    const count = filteredEngagements.filter((e) =>
      e.domains.includes(domain)
    ).length
    return { domain, count }
  }).sort((a, b) => b.count - a.count)

  const maxCount = Math.max(...domainVolumes.map((d) => d.count), 1)

  // Calculate total sand volume (estimated effort)
  const totalSandVolume = filteredEngagements.reduce(
    (sum, e) => sum + e.estimated_effort,
    0
  )

  // Shield analysis - users by capacity
  const shieldAnalysis = users.map((u) => {
    const userEngagements = filteredEngagements.filter((e) => e.user_id === u.id)
    const totalEffort = userEngagements.reduce(
      (sum, e) => sum + e.estimated_effort,
      0
    )
    const realCapacity = u.capacity_hours * 0.8
    const utilizationPercent = Math.round((totalEffort / realCapacity) * 100)
    const isOverloaded = utilizationPercent > 100

    return {
      user: u,
      totalEffort,
      realCapacity,
      utilizationPercent,
      isOverloaded,
      engagementCount: userEngagements.length,
    }
  })

  if (contextLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span>THE JAR</span>
              <span>/</span>
              <span className="text-foreground font-medium">The Matrix</span>
            </div>
            <h1 className="text-2xl font-mono font-bold flex items-center gap-3">
              <BarChart3 className="h-6 w-6" />
              THE MATRIX
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Report Builder // Configuration // v.2.4.1
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Date Range */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40 bg-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>

            {/* Signal Mode Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="signal-mode"
                checked={signalMode}
                onCheckedChange={setSignalMode}
              />
              <Label htmlFor="signal-mode" className="text-sm flex items-center gap-1">
                <Radio className="h-4 w-4 text-beacon" />
                Signal Mode
              </Label>
            </div>

            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Domain Volume Chart */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    SAND VOLUME BY DOMAIN (YTD)
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span>+12.4%</span>
                  </div>
                </div>
                <div className="text-3xl font-mono font-bold mt-2">
                  {totalSandVolume.toLocaleString()}
                  <span className="text-sm text-muted-foreground ml-2">hrs</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-4">
                  {domainVolumes.slice(0, 8).map(({ domain, count }) => (
                    <div key={domain} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{domain}</span>
                        <span className="font-mono">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-success rounded-full"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shield Analysis */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  SHIELD ANALYSIS
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Capacity Heatmap
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {shieldAnalysis.map(({ user: u, utilizationPercent, isOverloaded }) => (
                    <div
                      key={u.id}
                      className={cn(
                        'aspect-square rounded-md flex flex-col items-center justify-center p-2 text-center',
                        isOverloaded
                          ? 'bg-overload/20 border border-overload'
                          : utilizationPercent > 80
                          ? 'bg-warning/20 border border-warning'
                          : 'bg-success/20 border border-success'
                      )}
                    >
                      <Avatar className="h-8 w-8 mb-1">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {u.full_name?.split(' ').map((n) => n[0]).join('') || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate w-full">
                        {u.full_name?.split(' ')[0]}
                      </span>
                      <span
                        className={cn(
                          'text-xs font-mono',
                          isOverloaded
                            ? 'text-overload'
                            : utilizationPercent > 80
                            ? 'text-warning'
                            : 'text-success'
                        )}
                      >
                        {utilizationPercent}%
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded bg-success/50" />
                    <span>&lt; 80%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded bg-warning/50" />
                    <span>80-100%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded bg-overload/50" />
                    <span>&gt; 100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Raw Data Stream */}
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  RAW DATA STREAM
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-24">Domain ID</TableHead>
                        <TableHead>Metric Type</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead className="text-right">Volume</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEngagements.slice(0, 10).map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-mono text-xs">
                            DOM-{e.id.slice(0, 3).toUpperCase()}-{e.domains[0]?.slice(0, 1) || 'X'}
                          </TableCell>
                          <TableCell>
                            {e.is_strategic_signal ? 'Extraction' : 'Sand volume'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(e.created_at), 'yyyy-MM-dd HH:mm:ss')}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {e.estimated_effort}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={e.status === 'Active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {e.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
