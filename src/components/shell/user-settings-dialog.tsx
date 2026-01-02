'use client'

import { useState, useEffect } from 'react'
import { useJar } from '@/contexts/jar-context'
import { createClient } from '@/lib/supabase/client'
import { TIMEZONES } from '@/lib/constants'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SlidersHorizontal, Bell, Globe, Save } from 'lucide-react'

interface UserSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserSettingsDialog({ open, onOpenChange }: UserSettingsDialogProps) {
  const { user, setUser } = useJar()
  const supabase = createClient()

  const [timezone, setTimezone] = useState(user?.timezone || 'America/New_York')
  const [capacityHours, setCapacityHours] = useState(user?.capacity_hours || 40)
  const [notificationEnabled, setNotificationEnabled] = useState(user?.notification_enabled || false)
  const [notificationTime, setNotificationTime] = useState(user?.notification_time || '09:00')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setTimezone(user.timezone)
      setCapacityHours(user.capacity_hours)
      setNotificationEnabled(user.notification_enabled)
      setNotificationTime(user.notification_time)
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    const { data, error } = await supabase
      .from('profiles')
      .update({
        timezone,
        capacity_hours: capacityHours,
        notification_enabled: notificationEnabled,
        notification_time: notificationTime,
      } as never)
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setUser(data)
      onOpenChange(false)
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">USER SETTINGS</DialogTitle>
          <DialogDescription>
            Calibrate your environment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Jar Calibration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-success">
              <SlidersHorizontal className="h-4 w-4" />
              The Jar Calibration
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-xs text-muted-foreground">
                  Timezone
                </Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone" className="bg-muted">
                    <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-xs text-muted-foreground">
                  Weekly Capacity (Hours)
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  max={80}
                  value={capacityHours}
                  onChange={(e) => setCapacityHours(Number(e.target.value))}
                  className="bg-muted"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-success">
              <Bell className="h-4 w-4" />
              Notifications
            </div>

            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Morning Sediment Check</div>
                  <div className="text-sm text-muted-foreground">
                    Receive a daily calendar summary of your Rocks and Sand.
                  </div>
                </div>
                <Switch
                  checked={notificationEnabled}
                  onCheckedChange={setNotificationEnabled}
                />
              </div>

              {notificationEnabled && (
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20">
                    <Bell className="h-4 w-4 text-success" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Notification Time
                    </div>
                    <Input
                      type="time"
                      value={notificationTime}
                      onChange={(e) => setNotificationTime(e.target.value)}
                      className="h-8 w-32 bg-muted"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="rounded-lg bg-muted/30 p-4">
            <div className="text-xs font-mono text-success">
              SYS.STATUS: ONLINE
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-success hover:bg-success/90">
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
