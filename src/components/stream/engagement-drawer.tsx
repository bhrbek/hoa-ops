"use client"

import * as React from "react"
import { X, Search, DollarSign, Link2, User, Clock } from "lucide-react"
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
import { AssetSelector } from "@/components/stream/asset-selector"
import { useTeam } from "@/contexts/team-context"
import type { Domain, OEM, Rock, Asset, Engagement } from "@/types/supabase"

interface EngagementDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  engagement?: Engagement & {
    owner?: { full_name: string } | null
    last_editor?: { full_name: string } | null
  }
  onSave?: (data: EngagementFormData) => Promise<void>
}

interface EngagementFormData {
  customer_name: string
  date: string
  activity_type: "Workshop" | "Demo" | "POC" | "Advisory"
  revenue_impact: number
  gp_impact: number
  notes: string
  rock_id: string | null
  domain_ids: string[]
  oem_ids: string[]
  asset_ids: string[]
}

const activityTypes = [
  { value: "Workshop", label: "Workshop" },
  { value: "Demo", label: "Demo" },
  { value: "POC", label: "POC" },
  { value: "Advisory", label: "Advisory" },
] as const

export function EngagementDrawer({
  open,
  onOpenChange,
  engagement,
  onSave,
}: EngagementDrawerProps) {
  const { activeTeam } = useTeam()

  // Form state
  const [customerSearch, setCustomerSearch] = React.useState(engagement?.customer_name || "")
  const [activityType, setActivityType] = React.useState<string>(engagement?.activity_type || "Workshop")
  const [date, setDate] = React.useState(
    engagement?.date || new Date().toISOString().split("T")[0]
  )
  const [selectedDomains, setSelectedDomains] = React.useState<string[]>([])
  const [selectedOems, setSelectedOems] = React.useState<string[]>([])
  const [selectedAssets, setSelectedAssets] = React.useState<string[]>([])
  const [linkedRock, setLinkedRock] = React.useState<string>(engagement?.rock_id || "")
  const [revenue, setRevenue] = React.useState(engagement?.revenue_impact?.toString() || "")
  const [gp, setGp] = React.useState(engagement?.gp_impact?.toString() || "")
  const [notes, setNotes] = React.useState(engagement?.notes || "")
  const [isSaving, setIsSaving] = React.useState(false)

  // Data from server
  const [domains, setDomains] = React.useState<Domain[]>([])
  const [oems, setOems] = React.useState<OEM[]>([])
  const [rocks, setRocks] = React.useState<Rock[]>([])
  const [assets, setAssets] = React.useState<Asset[]>([])
  const [isLoadingData, setIsLoadingData] = React.useState(true)

  // Load reference data when drawer opens
  React.useEffect(() => {
    if (open && activeTeam) {
      loadReferenceData()
    }
  }, [open, activeTeam?.id])

  async function loadReferenceData() {
    setIsLoadingData(true)
    try {
      const [
        { getDomains, getOEMs },
        { getActiveRocks },
        { getAssets },
      ] = await Promise.all([
        import("@/app/actions/reference"),
        import("@/app/actions/rocks"),
        import("@/app/actions/assets"),
      ])

      const [domainsData, oemsData, rocksData, assetsData] = await Promise.all([
        getDomains(),
        getOEMs(),
        activeTeam ? getActiveRocks(activeTeam.id) : Promise.resolve([]),
        activeTeam ? getAssets(activeTeam.id) : Promise.resolve([]),
      ])

      setDomains(domainsData)
      setOems(oemsData)
      setRocks(rocksData)
      setAssets(assetsData)
    } catch (error) {
      console.error("Failed to load reference data:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Reset form when engagement changes
  React.useEffect(() => {
    if (engagement) {
      setCustomerSearch(engagement.customer_name)
      setActivityType(engagement.activity_type)
      setDate(engagement.date)
      setLinkedRock(engagement.rock_id || "")
      setRevenue(engagement.revenue_impact?.toString() || "")
      setGp(engagement.gp_impact?.toString() || "")
      setNotes(engagement.notes || "")
    } else {
      resetForm()
    }
  }, [engagement])

  function resetForm() {
    setCustomerSearch("")
    setActivityType("Workshop")
    setDate(new Date().toISOString().split("T")[0])
    setSelectedDomains([])
    setSelectedOems([])
    setSelectedAssets([])
    setLinkedRock("")
    setRevenue("")
    setGp("")
    setNotes("")
  }

  const toggleDomain = (domainId: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domainId)
        ? prev.filter((d) => d !== domainId)
        : [...prev, domainId]
    )
  }

  const toggleOem = (oemId: string) => {
    setSelectedOems((prev) =>
      prev.includes(oemId) ? prev.filter((o) => o !== oemId) : [...prev, oemId]
    )
  }

  const handleSave = async (andLogAnother: boolean) => {
    if (!customerSearch.trim()) return

    setIsSaving(true)

    const formData: EngagementFormData = {
      customer_name: customerSearch,
      date,
      activity_type: activityType as "Workshop" | "Demo" | "POC" | "Advisory",
      revenue_impact: parseFloat(revenue) || 0,
      gp_impact: parseFloat(gp) || 0,
      notes,
      rock_id: linkedRock || null,
      domain_ids: selectedDomains,
      oem_ids: selectedOems,
      asset_ids: selectedAssets,
    }

    try {
      if (onSave) {
        await onSave(formData)
      }

      if (andLogAnother) {
        resetForm()
      } else {
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Failed to save engagement:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const isEditing = !!engagement

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Engagement" : "Log New Engagement"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the details of this customer interaction."
              : "Capture field intelligence from your customer interaction."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* Creator/Editor Info (for existing engagements) */}
          {isEditing && engagement && (
            <div className="flex items-center gap-4 text-xs text-slate-500 pb-4 border-b border-slate-100">
              {engagement.owner && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  <span>Created by {engagement.owner.full_name}</span>
                </div>
              )}
              {engagement.last_editor && engagement.last_edited_at && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>Edited by {engagement.last_editor.full_name}</span>
                </div>
              )}
            </div>
          )}

          {/* Context Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Context
            </h3>

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
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tech Stack
            </h3>

            {/* Domains */}
            <div className="space-y-2">
              <Label>Domains</Label>
              {isLoadingData ? (
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-6 w-16 bg-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {domains.map((domain) => (
                    <button
                      key={domain.id}
                      type="button"
                      onClick={() => toggleDomain(domain.id)}
                      className="focus:outline-none"
                    >
                      <Badge
                        variant={selectedDomains.includes(domain.id) ? "primary" : "outline"}
                        className={`cursor-pointer transition-all ${
                          selectedDomains.includes(domain.id)
                            ? "ring-2 ring-blue-200"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {domain.name}
                        {selectedDomains.includes(domain.id) && (
                          <X className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-500">Select technology domains discussed</p>
            </div>

            {/* OEMs */}
            <div className="space-y-2">
              <Label>OEMs</Label>
              {isLoadingData ? (
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-6 w-14 bg-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {oems.map((oem) => (
                    <button
                      key={oem.id}
                      type="button"
                      onClick={() => toggleOem(oem.id)}
                      className="focus:outline-none"
                    >
                      <Badge
                        variant={selectedOems.includes(oem.id) ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          selectedOems.includes(oem.id)
                            ? "ring-2 ring-slate-300"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {oem.name}
                        {selectedOems.includes(oem.id) && <X className="h-3 w-3 ml-1" />}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-500">Select vendors/OEMs involved</p>
            </div>
          </div>

          {/* Assets Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assets Used
            </h3>
            <AssetSelector
              assets={assets}
              selectedAssetIds={selectedAssets}
              onSelectionChange={setSelectedAssets}
              isLoading={isLoadingData}
            />
          </div>

          {/* Financials Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Financials
            </h3>

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
              <Select
                value={linkedRock || "none"}
                onValueChange={(val) => setLinkedRock(val === "none" ? "" : val)}
              >
                <SelectTrigger id="linked-rock">
                  <SelectValue placeholder="Select a rock to link..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No link</SelectItem>
                  {rocks.map((rock) => (
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
          {!isEditing && (
            <Button
              variant="outline"
              onClick={() => handleSave(true)}
              disabled={isSaving || !customerSearch.trim()}
            >
              Save & Log Another
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => handleSave(false)}
            disabled={isSaving || !customerSearch.trim()}
          >
            {isSaving ? "Saving..." : isEditing ? "Update" : "Save & Close"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
