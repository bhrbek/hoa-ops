"use client"

import * as React from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CreateRockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const quarters = [
  { value: "Q1 2026", label: "Q1 2026" },
  { value: "Q2 2026", label: "Q2 2026" },
  { value: "Q3 2026", label: "Q3 2026" },
  { value: "Q4 2026", label: "Q4 2026" },
]

const owners = [
  { value: "sarah", name: "Sarah J.", initials: "SJ" },
  { value: "mike", name: "Mike R.", initials: "MR" },
  { value: "alex", name: "Alex T.", initials: "AT" },
  { value: "david", name: "David K.", initials: "DK" },
]

export function CreateRockDialog({ open, onOpenChange }: CreateRockDialogProps) {
  const [title, setTitle] = React.useState("")
  const [owner, setOwner] = React.useState("")
  const [quarter, setQuarter] = React.useState("Q1 2026")
  const [perfectOutcome, setPerfectOutcome] = React.useState("")

  const isValid = title.trim() && owner && perfectOutcome.trim()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    // TODO: Save to database
    console.log({ title, owner, quarter, perfectOutcome })

    // Reset and close
    setTitle("")
    setOwner("")
    setQuarter("Q1 2026")
    setPerfectOutcome("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
                  {owners.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.name}
                    </SelectItem>
                  ))}
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
            <Label htmlFor="rock-outcome">
              Perfect Outcome <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="rock-outcome"
              placeholder="Describe the ideal end state. Be specific with metrics. e.g., '5 Beta clients live by March 30 with full API integration, generating $500k pipeline.'"
              value={perfectOutcome}
              onChange={(e) => setPerfectOutcome(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-slate-500">
              The perfect outcome is your North Star. Make it measurable.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!isValid}>
              Create Rock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
