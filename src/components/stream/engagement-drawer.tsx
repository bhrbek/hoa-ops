"use client"

import * as React from "react"
import { X, Search, DollarSign, Link2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface EngagementDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const activityTypes = [
  { value: "workshop", label: "Workshop" },
  { value: "demo", label: "Demo" },
  { value: "poc", label: "POC" },
  { value: "advisory", label: "Advisory" },
]

const domains = [
  { id: "1", name: "Cloud", color: "primary" },
  { id: "2", name: "Security", color: "security" },
  { id: "3", name: "Network", color: "network" },
  { id: "4", name: "Wi-Fi 7", color: "cloud" },
  { id: "5", name: "SD-WAN", color: "infra" },
]

const oems = [
  { id: "1", name: "Cisco" },
  { id: "2", name: "Arista" },
  { id: "3", name: "Palo Alto" },
  { id: "4", name: "AWS" },
  { id: "5", name: "Azure" },
  { id: "6", name: "Fortinet" },
  { id: "7", name: "Juniper" },
]

const activeRocks = [
  { id: "1", title: "Q1 Enterprise Cloud Migration" },
  { id: "2", title: "Network Modernization Initiative" },
  { id: "3", title: "Security Operations Overhaul" },
]

export function EngagementDrawer({ open, onOpenChange }: EngagementDrawerProps) {
  const [selectedDomains, setSelectedDomains] = React.useState<string[]>(["Cloud"])
  const [selectedOems, setSelectedOems] = React.useState<string[]>(["AWS"])
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [activityType, setActivityType] = React.useState("workshop")
  const [linkedRock, setLinkedRock] = React.useState<string>("")
  const [revenue, setRevenue] = React.useState("")
  const [gp, setGp] = React.useState("")
  const [notes, setNotes] = React.useState("")

  const toggleDomain = (domain: string) => {
    setSelectedDomains(prev =>
      prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    )
  }

  const toggleOem = (oem: string) => {
    setSelectedOems(prev =>
      prev.includes(oem)
        ? prev.filter(o => o !== oem)
        : [...prev, oem]
    )
  }

  const handleSave = (andLogAnother: boolean) => {
    // TODO: Save engagement to database
    console.log({
      customer: customerSearch,
      activityType,
      domains: selectedDomains,
      oems: selectedOems,
      revenue: parseFloat(revenue) || 0,
      gp: parseFloat(gp) || 0,
      linkedRock,
      notes,
    })

    if (andLogAnother) {
      // Reset form
      setCustomerSearch("")
      setActivityType("workshop")
      setSelectedDomains([])
      setSelectedOems([])
      setRevenue("")
      setGp("")
      setLinkedRock("")
      setNotes("")
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Log New Engagement</SheetTitle>
          <SheetDescription>
            Capture field intelligence from your customer interaction.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* Context Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Context</h3>

            {/* Customer Search */}
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="customer"
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Activity Type */}
            <div className="space-y-2">
              <Label htmlFor="activity-type">Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger id="activity-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tech Stack Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tech Stack</h3>

            {/* Domains */}
            <div className="space-y-2">
              <Label>Domains</Label>
              <div className="flex flex-wrap gap-2">
                {domains.map((domain) => (
                  <button
                    key={domain.id}
                    onClick={() => toggleDomain(domain.name)}
                    className="focus:outline-none"
                  >
                    <Badge
                      variant={selectedDomains.includes(domain.name) ? "primary" : "outline"}
                      className={`cursor-pointer transition-all ${
                        selectedDomains.includes(domain.name)
                          ? "ring-2 ring-blue-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {domain.name}
                      {selectedDomains.includes(domain.name) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500">Select technology domains discussed</p>
            </div>

            {/* OEMs */}
            <div className="space-y-2">
              <Label>OEMs</Label>
              <div className="flex flex-wrap gap-2">
                {oems.map((oem) => (
                  <button
                    key={oem.id}
                    onClick={() => toggleOem(oem.name)}
                    className="focus:outline-none"
                  >
                    <Badge
                      variant={selectedOems.includes(oem.name) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        selectedOems.includes(oem.name)
                          ? "ring-2 ring-slate-300"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {oem.name}
                      {selectedOems.includes(oem.name) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500">Select vendors/OEMs involved</p>
            </div>
          </div>

          {/* Financials Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Financials</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="revenue">Revenue Impact</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="revenue"
                    type="number"
                    placeholder="0.00"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gp">Gross Profit</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="gp"
                    type="number"
                    placeholder="0.00"
                    value={gp}
                    onChange={(e) => setGp(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* The Bridge Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              The Bridge
            </h3>

            <div className="space-y-2">
              <Label htmlFor="linked-rock">Link to Rock (Evidence)</Label>
              <Select value={linkedRock} onValueChange={setLinkedRock}>
                <SelectTrigger id="linked-rock">
                  <SelectValue placeholder="Select a rock to link..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No link</SelectItem>
                  {activeRocks.map((rock) => (
                    <SelectItem key={rock.id} value={rock.id}>
                      {rock.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Connect this engagement as evidence for a strategic rock
              </p>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="notes">Engagement Notes</Label>
            <Textarea
              id="notes"
              placeholder="Key takeaways, action items, and next steps..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => handleSave(true)}>
            Save & Log Another
          </Button>
          <Button variant="primary" onClick={() => handleSave(false)}>
            Save & Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
