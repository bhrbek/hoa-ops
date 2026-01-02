'use client'

import { useJar } from '@/contexts/jar-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Radio, Building2, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function SignalFeed() {
  const { engagements } = useJar()

  const strategicSignals = engagements
    .filter(e => e.is_strategic_signal)
    .slice(0, 5)

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Radio className="h-4 w-4 text-beacon" />
            STRATEGIC SIGNALS
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            LIVE FEED
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          {strategicSignals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Radio className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No strategic signals detected
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Flag engagements in the Sensor Log
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {strategicSignals.map((signal) => (
                <div
                  key={signal.id}
                  className="p-3 rounded-md bg-muted/50 border border-border hover:border-beacon/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-beacon border-beacon/50 text-xs">
                      Signal
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{signal.customer_name}</span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {signal.signal_context || signal.next_steps || 'No context provided'}
                  </p>

                  {signal.domains.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {signal.domains.slice(0, 2).map((domain) => (
                        <Badge key={domain} variant="secondary" className="text-xs">
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
