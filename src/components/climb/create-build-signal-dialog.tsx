"use client"

import * as React from "react"
import { toast } from "sonner"
import { Target } from "lucide-react"
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
import { createBuildSignal } from "@/app/actions/build-signals"

interface CreateBuildSignalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rockId: string
  rockTitle: string
  onCreated?: () => void
}

export function CreateBuildSignalDialog({
  open,
  onOpenChange,
  rockId,
  rockTitle,
  onCreated,
}: CreateBuildSignalDialogProps) {
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [targetValue, setTargetValue] = React.useState("")
  const [unit, setUnit] = React.useState("")
  const [dueDate, setDueDate] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  const isValid = title.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setIsSaving(true)

    try {
      await createBuildSignal({
        rock_id: rockId,
        title: title.trim(),
        description: description.trim() || undefined,
        target_value: targetValue ? parseFloat(targetValue) : undefined,
        unit: unit.trim() || undefined,
        due_date: dueDate || undefined,
      })

      toast.success("Build signal created successfully")
      resetForm()
      onOpenChange(false)
      onCreated?.()
    } catch (error) {
      console.error("Failed to create build signal:", error)
      toast.error("Failed to create build signal")
    } finally {
      setIsSaving(false)
    }
  }

  function resetForm() {
    setTitle("")
    setDescription("")
    setTargetValue("")
    setUnit("")
    setDueDate("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center text-white">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Add Build Signal</DialogTitle>
              <DialogDescription>
                Create a measurable outcome for &quot;{rockTitle}&quot;
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="signal-title">
              Signal Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="signal-title"
              placeholder="e.g., 3 Enterprise POCs Completed"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-slate-500">
              A clear, measurable outcome that indicates Rock progress.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="signal-description">
              Description <span className="text-slate-400">(optional)</span>
            </Label>
            <Textarea
              id="signal-description"
              placeholder="Additional context about this signal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Target Value + Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signal-target">
                Target Value <span className="text-slate-400">(optional)</span>
              </Label>
              <Input
                id="signal-target"
                type="number"
                placeholder="e.g., 3"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signal-unit">
                Unit <span className="text-slate-400">(optional)</span>
              </Label>
              <Input
                id="signal-unit"
                placeholder="e.g., POCs, contracts, demos"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="signal-due-date">
              Due Date <span className="text-slate-400">(optional)</span>
            </Label>
            <Input
              id="signal-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!isValid || isSaving}>
              {isSaving ? "Creating..." : "Create Signal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
