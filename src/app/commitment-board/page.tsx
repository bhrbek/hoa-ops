"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Shield,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MoreHorizontal,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTeam } from "@/contexts/team-context"
import { cn } from "@/lib/utils"
import type { CommitmentStatus } from "@/types/supabase"

// Mock data for commitments
interface MockCommitment {
  id: string
  title: string
  definitionOfDone: string
  project: string
  buildSignal: string
  status: CommitmentStatus
  ownerId: string
  dayIndex: number // 0 = Monday, 4 = Friday
}

interface MockTeamMember {
  id: string
  name: string
  initials: string
  color: string
  capacityPercent: number
}

const mockTeamMembers: MockTeamMember[] = [
  { id: "1", name: "Sarah Jenkins", initials: "SJ", color: "bg-blue-100 text-blue-700", capacityPercent: 85 },
  { id: "2", name: "Mike Rodriguez", initials: "MR", color: "bg-amber-100 text-amber-700", capacityPercent: 72 },
  { id: "3", name: "Alex Thompson", initials: "AT", color: "bg-emerald-100 text-emerald-700", capacityPercent: 95 },
  { id: "4", name: "Jessica Lee", initials: "JL", color: "bg-purple-100 text-purple-700", capacityPercent: 60 },
]

const mockCommitments: MockCommitment[] = [
  {
    id: "c1",
    title: "Complete API spec review",
    definitionOfDone: "All endpoints documented and reviewed by team",
    project: "API Integration",
    buildSignal: "3 partners integrated",
    status: "done",
    ownerId: "1",
    dayIndex: 0,
  },
  {
    id: "c2",
    title: "POC environment setup",
    definitionOfDone: "Cloud env provisioned and accessible",
    project: "Cloud Migration",
    buildSignal: "MVP deployed",
    status: "planned",
    ownerId: "1",
    dayIndex: 2,
  },
  {
    id: "c3",
    title: "Security audit prep",
    definitionOfDone: "Audit checklist completed",
    project: "Security Overhaul",
    buildSignal: "Compliance certified",
    status: "blocked",
    ownerId: "2",
    dayIndex: 1,
  },
  {
    id: "c4",
    title: "Vendor call notes",
    definitionOfDone: "Meeting summary shared with team",
    project: "Network Modernization",
    buildSignal: "Vendor selected",
    status: "done",
    ownerId: "2",
    dayIndex: 0,
  },
  {
    id: "c5",
    title: "Demo script finalization",
    definitionOfDone: "Script reviewed and rehearsed",
    project: "API Integration",
    buildSignal: "3 partners integrated",
    status: "planned",
    ownerId: "3",
    dayIndex: 3,
  },
  {
    id: "c6",
    title: "Training materials draft",
    definitionOfDone: "First draft of training deck",
    project: "Security Overhaul",
    buildSignal: "Team trained",
    status: "slipped",
    ownerId: "4",
    dayIndex: 4,
  },
]

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

function getStatusIcon(status: CommitmentStatus) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
    case "blocked":
      return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
    case "slipped":
      return <Clock className="h-3.5 w-3.5 text-amber-500" />
    default:
      return <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />
  }
}

function getStatusBadge(status: CommitmentStatus) {
  switch (status) {
    case "done":
      return <Badge variant="success">Done</Badge>
    case "blocked":
      return <Badge variant="destructive">Blocked</Badge>
    case "slipped":
      return <Badge variant="warning">Slipped</Badge>
    default:
      return <Badge variant="outline">Planned</Badge>
  }
}

function getWeekString(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  const monday = new Date(date)
  monday.setDate(date.getDate() - date.getDay() + 1) // Get Monday
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4) // Get Friday
  return `${monday.toLocaleDateString("en-US", options)} - ${friday.toLocaleDateString("en-US", options)}`
}

