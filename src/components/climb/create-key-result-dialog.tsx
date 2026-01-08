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
import { createKeyResult } from "@/app/actions/key-results"

interface CreateKeyResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rockId: string
  rockTitle: string
  onCreated?: () => void
}

export function CreateKeyResultDialog({
  open,
  onOpenChange,
  rockId,
  rockTitle,
  onCreated,
}: CreateKeyResultDialogProps) {
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
      await createKeyResult({
        rock_id: rockId,
        title: title.trim(),
        description: description.trim() || undefined,
        target_value: targetValue ? parseFloat(targetValue) : undefined,
        unit: unit.trim() || undefined,
        due_date: dueDate || undefined,
      })

      toast.success("Key Result created successfully")
      resetForm()
      onOpenChange(false)
      onCreated?.()
    } catch (error) {
      console.error("Failed to create key result:", error)
      toast.error("Failed to create key result")
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
              <DialogTitle>Add Key Result</DialogTitle>
              <DialogDescription>
                Create a measurable outcome for &quot;{rockTitle}&quot;
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="kr-title">
              Key Result <span className="text-red-500">*</span>
            </Label>
            <Input
              id="kr-title"
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
            <Label htmlFor="kr-description">
              Description <span className="text-slate-400">(optional)</span>
            </Label>
            <Textarea
              id="kr-description"
              placeholder="Additional context about this key result..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Target Value + Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kr-target">
                Target Value <span className="text-slate-400">(optional)</span>
              </Label>
              <Input
                id="kr-target"
                type="number"
                placeholder="e.g., 3"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kr-unit">
                Unit <span className="text-slate-400">(optional)</span>
              </Label>
              <Input
                id="kr-unit"
                placeholder="e.g., POCs, contracts, demos"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="kr-due-date">
              Due Date <span className="text-slate-400">(optional)</span>
            </Label>
            <Input
              id="kr-due-date"
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
              {isSaving ? "Creating..." : "Create Key Result"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
