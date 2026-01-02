'use client'

import { useState } from 'react'
import type { Engagement } from '@/types/database'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Radio, Search, Filter, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface EngagementTableProps {
  engagements: Engagement[]
  onSelect: (engagement: Engagement) => void
  selectedId?: string
}

export function EngagementTable({ engagements, onSelect, selectedId }: EngagementTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [signalFilter, setSignalFilter] = useState<string>('all')

  const filteredEngagements = engagements.filter((e) => {
    const matchesSearch =
      e.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      e.domains.some(d => d.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter
    const matchesSignal =
      signalFilter === 'all' ||
      (signalFilter === 'signal' && e.is_strategic_signal) ||
      (signalFilter === 'nosignal' && !e.is_strategic_signal)

    return matchesSearch && matchesStatus && matchesSignal
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-500'
      case 'Medium':
        return 'text-yellow-500'
      case 'Low':
        return 'text-green-500'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers, domains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 bg-muted">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Lead">Lead</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={signalFilter} onValueChange={setSignalFilter}>
          <SelectTrigger className="w-36 bg-muted">
            <Radio className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Signal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Signals</SelectItem>
            <SelectItem value="signal">Strategic Only</SelectItem>
            <SelectItem value="nosignal">No Signal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEngagements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Building2 className="h-8 w-8 mb-2" />
                    <p>No engagements found</p>
                    <p className="text-xs mt-1">Create your first engagement to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEngagements.map((engagement) => (
                <TableRow
                  key={engagement.id}
                  onClick={() => onSelect(engagement)}
                  className={cn(
                    'cursor-pointer transition-colors',
                    selectedId === engagement.id && 'bg-muted'
                  )}
                >
                  <TableCell>
                    {engagement.is_strategic_signal && (
                      <Radio className="h-4 w-4 text-beacon" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {engagement.customer_name}
                    {engagement.internal_req_id && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        #{engagement.internal_req_id}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {engagement.domains.slice(0, 2).map((domain) => (
                        <Badge key={domain} variant="secondary" className="text-xs">
                          {domain}
                        </Badge>
                      ))}
                      {engagement.domains.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{engagement.domains.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${engagement.revenue_amt.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span className={cn('font-medium', getPriorityColor(engagement.priority))}>
                      {engagement.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={engagement.status === 'Active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {engagement.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(engagement.updated_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
