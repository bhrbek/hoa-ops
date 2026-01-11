"use client"

import * as React from "react"
import { toast } from "sonner"
import { X, User, Clock, AlertTriangle } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
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
import { Badge } from "@/components/ui/badge"
import { useTeam } from "@/contexts/team-context"
import type { Issue, Rock, Vendor } from "@/types/supabase"

interface EngagementDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  issue?: Issue & {
    owner?: { full_name: string } | null
    last_editor?: { full_name: string } | null
  }
  onSave?: (data: IssueFormData) => Promise<void>
}

interface IssueFormData {
  title: string
  description?: string
  date: string
  issue_type: string
  priority: string
  status: string
  notes: string
  rock_id: string | null
  vendor_ids: string[]
}

const ISSUE_TYPES = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'request', label: 'Request' },
  { value: 'violation', label: 'Violation' },
  { value: 'other', label: 'Other' },
]

const PRIORITIES = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

export function EngagementDrawer({
  open,
  onOpenChange,
  issue,
  onSave,
}: EngagementDrawerProps) {
  const { activeTeam } = useTeam()

  // Form state
  const [title, setTitle] = React.useState(issue?.title || "")
  const [description, setDescription] = React.useState(issue?.description || "")
  const [issueType, setIssueType] = React.useState<string>(issue?.issue_type || "maintenance")
  const [priority, setPriority] = React.useState<string>(issue?.priority || "medium")
  const [status, setStatus] = React.useState<string>(issue?.status || "open")
  const [date, setDate] = React.useState(
    issue?.date || new Date().toISOString().split("T")[0]
  )
  const [selectedVendors, setSelectedVendors] = React.useState<string[]>([])
  const [linkedRock, setLinkedRock] = React.useState<string>(issue?.rock_id || "")
  const [notes, setNotes] = React.useState(issue?.notes || "")
  const [isSaving, setIsSaving] = React.useState(false)

  // Data from server
  const [vendors, setVendors] = React.useState<Vendor[]>([])
  const [rocks, setRocks] = React.useState<Rock[]>([])
  const [isLoadingData, setIsLoadingData] = React.useState(true)

  // Load reference data when drawer opens
  React.useEffect(() => {
    if (open && activeTeam) {
      loadReferenceData()
    }
  }, [open, activeTeam?.id])

  async function loadReferenceData() {
    setIsLoadingData(true)
    try {
      const [
        { getVendors },
        { getActiveRocks },
      ] = await Promise.all([
        import("@/app/actions/reference"),
        import("@/app/actions/rocks"),
      ])

      const [vendorsData, rocksData] = await Promise.all([
        getVendors(),
        activeTeam ? getActiveRocks(activeTeam.id) : Promise.resolve([]),
      ])

      setVendors(vendorsData)
      setRocks(rocksData)
    } catch (error) {
      console.error("Failed to load reference data:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Reset form when issue changes
  React.useEffect(() => {
    if (issue) {
      setTitle(issue.title || "")
      setDescription(issue.description || "")
      setIssueType(issue.issue_type || "maintenance")
      setPriority(issue.priority || "medium")
      setStatus(issue.status || "open")
      setDate(issue.date)
      setLinkedRock(issue.rock_id || "")
      setNotes(issue.notes || "")
    } else {
      resetForm()
    }
  }, [issue])

  function resetForm() {
    setTitle("")
    setDescription("")
    setIssueType("maintenance")
    setPriority("medium")
    setStatus("open")
    setDate(new Date().toISOString().split("T")[0])
    setSelectedVendors([])
    setLinkedRock("")
    setNotes("")
  }

  const toggleVendor = (vendorId: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter((v) => v !== vendorId)
        : [...prev, vendorId]
    )
  }

  const handleSave = async (andLogAnother: boolean) => {
    if (!title.trim()) return

    setIsSaving(true)

    const formData: IssueFormData = {
      title,
      description: description || undefined,
      date,
      issue_type: issueType,
      priority,
      status,
      notes,
      rock_id: linkedRock || null,
      vendor_ids: selectedVendors,
    }

    try {
      if (onSave) {
        await onSave(formData)
      }

      toast.success(isEditing ? "Issue updated" : "Issue created")

      if (andLogAnother) {
        resetForm()
      } else {
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Failed to save issue:", error)
      toast.error("Failed to save issue")
    } finally {
      setIsSaving(false)
    }
  }

  const isEditing = !!issue

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Issue" : "Create New Issue"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the details of this issue."
              : "Log a new HOA issue or request."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* Creator/Editor Info (for existing issues) */}
          {isEditing && issue && (
            <div className="flex items-center gap-4 text-xs text-slate-500 pb-4 border-b border-slate-100">
              {issue.owner && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  <span>Created by {issue.owner.full_name}</span>
                </div>
              )}
              {issue.last_editor && issue.last_edited_at && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>Edited by {issue.last_editor.full_name}</span>
                </div>
              )}
            </div>
          )}

          {/* Issue Details Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Issue Details
            </h3>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date Reported</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Issue Type */}
            <div className="space-y-2">
              <Label htmlFor="issue-type">Issue Type</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger id="issue-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Priority & Status
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Vendors Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Related Vendors
            </h3>

            <div className="space-y-2">
              <Label>Vendors</Label>
              {isLoadingData ? (
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-6 w-16 bg-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : vendors.length === 0 ? (
                <p className="text-sm text-slate-500">No vendors configured</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {vendors.map((vendor) => (
                    <button
                      key={vendor.id}
                      type="button"
                      onClick={() => toggleVendor(vendor.id)}
                      className="focus:outline-none"
                    >
                      <Badge
                        variant={selectedVendors.includes(vendor.id) ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          selectedVendors.includes(vendor.id)
                            ? "ring-2 ring-slate-300"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {vendor.name}
                        {selectedVendors.includes(vendor.id) && <X className="h-3 w-3 ml-1" />}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-500">Select vendors involved with this issue</p>
            </div>
          </div>

          {/* Link to Priority Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Link to Priority
            </h3>

            <div className="space-y-2">
              <Label htmlFor="linked-rock">Link to Priority (Optional)</Label>
              <Select
                value={linkedRock || "none"}
                onValueChange={(val) => setLinkedRock(val === "none" ? "" : val)}
              >
                <SelectTrigger id="linked-rock">
                  <SelectValue placeholder="Select a priority to link..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No link</SelectItem>
                  {rocks.map((rock) => (
                    <SelectItem key={rock.id} value={rock.id}>
                      {rock.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Connect this issue to a strategic priority
              </p>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional context or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <SheetFooter>
          {!isEditing && (
            <Button
              variant="outline"
              onClick={() => handleSave(true)}
              disabled={isSaving || !title.trim()}
            >
              Save & Create Another
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => handleSave(false)}
            disabled={isSaving || !title.trim()}
          >
            {isSaving ? "Saving..." : isEditing ? "Update" : "Save & Close"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
