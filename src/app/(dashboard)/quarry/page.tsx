'use client'

import { useState, useEffect, useCallback } from 'react'
import { useJar } from '@/contexts/jar-context'
import { createClient } from '@/lib/supabase/client'
import { RockCard } from '@/components/quarry/rock-card'
import { RockForm } from '@/components/quarry/rock-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Rock, UserProfile } from '@/types/database'
import { Mountain, Filter, Loader2, Users } from 'lucide-react'

export default function QuarryPage() {
  const { user, loading: contextLoading } = useJar()
  const supabase = createClient()

  const [rocks, setRocks] = useState<Rock[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('Active')
  const [ownerFilter, setOwnerFilter] = useState<string>('all')

  const fetchData = useCallback(async () => {
    setLoading(true)

    const { data: rocksData } = await supabase
      .from('rocks')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')

    setRocks((rocksData || []) as Rock[])
    setUsers((usersData || []) as UserProfile[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddRock = async (rock: Omit<Rock, 'id' | 'created_at' | 'updated_at'>) => {
    await supabase.from('rocks').insert(rock as never)
    fetchData()
  }

  const handleUpdateSwarmDay = async (rockId: string, day: string | null) => {
    await supabase.from('rocks').update({ swarm_day: day } as never).eq('id', rockId)
    fetchData()
  }

  const handleUpdateProgress = async (rockId: string, progress: number) => {
    await supabase.from('rocks').update({ progress } as never).eq('id', rockId)
    fetchData()
  }

  const handleUpdateStatus = async (rockId: string, status: Rock['status']) => {
    await supabase.from('rocks').update({ status } as never).eq('id', rockId)
    fetchData()
  }

  const handleDelete = async (rockId: string) => {
    await supabase.from('rocks').delete().eq('id', rockId)
    fetchData()
  }

  // Filter rocks
  const filteredRocks = rocks.filter(rock => {
    const matchesStatus = statusFilter === 'all' || rock.status === statusFilter
    const matchesOwner = ownerFilter === 'all' || rock.owner_id === ownerFilter
    return matchesStatus && matchesOwner
  })

  const getOwner = (ownerId: string) => users.find(u => u.id === ownerId)

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
              <span>The Jar</span>
              <span>/</span>
              <span className="text-foreground font-medium">The Quarry</span>
            </div>
            <h1 className="text-2xl font-mono font-bold flex items-center gap-3">
              <Mountain className="h-6 w-6" />
              The Quarry
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Active Strategic Strata
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Filters */}
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-36 bg-muted">
                <Users className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 bg-muted">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Shelved">Shelved</SelectItem>
              </SelectContent>
            </Select>

            {user && <RockForm onSubmit={handleAddRock} ownerId={user.id} />}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Mountain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No rocks found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {statusFilter !== 'all'
                ? `No ${statusFilter.toLowerCase()} rocks. Try changing the filter.`
                : 'Excavate your first rock to get started on strategic goals.'}
            </p>
            {user && statusFilter === 'Active' && (
              <RockForm onSubmit={handleAddRock} ownerId={user.id} />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRocks.map((rock) => (
              <RockCard
                key={rock.id}
                rock={rock}
                owner={getOwner(rock.owner_id)}
                onUpdateSwarmDay={handleUpdateSwarmDay}
                onUpdateProgress={handleUpdateProgress}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <footer className="border-t border-border px-6 py-3">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {rocks.filter(r => r.status === 'Active').length} Active
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {rocks.filter(r => r.status === 'Completed').length} Completed
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {rocks.filter(r => r.status === 'Shelved').length} Shelved
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  )
}
