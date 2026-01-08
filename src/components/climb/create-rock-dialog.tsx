"use client"

import * as React from "react"
import { toast } from "sonner"
import { Flag } from "lucide-react"
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

interface CreateRockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (data: CreateRockData) => Promise<void>
}

interface CreateRockData {
  team_id: string
  title: string
  owner_id: string
  quarter: string
  perfect_outcome: string
  worst_outcome?: string
}

const quarters = [
  { value: "Q1 2026", label: "Q1 2026" },
  { value: "Q2 2026", label: "Q2 2026" },
  { value: "Q3 2026", label: "Q3 2026" },
  { value: "Q4 2026", label: "Q4 2026" },
]

function getInitials(name: string): string {
  const parts = name.split(" ")
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function CreateRockDialog({ open, onOpenChange, onSave }: CreateRockDialogProps) {
  const { activeTeam, teamMembers, isLoading: isLoadingTeam } = useTeam()

  const [title, setTitle] = React.useState("")
  const [owner, setOwner] = React.useState("")
  const [quarter, setQuarter] = React.useState("Q1 2026")
  const [perfectOutcome, setPerfectOutcome] = React.useState("")
  const [worstOutcome, setWorstOutcome] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  // Strip HTML tags to check if there's actual content
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim()
  const isValid = title.trim() && owner && stripHtml(perfectOutcome) && activeTeam

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !activeTeam) return

    setIsSaving(true)

    const data: CreateRockData = {
      team_id: activeTeam.id,
      title,
      owner_id: owner,
      quarter,
      perfect_outcome: perfectOutcome,
      worst_outcome: worstOutcome || undefined,
    }

    try {
      if (onSave) {
        await onSave(data)
      }

      toast.success("Rock created successfully")

      // Reset and close
      setTitle("")
      setOwner("")
      setQuarter("Q1 2026")
      setPerfectOutcome("")
      setWorstOutcome("")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create rock:", error)
      toast.error("Failed to create rock")
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
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Create New Rock</DialogTitle>
              <DialogDescription>
                Define a quarterly strategic goal for your team.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="rock-title">Rock Title</Label>
            <Input
              id="rock-title"
              placeholder="e.g., Launch Enterprise API Integration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Owner & Quarter */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rock-owner">Owner</Label>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger id="rock-owner">
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
              <Label htmlFor="rock-quarter">Quarter</Label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger id="rock-quarter">
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((q) => (
                    <SelectItem key={q.value} value={q.value}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Perfect Outcome */}
          <div className="space-y-2">
            <Label>
              Perfect Outcome <span className="text-red-500">*</span>
            </Label>
            <RichTextEditor
              value={perfectOutcome}
              onChange={setPerfectOutcome}
              placeholder="Describe the ideal end state. Be specific with metrics. e.g., '5 Beta clients live by March 30 with full API integration, generating $500k pipeline.'"
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
              {isSaving ? "Creating..." : "Create Rock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
