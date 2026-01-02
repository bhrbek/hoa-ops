'use client'

import { useJar } from '@/contexts/jar-context'
import { BeaconStatus } from '@/components/command-center/beacon-status'
import { CapacityBar } from '@/components/command-center/capacity-bar'
import { SignalFeed } from '@/components/command-center/signal-feed'
import { SedimentChecklist } from '@/components/command-center/sediment-checklist'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

export default function CommandCenterPage() {
  const { loading } = useJar()

  if (loading) {
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
              <span>System</span>
              <span>/</span>
              <span className="text-foreground font-medium">Command Center</span>
            </div>
            <h1 className="text-2xl font-mono font-bold">COMMAND CENTER</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Geological Industrial Dashboard // v.1.0
            </p>
          </div>
          <Badge variant="outline" className="bg-success/10 text-success border-success/50">
            <span className="mr-2 h-2 w-2 rounded-full bg-success animate-pulse" />
            SYSTEM ONLINE
          </Badge>
        </div>
      </header>

      {/* Bento Grid Dashboard */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Q1 - Beacon Status (larger) */}
          <div className="lg:row-span-1">
            <BeaconStatus />
          </div>

          {/* Q2 - Capacity Bar */}
          <div className="lg:row-span-1">
            <CapacityBar />
          </div>

          {/* Q3 - Signal Feed */}
          <div className="lg:row-span-1">
            <SignalFeed />
          </div>

          {/* Q4 - Sediment Checklist */}
          <div className="lg:row-span-1">
            <SedimentChecklist />
          </div>
        </div>
      </div>
    </div>
  )
}
