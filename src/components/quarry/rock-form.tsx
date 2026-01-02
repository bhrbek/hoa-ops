'use client'

import { useState } from 'react'
import type { Rock } from '@/types/database'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mountain, Pickaxe } from 'lucide-react'

interface RockFormProps {
  onSubmit: (rock: Omit<Rock, 'id' | 'created_at' | 'updated_at'>) => void
  ownerId: string
}

export function RockForm({ onSubmit, ownerId }: RockFormProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [perfectOutcome, setPerfectOutcome] = useState('')
  const [worstOutcome, setWorstOutcome] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onSubmit({
      title,
      owner_id: ownerId,
      perfect_outcome: perfectOutcome,
      worst_outcome: worstOutcome,
      status: 'Active',
      progress: 0,
      swarm_day: null,
      start_date: new Date().toISOString().split('T')[0],
      due_date: null,
    })

    // Reset form
    setTitle('')
    setPerfectOutcome('')
    setWorstOutcome('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Pickaxe className="mr-2 h-4 w-4" />
          Excavate New Rock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mountain className="h-5 w-5" />
            Excavate New Rock
          </DialogTitle>
          <DialogDescription>
            Define a new strategic rock with clear outcomes. This will help the team stay focused.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Rock Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Build Wi-Fi 7 Lab"
              className="bg-muted"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="perfect">
              <span className="text-success">Perfect Outcome</span>
            </Label>
            <Textarea
              id="perfect"
              value={perfectOutcome}
              onChange={(e) => setPerfectOutcome(e.target.value)}
              placeholder="Lab operational, 5 engineers trained, demo ready for Q4..."
              className="bg-muted resize-none"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="worst">
              <span className="text-destructive">Worst Outcome</span>
            </Label>
            <Textarea
              id="worst"
              value={worstOutcome}
              onChange={(e) => setWorstOutcome(e.target.value)}
              placeholder="Hardware sits in box, team confused, budget overrun..."
              className="bg-muted resize-none"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Pickaxe className="mr-2 h-4 w-4" />
              Excavate Rock
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
