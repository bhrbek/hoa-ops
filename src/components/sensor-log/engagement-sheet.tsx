'use client'

import { useState, useEffect } from 'react'
import type { Engagement } from '@/types/database'
import { DEFAULT_DOMAINS, DEFAULT_OEMS, PRIORITIES, ENGAGEMENT_STATUSES } from '@/lib/constants'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Radio, Save, X, Lightbulb, Briefcase, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EngagementSheetProps {
  engagement: Engagement | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (engagement: Partial<Engagement>) => void
  isNew?: boolean
}

export function EngagementSheet({
  engagement,
  open,
  onOpenChange,
  onSave,
  isNew = false,
}: EngagementSheetProps) {
  const [formData, setFormData] = useState<Partial<Engagement>>({
    customer_name: '',
    internal_req_id: '',
    domains: [],
    oems: [],
    themes: [],
    is_strategic_signal: false,
    signal_context: '',
    estimated_effort: 0,
    priority: 'Medium',
    status: 'Lead',
    revenue_amt: 0,
    next_steps: '',
  })
  const [newTheme, setNewTheme] = useState('')

  useEffect(() => {
    if (engagement) {
      setFormData(engagement)
    } else if (isNew) {
      setFormData({
        customer_name: '',
        internal_req_id: '',
        domains: [],
        oems: [],
        themes: [],
        is_strategic_signal: false,
        signal_context: '',
        estimated_effort: 0,
        priority: 'Medium',
        status: 'Lead',
        revenue_amt: 0,
        next_steps: '',
      })
    }
  }, [engagement, isNew])

  const handleSave = () => {
    onSave(formData)
    onOpenChange(false)
  }

  const addTheme = () => {
    if (newTheme && !formData.themes?.includes(newTheme)) {
      setFormData(prev => ({
        ...prev,
        themes: [...(prev.themes || []), newTheme],
      }))
      setNewTheme('')
    }
  }

  const removeTheme = (theme: string) => {
    setFormData(prev => ({
      ...prev,
      themes: prev.themes?.filter(t => t !== theme) || [],
    }))
  }

  const toggleDomain = (domain: string) => {
    setFormData(prev => ({
      ...prev,
      domains: prev.domains?.includes(domain)
        ? prev.domains.filter(d => d !== domain)
        : [...(prev.domains || []), domain],
    }))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-background pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Radio className="h-5 w-5 text-primary" />
            <SheetTitle className="font-mono text-xl">
              {isNew ? 'New Engagement' : 'Sensor Log'}
            </SheetTitle>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Customer: {formData.customer_name || 'Enter name'}
            </span>
            {formData.internal_req_id && (
              <Badge variant="outline">REQ #{formData.internal_req_id}</Badge>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={formData.customer_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="bg-muted"
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label>Internal REQ ID</Label>
                <Input
                  value={formData.internal_req_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, internal_req_id: e.target.value }))}
                  className="bg-muted"
                  placeholder="#4092"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* The Stack */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              THE STACK
            </div>

            <div className="space-y-2">
              <Label>Domain</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_DOMAINS.map((domain) => (
                  <Badge
                    key={domain}
                    variant={formData.domains?.includes(domain) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleDomain(domain)}
                  >
                    {domain}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>OEM</Label>
              <Select
                value={formData.oems?.[0] || ''}
                onValueChange={(v) => setFormData(prev => ({ ...prev, oems: [v] }))}
              >
                <SelectTrigger className="bg-muted">
                  <SelectValue placeholder="Select OEM..." />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_OEMS.map((oem) => (
                    <SelectItem key={oem} value={oem}>{oem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                <Input
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTheme()}
                  className="bg-muted"
                  placeholder="Add theme..."
                />
                <Button variant="outline" size="icon" onClick={addTheme}>
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.themes?.map((theme) => (
                  <Badge key={theme} variant="secondary" className="flex items-center gap-1">
                    #{theme}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTheme(theme)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* The Signal */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-beacon">
              <span className="h-2 w-2 rounded-full bg-beacon" />
              THE SIGNAL
            </div>

            <div className={cn(
              'rounded-lg border p-4 space-y-4',
              formData.is_strategic_signal ? 'border-beacon bg-beacon/5' : 'border-border'
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Strategic Signal?</div>
                  <div className="text-sm text-muted-foreground">
                    Does this data point illuminate a critical gap in the infrastructure?
                  </div>
                </div>
                <Switch
                  checked={formData.is_strategic_signal}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_strategic_signal: v }))}
                />
              </div>

              {formData.is_strategic_signal && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-beacon text-sm font-medium">
                    <Lightbulb className="h-4 w-4" />
                    PIVOT CONTEXT
                  </div>
                  <Textarea
                    value={formData.signal_context || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, signal_context: e.target.value }))}
                    placeholder="Describe the strategic gap..."
                    className="bg-muted resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Capacity Impact */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              CAPACITY IMPACT
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Est. Effort (Hrs)</Label>
                <Input
                  type="number"
                  value={formData.estimated_effort || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_effort: Number(e.target.value) }))}
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v: 'High' | 'Medium' | 'Low') => setFormData(prev => ({ ...prev, priority: v }))}
                >
                  <SelectTrigger className="bg-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className={p.color}>{p.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Revenue ($)</Label>
                <Input
                  type="number"
                  value={formData.revenue_amt || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, revenue_amt: Number(e.target.value) }))}
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as Engagement['status'] }))}
                >
                  <SelectTrigger className="bg-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENGAGEMENT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Next Steps</Label>
              <Textarea
                value={formData.next_steps || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, next_steps: e.target.value }))}
                placeholder="What's the next action?"
                className="bg-muted resize-none"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background pt-4 border-t border-border flex gap-3">
          <Button onClick={handleSave} className="flex-1 bg-beacon hover:bg-beacon/90">
            <Save className="mr-2 h-4 w-4" />
            Save to Log
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
