'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useJar } from '@/contexts/jar-context'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserSettingsDialog } from '@/components/shell/user-settings-dialog'
import { Settings, LogOut, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

export function UserNav() {
  const { user, isShielded } = useJar()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start gap-3 px-2 py-6">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isShielded && (
                <div className="absolute -right-1 -top-1">
                  <Shield className="h-4 w-4 text-shield animate-shield" />
                </div>
              )}
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium text-sidebar-foreground">
                {user?.full_name || 'User'}
              </span>
              <span className={cn(
                'text-xs',
                isShielded ? 'text-warning font-medium' : 'text-muted-foreground'
              )}>
                {isShielded ? 'SHIELDED' : `ID: #${user?.id?.slice(0, 6) || '---'}`}
              </span>
            </div>
            <Settings className="ml-auto h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
