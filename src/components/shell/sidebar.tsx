'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/constants'
import { JarGauge } from './jar-gauge'
import { UserNav } from './user-nav'
import {
  LayoutDashboard,
  Activity,
  Grid3X3,
  Mountain,
  BarChart3,
  Beaker,
} from 'lucide-react'

const iconMap = {
  LayoutDashboard,
  Activity,
  Grid3X3,
  Mountain,
  BarChart3,
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo/Header */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
          <Beaker className="h-5 w-5 text-primary" />
        </div>
        <span className="font-mono text-lg font-bold tracking-tight text-sidebar-foreground">
          THE JAR
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <div className="mb-2 px-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            System Ops
          </span>
        </div>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap]
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer with Jar Gauge and User */}
      <div className="border-t border-sidebar-border p-4 space-y-4">
        <JarGauge />
        <UserNav />
      </div>
    </div>
  )
}
