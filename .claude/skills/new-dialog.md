# /new-dialog - Generate Dialog Component

Create a new Create/Edit dialog following Headwaters patterns.

## Usage
```
/new-dialog [EntityName]
```
Example: `/new-dialog BuildSignal`

## Generated Files
- `src/components/[category]/create-[entity]-dialog.tsx`
- `src/components/[category]/edit-[entity]-dialog.tsx`

## Pattern Template

```typescript
"use client"

import * as React from "react"
import { toast } from "sonner"
import { [Icon] } from "lucide-react"
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
import { useTeam } from "@/contexts/team-context"

interface Create[Entity]DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (data: Create[Entity]Data) => Promise<void>
}

interface Create[Entity]Data {
  team_id: string
  // ... entity fields
}

export function Create[Entity]Dialog({ open, onOpenChange, onSave }: Create[Entity]DialogProps) {
  const { activeTeam } = useTeam()
  const [isSaving, setIsSaving] = React.useState(false)

  // Form state
  const [field1, setField1] = React.useState("")

  const isValid = field1.trim() && activeTeam

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !activeTeam) return

    setIsSaving(true)
    try {
      if (onSave) {
        await onSave({ team_id: activeTeam.id, /* fields */ })
      }
      toast.success("[Entity] created successfully")
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create [entity]:", error)
      toast.error("Failed to create [entity]")
    } finally {
      setIsSaving(false)
    }
  }

  function resetForm() {
    setField1("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* ... form */}
      </DialogContent>
    </Dialog>
  )
}
```

## Key Patterns

1. **useTeam()** for team context
2. **toast()** for success/error feedback
3. **isValid** check before submit
4. **resetForm()** on success
5. **DialogFooter** with Cancel + Submit buttons

## Existing Examples
- `src/components/climb/create-rock-dialog.tsx`
- `src/components/climb/create-project-dialog.tsx`
- `src/components/commitment/create-commitment-dialog.tsx`