export default function CommitmentBoardPage() {
  const { activeTeam, teamMembers: realTeamMembers, isLoading } = useTeam()
  const [currentWeek, setCurrentWeek] = React.useState(new Date())

  // Use mock data for now, will integrate with real data when Phase 3 is complete
  const displayMembers = mockTeamMembers

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeek(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeek(newDate)
  }

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date())
  }

  const getCommitmentsForCell = (memberId: string, dayIndex: number) => {
    return mockCommitments.filter(
      (c) => c.ownerId === memberId && c.dayIndex === dayIndex
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Commitment Board
            </h1>
            <p className="text-sm text-slate-500">
              Weekly execution tracking
              {activeTeam && (
                <span className="ml-2 text-slate-400">({activeTeam.name})</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Week Navigation */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goToPreviousWeek}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="min-w-[180px]"
                onClick={goToCurrentWeek}
              >
                {getWeekString(currentWeek)}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goToNextWeek}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Flame className="h-4 w-4 text-amber-500" />
              Light Beacon
            </Button>
            <Button variant="primary" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Commitment
            </Button>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Commitment Board Grid */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[900px]">
                {/* Header Row - Days */}
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="w-48 px-4 py-3 text-left bg-slate-50">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Team Member
                      </span>
                    </th>
                    {weekDays.map((day, index) => (
                      <th
                        key={day}
                        className={cn(
                          "px-4 py-3 text-center min-w-[150px]",
                          index === new Date().getDay() - 1 &&
                            "bg-blue-50 border-x border-blue-100"
                        )}
                      >
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {day}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body Rows - Team Members */}
                <tbody>
                  {displayMembers.map((member) => (
                    <tr key={member.id} className="border-b border-slate-100">
                      {/* Member Cell */}
                      <td className="px-4 py-3 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className={cn("h-8 w-8", member.color)}>
                              <AvatarFallback className={member.color}>
                                {member.initials}
                              </AvatarFallback>
                            </Avatar>
                            {member.capacityPercent >= 90 && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                                <Shield className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {member.name}
                            </p>
                            <p
                              className={cn(
                                "text-xs",
                                member.capacityPercent >= 90
                                  ? "text-red-500"
                                  : member.capacityPercent >= 70
                                  ? "text-amber-500"
                                  : "text-slate-500"
                              )}
                            >
                              {member.capacityPercent}% capacity
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Day Cells */}
                      {weekDays.map((day, dayIndex) => {
                        const commitments = getCommitmentsForCell(
                          member.id,
                          dayIndex
                        )
                        const isToday = dayIndex === new Date().getDay() - 1

                        return (
                          <td
                            key={day}
                            className={cn(
                              "px-2 py-2 align-top min-h-[100px]",
                              isToday && "bg-blue-50/50 border-x border-blue-100"
                            )}
                          >
                            <div className="space-y-2">
                              {commitments.map((commitment) => (
                                <div
                                  key={commitment.id}
                                  className={cn(
                                    "p-2 rounded-lg border text-xs transition-colors cursor-pointer hover:shadow-sm",
                                    commitment.status === "done"
                                      ? "bg-emerald-50 border-emerald-200"
                                      : commitment.status === "blocked"
                                      ? "bg-red-50 border-red-200"
                                      : commitment.status === "slipped"
                                      ? "bg-amber-50 border-amber-200"
                                      : "bg-white border-slate-200 hover:border-slate-300"
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="flex items-center gap-1.5">
                                      {getStatusIcon(commitment.status)}
                                      <span
                                        className={cn(
                                          "font-medium",
                                          commitment.status === "done"
                                            ? "text-emerald-700 line-through"
                                            : "text-slate-700"
                                        )}
                                      >
                                        {commitment.title}
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 -mr-1"
                                    >
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <p className="text-slate-500 mt-1 truncate">
                                    {commitment.project}
                                  </p>
                                </div>
                              ))}

                              {/* Empty cell - add commitment button */}
                              {commitments.length === 0 && (
                                <button className="w-full p-3 rounded-lg border border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors">
                                  <Plus className="h-4 w-4 mx-auto" />
                                </button>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border-2 border-slate-300" />
            <span>Planned</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span>Done</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span>Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-amber-500" />
            <span>Slipped</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-blue-500" />
            <span>Shield Up (90%+ capacity)</span>
          </div>
        </div>

        {/* Rules Reminder */}
        <div className="mt-6 p-4 bg-slate-100 rounded-lg text-center text-xs text-slate-500">
          <p>
            <strong>Commitment Rules:</strong> Each commitment must link to a{" "}
            <span className="font-semibold">Project</span> and a{" "}
            <span className="font-semibold">Build Signal</span>. Commitments
            never link to Engagements.
          </p>
        </div>
      </div>
    </div>
  )
}
