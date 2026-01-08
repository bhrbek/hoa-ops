"use client"

import * as React from "react"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
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
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTeam } from "@/contexts/team-context"
import type { Rock, RockStatus } from "@/types/supabase"

interface EditRockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rock: Rock
  onSave?: (rockId: string, data: UpdateRockData) => Promise<void>
}

interface UpdateRockData {
  title?: string
  owner_id?: string
  status?: RockStatus
  perfect_outcome?: string
  worst_outcome?: string
  progress_override?: number | null
}

const quarters = [
  { value: "Q1 2026", label: "Q1 2026" },
  { value: "Q2 2026", label: "Q2 2026" },
  { value: "Q3 2026", label: "Q3 2026" },
  { value: "Q4 2026", label: "Q4 2026" },
]

const statuses: { value: RockStatus; label: string; color: string }[] = [
  { value: "On Track", label: "On Track", color: "bg-emerald-100 text-emerald-700" },
  { value: "At Risk", label: "At Risk", color: "bg-amber-100 text-amber-700" },
  { value: "Off Track", label: "Off Track", color: "bg-red-100 text-red-700" },
  { value: "Done", label: "Done", color: "bg-blue-100 text-blue-700" },
]

function getInitials(name: string): string {
  const parts = name.split(" ")
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function EditRockDialog({ open, onOpenChange, rock, onSave }: EditRockDialogProps) {
  const { teamMembers, isLoading: isLoadingTeam } = useTeam()

  const [title, setTitle] = React.useState(rock.title)
  const [owner, setOwner] = React.useState(rock.owner_id || "")
  const [quarter, setQuarter] = React.useState(rock.quarter)
  const [status, setStatus] = React.useState<RockStatus>(rock.status)
  const [perfectOutcome, setPerfectOutcome] = React.useState(rock.perfect_outcome)
  const [worstOutcome, setWorstOutcome] = React.useState(rock.worst_outcome || "")
  const [isSaving, setIsSaving] = React.useState(false)

  // Reset form when rock changes
  React.useEffect(() => {
    setTitle(rock.title)
    setOwner(rock.owner_id || "")
    setQuarter(rock.quarter)
    setStatus(rock.status)
    setPerfectOutcome(rock.perfect_outcome)
    setWorstOutcome(rock.worst_outcome || "")
  }, [rock])

  // Strip HTML tags to check if there's actual content
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim()
  const isValid = title.trim() && owner && stripHtml(perfectOutcome)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setIsSaving(true)

    const data: UpdateRockData = {
      title,
      owner_id: owner,
      status,
      perfect_outcome: perfectOutcome,
      worst_outcome: worstOutcome || undefined,
    }

    try {
      if (onSave) {
        await onSave(rock.id, data)
      }

      toast.success("Rock updated successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update rock:", error)
      toast.error("Failed to update rock")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-white">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Edit Rock</DialogTitle>
              <DialogDescription>
                Update this quarterly strategic goal.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-rock-title">Rock Title</Label>
            <Input
              id="edit-rock-title"
              placeholder="e.g., Launch Enterprise API Integration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Owner & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-rock-owner">Owner</Label>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger id="edit-rock-owner">
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
                          {membership.role === "manager" && (
                            <span className="text-xs text-slate-400">(Manager)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-rock-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as RockStatus)}>
                <SelectTrigger id="edit-rock-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${s.color.split(' ')[0]}`} />
                        <span>{s.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quarter (read-only display) */}
          <div className="space-y-2">
            <Label className="text-slate-500">Quarter</Label>
            <div className="text-sm text-slate-600 py-2 px-3 bg-slate-50 rounded-md">
              {quarter}
            </div>
            <p className="text-xs text-slate-400">
              Quarter cannot be changed after creation.
            </p>
          </div>

          {/* Perfect Outcome */}
          <div className="space-y-2">
            <Label>
              Perfect Outcome <span className="text-red-500">*</span>
            </Label>
            <RichTextEditor
              value={perfectOutcome}
              onChange={setPerfectOutcome}
              placeholder="Describe the ideal end state. Be specific with metrics."
              minHeight="200px"
            />
            <p className="text-xs text-slate-500">
              The perfect outcome is your North Star. Make it measurable. Use formatting, images, and tables to clarify your vision.
            </p>
          </div>

          {/* Worst Outcome (optional) */}
          <div className="space-y-2">
            <Label>
              Worst Outcome <span className="text-slate-400">(optional)</span>
            </Label>
            <RichTextEditor
              value={worstOutcome}
              onChange={setWorstOutcome}
              placeholder="What does failure look like? This helps identify risks early."
              minHeight="120px"
            />
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
