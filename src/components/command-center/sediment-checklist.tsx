'use client'

import { useJar } from '@/contexts/jar-context'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Layers, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export function SedimentChecklist() {
  const { commitments, refreshData } = useJar()
  const supabase = createClient()

  // Get sand items for this week
  const sandItems = commitments.filter(c => c.type === 'Sand')

  const toggleComplete = async (id: string, completed: boolean) => {
    await supabase
      .from('commitments')
      .update({ completed } as never)
      .eq('id', id)

    refreshData()
  }

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Layers className="h-4 w-4" />
            THE SEDIMENT
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {sandItems.filter(s => s.completed).length}/{sandItems.length} DONE
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          {sandItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Layers className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No sand items this week
              </p>
              <Link href="/commitment-board">
                <Button variant="outline" size="sm" className="mt-3">
                  <Plus className="mr-2 h-3 w-3" />
                  Add Sand
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sandItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-md border border-border transition-colors',
                    item.completed ? 'bg-muted/30' : 'bg-muted/50 hover:bg-muted'
                  )}
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={(checked) => toggleComplete(item.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      item.completed && 'line-through text-muted-foreground'
                    )}>
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.date} • {item.hours_value}h
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Quick Add Section */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-success" />
            <span>Sync with calendar: Enabled</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
