'use client'

import { useState, useEffect, useCallback } from 'react'
import { useJar } from '@/contexts/jar-context'
import { createClient } from '@/lib/supabase/client'
import { BoardGrid } from '@/components/commitment-board/board-grid'
import { BlockPalette } from '@/components/commitment-board/block-palette'
import { BeaconControl } from '@/components/commitment-board/beacon-control'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Commitment, UserProfile, Swarm, Rock, BlockType } from '@/types/database'
import { BLOCK_HOURS } from '@/types/database'
import { ChevronLeft, ChevronRight, Plus, Loader2, Users } from 'lucide-react'
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns'

export default function CommitmentBoardPage() {
  const { user, loading: contextLoading } = useJar()
  const supabase = createClient()

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [users, setUsers] = useState<(UserProfile & { commitments: Commitment[] })[]>([])
  const [rocks, setRocks] = useState<Rock[]>([])
  const [swarms, setSwarms] = useState<Swarm[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)

    const weekStartStr = format(weekStart, 'yyyy-MM-dd')
    const weekEndStr = format(addWeeks(weekStart, 1), 'yyyy-MM-dd')

    // Fetch all users with their commitments for the week
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')

    const { data: commitments } = await supabase
      .from('commitments')
      .select('*')
      .gte('date', weekStartStr)
      .lt('date', weekEndStr)

    const { data: rocksData } = await supabase
      .from('rocks')
      .select('*')
      .eq('status', 'Active')

    const { data: swarmsData } = await supabase
      .from('swarms')
      .select('*')
      .gte('swarm_date', weekStartStr)
      .lt('swarm_date', weekEndStr)
      .eq('active', true)

    // Combine users with their commitments
    const allCommitments = (commitments || []) as Commitment[]
    const usersWithCommitments = (profiles || []).map(profile => {
      const p = profile as UserProfile
      return {
        ...p,
        commitments: allCommitments.filter(c => c.user_id === p.id),
      }
    })

    setUsers(usersWithCommitments)
    setRocks((rocksData || []) as Rock[])
    setSwarms((swarmsData || []) as Swarm[])
    setLoading(false)
  }, [weekStart, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleMoveCommitment = async (id: string, newDate: string) => {
    await supabase
      .from('commitments')
      .update({ date: newDate } as never)
      .eq('id', id)

    fetchData()
  }

  const handleDeleteCommitment = async (id: string) => {
    await supabase
      .from('commitments')
      .delete()
      .eq('id', id)

    fetchData()
  }

  const handleAddCommitment = async (userId: string, date: string, type: BlockType) => {
    const descriptions: Record<BlockType, string> = {
      Rock: 'New Rock Task',
      Pebble: 'New Pebble',
      Sand: 'New Sand Item',
    }

    await supabase.from('commitments').insert({
      user_id: userId,
      date,
      type,
      description: descriptions[type],
      hours_value: BLOCK_HOURS[type],
      completed: false,
    } as never)

    fetchData()
  }

  const handleLightBeacon = async (rockId: string, date: string) => {
    // Deactivate existing beacons for that date
    await supabase
      .from('swarms')
      .update({ active: false } as never)
      .eq('swarm_date', date)

    // Create new beacon
    await supabase.from('swarms').insert({
      rock_id: rockId,
      swarm_date: date,
      active: true,
    } as never)

    fetchData()
  }

  const handleExtinguishBeacon = async (swarmId: string) => {
    await supabase
      .from('swarms')
      .update({ active: false } as never)
      .eq('id', swarmId)

    fetchData()
  }

  const weekLabel = `Week of ${format(weekStart, 'MMM d')}`
  const quarterWeek = `Q${Math.ceil((weekStart.getMonth() + 1) / 3)} / W${format(weekStart, 'w')}`

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
              <span>Workspaces</span>
              <span>/</span>
              <span className="text-foreground font-medium">Commitment Board</span>
            </div>
            <h1 className="text-2xl font-mono font-bold">COMMITMENT BOARD</h1>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted rounded-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWeekStart(prev => subWeeks(prev, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 py-1">
                <div className="text-sm font-medium">{weekLabel}</div>
                <div className="text-xs text-muted-foreground text-center">{quarterWeek}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWeekStart(prev => addWeeks(prev, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Team Avatars */}
            <div className="flex -space-x-2">
              {users.slice(0, 3).map((u) => (
                <Avatar key={u.id} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={u.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {u.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {users.length > 3 && (
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                  +{users.length - 3}
                </div>
              )}
            </div>

            <BeaconControl
              rocks={rocks}
              swarms={swarms}
              weekStart={weekStart}
              onLightBeacon={handleLightBeacon}
              onExtinguishBeacon={handleExtinguishBeacon}
            />

            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Block
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Grid */}
        <div className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No team members yet</h3>
              <p className="text-sm text-muted-foreground">
                Team members will appear here once they sign up
              </p>
            </div>
          ) : (
            <BoardGrid
              users={users}
              weekStart={weekStart}
              swarms={swarms}
              onMoveCommitment={handleMoveCommitment}
              onDeleteCommitment={handleDeleteCommitment}
              onAddCommitment={handleAddCommitment}
            />
          )}
        </div>

        {/* Right Sidebar - Palette */}
        <div className="w-64 border-l border-border p-4 bg-muted/30">
          <BlockPalette />
        </div>
      </div>
    </div>
  )
}
