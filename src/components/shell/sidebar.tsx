"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Waves, LayoutDashboard, Settings, ClipboardList, BarChart3, Mountain, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { TeamSelector } from "@/components/shell/team-selector"
import { useTeam } from "@/contexts/team-context"
import { signOut } from "@/app/actions/auth"

const navItems = [
  {
    title: "The Vista",
    href: "/",
    icon: LayoutDashboard,
    description: "Dashboard",
  },
  {
    title: "The Stream",
    href: "/stream",
    icon: Waves,
    description: "Issues",
  },
  {
    title: "Priorities",
    href: "/rocks",
    icon: Mountain,
    description: "Strategy",
  },
  {
    title: "Commitments",
    href: "/commitment-board",
    icon: ClipboardList,
    description: "Monthly",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    description: "Analytics",
  },
]

interface SidebarProps {
  capacityPercent?: number
}

export function Sidebar({
  capacityPercent = 80
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, isOrgAdmin } = useTeam()
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Failed to sign out:', error)
      setIsSigningOut(false)
    }
  }

  // Get initials from user's full name
  const userInitials = React.useMemo(() => {
    if (!user?.full_name) return "??"
    const parts = user.full_name.split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return user.full_name.slice(0, 2).toUpperCase()
  }, [user?.full_name])

  return (
    <aside className="flex h-screen w-[280px] flex-col bg-slate-50 border-r border-slate-200">
      {/* Header / Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L8 8h8l-4-6z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 14c0-2 2-4 4-4h8c2 0 4 2 4 4v0c0 3-2 6-8 8-6-2-8-5-8-8z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 10v6" strokeLinecap="round" opacity="0.5"/>
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">HOA-Ops</h1>
          <p className="text-xs text-slate-500">Community Management</p>
        </div>
      </div>

      {/* Team Selector */}
      <div className="py-3 border-b border-slate-200">
        <TeamSelector />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                isActive ? "text-blue-600" : "text-slate-400"
              )} />
              <div className="flex flex-col">
                <span>{item.title}</span>
                <span className={cn(
                  "text-xs",
                  isActive ? "text-slate-500" : "text-slate-400"
                )}>
                  {item.description}
                </span>
              </div>
            </Link>
          )
        })}

        {/* Admin Settings - only visible to org admins */}
        {isOrgAdmin && (
          <Link
            href="/settings/admin"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              pathname === "/settings/admin"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
            )}
          >
            <Settings className={cn(
              "h-5 w-5",
              pathname === "/settings/admin" ? "text-blue-600" : "text-slate-400"
            )} />
            <div className="flex flex-col">
              <span>Settings</span>
              <span className={cn(
                "text-xs",
                pathname === "/settings/admin" ? "text-slate-500" : "text-slate-400"
              )}>
                Admin
              </span>
            </div>
          </Link>
        )}
      </nav>

      {/* Capacity Section */}
      <div className="px-4 pb-4">
        <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Capacity
            </span>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              capacityPercent >= 90
                ? "bg-red-50 text-red-700"
                : capacityPercent >= 70
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
            )}>
              {capacityPercent}%
            </span>
          </div>

          {/* Liquid Tank Visualization */}
          <div className="relative h-24 w-full rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
            {/* Water level (top 20%) */}
            <div
              className="absolute inset-x-0 top-0 bg-gradient-to-b from-sky-200 to-sky-300 opacity-50"
              style={{ height: '20%' }}
            />
            {/* Filled capacity */}
            <div
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-600 to-slate-500 transition-all duration-500"
              style={{ height: `${Math.min(capacityPercent, 80)}%` }}
            />
            {/* Jar outline markings */}
            <div className="absolute inset-0 flex flex-col justify-between py-2 px-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-slate-300" />
                <span className="text-[10px] text-slate-400">Water</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-slate-300" />
                <span className="text-[10px] text-white/80">Rocks</span>
              </div>
            </div>
          </div>

          <p className="mt-2 text-xs text-slate-500 text-center">
            {capacityPercent >= 90 ? "Shield Up! Near max capacity" : "32 hrs available this week"}
          </p>
        </div>
      </div>

      <Separator />

      {/* User Profile Footer */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
              <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <div className="flex items-center gap-1">
              {isOrgAdmin && (
                <Link
                  href="/settings/admin"
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Admin Settings"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              )}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500 text-center">Not signed in</div>
        )}
      </div>
    </aside>
  )
}
