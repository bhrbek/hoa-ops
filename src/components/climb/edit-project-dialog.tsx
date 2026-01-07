"use client"

import * as React from "react"
import { toast } from "sonner"
import { Pencil, AlertTriangle } from "lucide-react"
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
import type { Project, ProjectStatus } from "@/types/supabase"

interface EditProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
  rockTitle?: string
  onSave?: (projectId: string, data: UpdateProjectData) => Promise<void>
}

interface UpdateProjectData {
  title?: string
  owner_id?: string
  status?: ProjectStatus
  start_date?: string
  end_date?: string
  estimated_hours?: number
}

const statuses: { value: ProjectStatus; label: string }[] = [
  { value: "Active", label: "Active" },
  { value: "Done", label: "Done" },
  { value: "Blocked", label: "Blocked" },
]

function getInitials(name: string): string {
  const parts = name.split(" ")
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  rockTitle,
  onSave,
}: EditProjectDialogProps) {
  const { teamMembers, isLoading: isLoadingTeam } = useTeam()

  const [title, setTitle] = React.useState(project.title)
  const [owner, setOwner] = React.useState(project.owner_id || "")
  const [status, setStatus] = React.useState<ProjectStatus>(project.status)
  const [startDate, setStartDate] = React.useState(project.start_date || "")
  const [endDate, setEndDate] = React.useState(project.end_date || "")
  const [estimatedHours, setEstimatedHours] = React.useState(
    project.estimated_hours?.toString() || ""
  )
  const [isSaving, setIsSaving] = React.useState(false)

  // Find selected owner's capacity (from team members)
  const selectedMember = teamMembers.find((m) => m.user_id === owner)
  const capacityPercent = selectedMember?.role === "manager" ? 85 : 60
  const isAtCapacity = capacityPercent >= 90

  // Reset form when project changes
  React.useEffect(() => {
    setTitle(project.title)
    setOwner(project.owner_id || "")
    setStatus(project.status)
    setStartDate(project.start_date || "")
    setEndDate(project.end_date || "")
    setEstimatedHours(project.estimated_hours?.toString() || "")
  }, [project])

  const isValid = title.trim() && owner && startDate && endDate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setIsSaving(true)

    const data: UpdateProjectData = {
      title,
      owner_id: owner,
      status,
      start_date: startDate,
      end_date: endDate,
      estimated_hours: parseFloat(estimatedHours) || 0,
    }

    try {
      if (onSave) {
        await onSave(project.id, data)
      }

      toast.success("Project updated successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update project:", error)
      toast.error("Failed to update project")
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
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update this project's details.
                {rockTitle && (
                  <span className="block text-xs mt-1">
                    Part of: <span className="font-medium">{rockTitle}</span>
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-project-title">Project Title</Label>
            <Input
              id="edit-project-title"
              placeholder="e.g., Backend Architecture Upgrade"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Owner & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-owner">Owner</Label>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger id="edit-project-owner">
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
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">
                              {getInitials(membership.user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{membership.user.full_name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Capacity Warning */}
              {owner && isAtCapacity && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium">Shield Up!</p>
                    <p className="text-amber-700">
                      {selectedMember?.user.full_name} is at {capacityPercent}% capacity.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-project-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger id="edit-project-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-start">Start Date</Label>
              <Input
                id="edit-project-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-end">End Date</Label>
              <Input
                id="edit-project-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Estimated Hours */}
          <div className="space-y-2">
            <Label htmlFor="edit-project-hours">Estimated Hours</Label>
            <Input
              id="edit-project-hours"
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
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
