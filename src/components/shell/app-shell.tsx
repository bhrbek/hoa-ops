"use client"

import * as React from "react"
import { Sidebar } from "./sidebar"
import { TeamProvider } from "@/contexts/team-context"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <TeamProvider>
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </TeamProvider>
  )
}
