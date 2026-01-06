"use client"

import * as React from "react"
import { Folder, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTeam } from "@/contexts/team-context"
import type { Rock, Project } from "@/types/supabase"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultRockId?: string
  rocks?: Rock[]
  onSave?: (data: CreateProjectData) => Promise<void>
}

interface CreateProjectData {
  rock_id: string
  title: string
  owner_id: string
  start_date: string
  end_date: string
  estimated_hours: number
}

function getInitials(name: string): string {
  const parts = name.split(" ")
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  defaultRockId,
  rocks = [],
  onSave,
}: CreateProjectDialogProps) {
  const { activeTeam, teamMembers, isLoading: isLoadingTeam } = useTeam()

  const [rockId, setRockId] = React.useState(defaultRockId || "")
  const [title, setTitle] = React.useState("")
  const [owner, setOwner] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [estimatedHours, setEstimatedHours] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  // Find selected owner's capacity (from team members)
  const selectedMember = teamMembers.find((m) => m.user_id === owner)
  // In a real scenario, we'd calculate actual capacity usage
  // For now, we'll just show if they're a manager (simulating high capacity)
  const capacityPercent = selectedMember?.role === "manager" ? 85 : 60
  const isAtCapacity = capacityPercent >= 90

  const isValid = rockId && title.trim() && owner && startDate && endDate

  // Reset rockId when defaultRockId changes
  React.useEffect(() => {
    if (defaultRockId) {
      setRockId(defaultRockId)
    }
  }, [defaultRockId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setIsSaving(true)

    const data: CreateProjectData = {
      rock_id: rockId,
      title,
      owner_id: owner,
      start_date: startDate,
      end_date: endDate,
      estimated_hours: parseFloat(estimatedHours) || 0,
    }

    try {
      if (onSave) {
        await onSave(data)
      }

      // Reset and close
      setRockId(defaultRockId || "")
      setTitle("")
      setOwner("")
      setStartDate("")
      setEndDate("")
      setEstimatedHours("")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create project:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Folder className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a supporting project (pebble) to a Rock.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Parent Rock */}
          <div className="space-y-2">
            <Label htmlFor="project-rock">Parent Rock</Label>
            <Select value={rockId} onValueChange={setRockId}>
              <SelectTrigger id="project-rock">
                <SelectValue placeholder="Select a Rock" />
              </SelectTrigger>
              <SelectContent>
                {rocks.length === 0 ? (
                  <div className="py-2 px-3 text-sm text-slate-500">
                    No rocks available
                  </div>
                ) : (
                  rocks.map((rock) => (
                    <SelectItem key={rock.id} value={rock.id}>
                      {rock.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="project-title">Project Title</Label>
            <Input
              id="project-title"
              placeholder="e.g., Backend Architecture Upgrade"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <Label htmlFor="project-owner">Owner</Label>
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger id="project-owner">
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingTeam ? (
                  <div className="py-2 px-3 text-sm text-slate-500">Loading...</div>
                ) : teamMembers.length === 0 ? (
                  <div className="py-2 px-3 text-sm text-slate-500">No team members</div>
                ) : (
                  teamMembers.map((membership) => (
                    <SelectItem key={membership.user_id} value={membership.user_id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">
                              {getInitials(membership.user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{membership.user.full_name}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Capacity Warning */}
            {owner && isAtCapacity && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Shield Up!</p>
                  <p className="text-amber-700">
                    {selectedMember?.user.full_name} is at {capacityPercent}% capacity.
                    Consider assigning to someone else or adjusting timelines.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-start">Start Date</Label>
              <Input
                id="project-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-end">End Date</Label>
              <Input
                id="project-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Estimated Hours */}
          <div className="space-y-2">
            <Label htmlFor="project-hours">Estimated Hours</Label>
            <Input
              id="project-hours"
              type="number"
              placeholder="e.g., 40"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Used for capacity planning. Leave empty if unknown.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!isValid || isSaving}>
              {isSaving ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
