"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Building2, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTeam } from "@/contexts/team-context"

interface TeamSelectorProps {
  className?: string
  compact?: boolean
}

export function TeamSelector({ className, compact = false }: TeamSelectorProps) {
  const {
    activeTeam,
    activeOrg,
    availableTeams,
    isLoading,
    switchTeam,
  } = useTeam()

  const handleTeamChange = async (teamId: string) => {
    await switchTeam(teamId)
  }

  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-10 w-full rounded-lg bg-slate-200" />
      </div>
    )
  }

  if (!activeTeam || availableTeams.length === 0) {
    return null
  }

  // Single team - just display it
  if (availableTeams.length === 1) {
    return (
      <div className={cn("px-3 py-2", className)}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <Users className="h-4 w-4 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {activeTeam.name}
            </p>
            {activeOrg && !compact && (
              <p className="text-xs text-slate-500 truncate">{activeOrg.name}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Multiple teams - show selector
  return (
    <div className={cn("px-3", className)}>
      <Select value={activeTeam.id} onValueChange={handleTeamChange}>
        <SelectTrigger className="w-full bg-white border-slate-200 hover:bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-100">
              <Users className="h-3 w-3 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <span className="text-sm font-medium truncate block">
                {activeTeam.name}
              </span>
            </div>
          </div>
        </SelectTrigger>
        <SelectContent>
          {activeOrg && (
            <div className="px-2 py-1.5 mb-1 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Building2 className="h-3 w-3" />
                <span>{activeOrg.name}</span>
              </div>
            </div>
          )}
          {availableTeams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span>{team.name}</span>
                {team.id === activeTeam.id && (
                  <Check className="h-4 w-4 text-emerald-500 ml-auto" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {activeOrg && !compact && (
        <p className="text-xs text-slate-400 mt-1 px-1 truncate">
          {activeOrg.name}
        </p>
      )}
    </div>
  )
}

// Compact version for mobile/small spaces
export function TeamSelectorCompact({ className }: { className?: string }) {
  return <TeamSelector className={className} compact />
}
