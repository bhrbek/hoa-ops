'use client'

import type { Rock, UserProfile } from '@/types/database'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calendar, MoreVertical, CheckCircle, Archive, Trash2 } from 'lucide-react'
import { WEEKDAY_FULL } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface RockCardProps {
  rock: Rock
  owner?: UserProfile | null
  onUpdateSwarmDay: (rockId: string, day: string | null) => void
  onUpdateProgress: (rockId: string, progress: number) => void
  onUpdateStatus: (rockId: string, status: Rock['status']) => void
  onDelete: (rockId: string) => void
}

export function RockCard({
  rock,
  owner,
  onUpdateSwarmDay,
  onUpdateProgress,
  onUpdateStatus,
  onDelete,
}: RockCardProps) {
  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              ROCK #{rock.id.slice(0, 4).toUpperCase()}
            </Badge>
            <Badge
              variant={rock.status === 'Active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {rock.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={owner?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {owner?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
              </AvatarFallback>
            </Avatar>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onUpdateStatus(rock.id, 'Completed')}>
                  <CheckCircle className="mr-2 h-4 w-4 text-success" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(rock.id, 'Shelved')}>
                  <Archive className="mr-2 h-4 w-4" />
                  Shelve
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(rock.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 className="font-mono text-lg font-bold mt-2">{rock.title}</h3>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Outcomes */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase">
              Perfect Outcome
            </div>
            <p className="text-success line-clamp-3">{rock.perfect_outcome}</p>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase">
              Worst Outcome
            </div>
            <p className="text-destructive line-clamp-3">{rock.worst_outcome}</p>
          </div>
        </div>

        {/* Swarm Day Selector */}
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select
            value={rock.swarm_day || ''}
            onValueChange={(v) => onUpdateSwarmDay(rock.id, v || null)}
          >
            <SelectTrigger className="w-36 h-8 text-xs bg-muted">
              <SelectValue placeholder="Set swarm day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No swarm day</SelectItem>
              {WEEKDAY_FULL.map((day) => (
                <SelectItem key={day} value={day.toLowerCase()}>
                  {day}s
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-mono font-bold">{rock.progress}%</span>
          </div>
          <Progress value={rock.progress} className="h-2" />
          <div className="flex gap-1">
            {[0, 25, 50, 75, 100].map((p) => (
              <Button
                key={p}
                variant={rock.progress === p ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-6 text-xs"
                onClick={() => onUpdateProgress(rock.id, p)}
              >
                {p}%
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
