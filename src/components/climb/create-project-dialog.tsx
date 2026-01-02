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

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultRockId?: string
}

const rocks = [
  { id: "1", title: "Launch Enterprise API Integration" },
  { id: "2", title: "Q1 Marketing Blitz" },
  { id: "3", title: "Expand Sales Team" },
]

const owners = [
  { value: "sarah", name: "Sarah J.", initials: "SJ", capacity: 85 },
  { value: "mike", name: "Mike R.", initials: "MR", capacity: 92 },
  { value: "alex", name: "Alex T.", initials: "AT", capacity: 70 },
  { value: "david", name: "David K.", initials: "DK", capacity: 60 },
]

export function CreateProjectDialog({
  open,
  onOpenChange,
  defaultRockId,
}: CreateProjectDialogProps) {
  const [rockId, setRockId] = React.useState(defaultRockId || "")
  const [title, setTitle] = React.useState("")
  const [owner, setOwner] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [estimatedHours, setEstimatedHours] = React.useState("")

  const selectedOwner = owners.find((o) => o.value === owner)
  const isAtCapacity = selectedOwner && selectedOwner.capacity >= 90

  const isValid = rockId && title.trim() && owner && startDate && endDate

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    // TODO: Save to database
    console.log({ rockId, title, owner, startDate, endDate, estimatedHours })

    // Reset and close
    setRockId(defaultRockId || "")
    setTitle("")
    setOwner("")
    setStartDate("")
    setEndDate("")
    setEstimatedHours("")
    onOpenChange(false)
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
                {rocks.map((rock) => (
                  <SelectItem key={rock.id} value={rock.id}>
                    {rock.title}
                  </SelectItem>
                ))}
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
                {owners.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{o.name}</span>
                      <span
                        className={`text-xs ml-2 ${
                          o.capacity >= 90 ? "text-red-500" : "text-slate-400"
                        }`}
                      >
                        {o.capacity}%
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Capacity Warning */}
            {isAtCapacity && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Shield Up!</p>
                  <p className="text-amber-700">
                    {selectedOwner?.name} is at {selectedOwner?.capacity}% capacity.
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
            <Button type="submit" variant="primary" disabled={!isValid}>
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
