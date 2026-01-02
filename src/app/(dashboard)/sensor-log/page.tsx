'use client'

import { useState, useEffect } from 'react'
import { useJar } from '@/contexts/jar-context'
import { useEngagements } from '@/hooks/use-engagements'
import { EngagementTable } from '@/components/sensor-log/engagement-table'
import { EngagementSheet } from '@/components/sensor-log/engagement-sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Engagement } from '@/types/database'
import { Plus, Radio, Loader2 } from 'lucide-react'

export default function SensorLogPage() {
  const { user, loading: contextLoading } = useJar()
  const {
    engagements,
    loading,
    fetchEngagements,
    addEngagement,
    updateEngagement,
  } = useEngagements(user?.id)

  const [selectedEngagement, setSelectedEngagement] = useState<Engagement | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    if (user) {
      fetchEngagements()
    }
  }, [user, fetchEngagements])

  const handleSelect = (engagement: Engagement) => {
    setSelectedEngagement(engagement)
    setIsNew(false)
    setSheetOpen(true)
  }

  const handleNew = () => {
    setSelectedEngagement(null)
    setIsNew(true)
    setSheetOpen(true)
  }

  const handleSave = async (data: Partial<Engagement>) => {
    if (isNew) {
      await addEngagement(data as Omit<Engagement, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
    } else if (selectedEngagement) {
      await updateEngagement(selectedEngagement.id, data)
    }
  }

  const signalCount = engagements.filter(e => e.is_strategic_signal).length

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
              <span>System</span>
              <span>/</span>
              <span className="text-foreground font-medium">Sensor Log</span>
            </div>
            <h1 className="text-2xl font-mono font-bold">SENSOR LOG</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Client Engagement Tracking // Signal Detection
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-beacon" />
              <span className="text-sm text-muted-foreground">
                {signalCount} Strategic Signal{signalCount !== 1 && 's'}
              </span>
            </div>
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Engagement
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
          <EngagementTable
            engagements={engagements}
            onSelect={handleSelect}
            selectedId={selectedEngagement?.id}
          />
        )}
      </div>

      {/* Sheet */}
      <EngagementSheet
        engagement={selectedEngagement}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSave}
        isNew={isNew}
      />
    </div>
  )
}
