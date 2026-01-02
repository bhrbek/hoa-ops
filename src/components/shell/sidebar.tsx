"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Mountain, Waves, TrendingUp, LayoutDashboard, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

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
    description: "Engagements",
  },
  {
    title: "The Climb",
    href: "/climb",
    icon: TrendingUp,
    description: "Strategy",
  },
]

interface SidebarProps {
  user?: {
    name: string
    email: string
    avatar?: string
    initials: string
  }
  capacityPercent?: number
}

export function Sidebar({
  user = {
    name: "Sarah Jenkins",
    email: "sarah@company.com",
    initials: "SJ"
  },
  capacityPercent = 80
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-[280px] flex-col bg-slate-50 border-r border-slate-200">
      {/* Header / Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-white shadow-lg">
          <Mountain className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">THE JAR</h1>
          <p className="text-xs text-slate-500">Strategic OS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
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
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
              {user.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
