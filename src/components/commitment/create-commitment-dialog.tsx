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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTeam } from "@/contexts/team-context"
import type { Rock, Project, BuildSignal } from "@/types/supabase"

interface CreateCommitmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (data: CreateCommitmentData) => Promise<void>
  weekOf?: string
}

interface CreateCommitmentData {
  project_id: string
  build_signal_id: string
  definition_of_done: string
  week_of?: string
  notes?: string
}

interface ProjectWithRock extends Project {
  rock?: Rock | null
}

export function CreateCommitmentDialog({
  open,
  onOpenChange,
  onSave,
  weekOf,
}: CreateCommitmentDialogProps) {
  const { activeTeam } = useTeam()

  const [selectedRockId, setSelectedRockId] = React.useState<string>("")
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("")
  const [selectedBuildSignalId, setSelectedBuildSignalId] = React.useState<string>("")
  const [definitionOfDone, setDefinitionOfDone] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  // Data from server
  const [rocks, setRocks] = React.useState<Rock[]>([])
  const [projects, setProjects] = React.useState<ProjectWithRock[]>([])
  const [buildSignals, setBuildSignals] = React.useState<BuildSignal[]>([])
  const [isLoadingData, setIsLoadingData] = React.useState(true)

  // Load reference data when dialog opens
  React.useEffect(() => {
    if (open && activeTeam) {
      loadReferenceData()
    }
  }, [open, activeTeam?.id])

  async function loadReferenceData() {
    setIsLoadingData(true)
    try {
      const [{ getActiveRocks }, { getProjects }] = await Promise.all([
        import("@/app/actions/rocks"),
        import("@/app/actions/projects"),
      ])

      const [rocksData, projectsData] = await Promise.all([
        activeTeam ? getActiveRocks() : Promise.resolve([]),
        activeTeam ? getProjects(activeTeam.id) : Promise.resolve([]),
      ])

      setRocks(rocksData)
      setProjects(projectsData as ProjectWithRock[])
    } catch (error) {
      console.error("Failed to load reference data:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Load build signals when rock changes
  React.useEffect(() => {
    async function loadBuildSignals() {
      if (!selectedRockId) {
        setBuildSignals([])
        return
      }

      try {
        const { getBuildSignals } = await import("@/app/actions/build-signals")
        const signalsData = await getBuildSignals(selectedRockId)
        setBuildSignals(signalsData)
      } catch (error) {
        console.error("Failed to load build signals:", error)
        setBuildSignals([])
      }
    }

    loadBuildSignals()
  }, [selectedRockId])

  // Filter projects by selected rock
  const filteredProjects = selectedRockId
    ? projects.filter((p) => p.rock_id === selectedRockId)
    : []

  // Reset project and build signal when rock changes
  React.useEffect(() => {
    setSelectedProjectId("")
    setSelectedBuildSignalId("")
  }, [selectedRockId])

  const isValid =
    selectedProjectId &&
    selectedBuildSignalId &&
    definitionOfDone.trim() &&
    activeTeam

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !activeTeam) return

    setIsSaving(true)

    const data: CreateCommitmentData = {
      project_id: selectedProjectId,
      build_signal_id: selectedBuildSignalId,
      definition_of_done: definitionOfDone,
      week_of: weekOf,
      notes: notes || undefined,
    }

    try {
      if (onSave) {
        await onSave(data)
      }

      toast.success("Commitment created successfully")

      // Reset and close
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create commitment:", error)
      toast.error("Failed to create commitment")
    } finally {
      setIsSaving(false)
    }
  }

  function resetForm() {
    setSelectedRockId("")
    setSelectedProjectId("")
    setSelectedBuildSignalId("")
    setDefinitionOfDone("")
    setNotes("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Create New Commitment</DialogTitle>
              <DialogDescription>
                Make a weekly commitment linked to a project and build signal.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Rock Selection */}
          <div className="space-y-2">
            <Label htmlFor="commitment-rock">Rock</Label>
            <Select value={selectedRockId} onValueChange={setSelectedRockId}>
              <SelectTrigger id="commitment-rock">
                <SelectValue placeholder="Select a rock..." />
              </SelectTrigger>
              <SelectContent>
                {isLoadingData ? (
                  <div className="py-2 px-3 text-sm text-slate-500">Loading...</div>
                ) : rocks.length === 0 ? (
                  <div className="py-2 px-3 text-sm text-slate-500">No rocks found</div>
                ) : (
                  rocks.map((rock) => (
                    <SelectItem key={rock.id} value={rock.id}>
                      {rock.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Start by selecting the strategic rock this commitment supports.
            </p>
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="commitment-project">Project</Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={!selectedRockId}
            >
              <SelectTrigger id="commitment-project">
                <SelectValue placeholder={selectedRockId ? "Select a project..." : "Select a rock first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredProjects.length === 0 ? (
                  <div className="py-2 px-3 text-sm text-slate-500">
                    {selectedRockId ? "No projects for this rock" : "Select a rock first"}
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Build Signal Selection */}
          <div className="space-y-2">
            <Label htmlFor="commitment-signal">Build Signal</Label>
            <Select
              value={selectedBuildSignalId}
              onValueChange={setSelectedBuildSignalId}
              disabled={!selectedRockId}
            >
              <SelectTrigger id="commitment-signal">
                <SelectValue placeholder={selectedRockId ? "Select a build signal..." : "Select a rock first"} />
              </SelectTrigger>
              <SelectContent>
                {buildSignals.length === 0 ? (
                  <div className="py-2 px-3 text-sm text-slate-500">
                    {selectedRockId ? "No build signals for this rock" : "Select a rock first"}
                  </div>
                ) : (
                  buildSignals.map((signal) => (
                    <SelectItem key={signal.id} value={signal.id}>
                      {signal.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              What measurable outcome will this commitment move toward?
            </p>
          </div>

          {/* Definition of Done */}
          <div className="space-y-2">
            <Label htmlFor="commitment-dod">
              Definition of Done <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="commitment-dod"
              placeholder="What will be true at the end of this week? Be specific and measurable."
              value={definitionOfDone}
              onChange={(e) => setDefinitionOfDone(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-slate-500">
              A clear, binary statement that can be verified at week&apos;s end.
            </p>
          </div>

          {/* Notes (optional) */}
          <div className="space-y-2">
            <Label htmlFor="commitment-notes">
              Notes <span className="text-slate-400">(optional)</span>
            </Label>
            <Textarea
              id="commitment-notes"
              placeholder="Any additional context or dependencies..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!isValid || isSaving}>
              {isSaving ? "Creating..." : "Create Commitment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
