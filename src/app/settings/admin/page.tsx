"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, X, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTeam } from "@/contexts/team-context"
import {
  getDomains,
  getOEMs,
  createDomain,
  updateDomain,
  deleteDomain,
  createOEM,
  updateOEM,
  deleteOEM,
} from "@/app/actions/reference"
import type { Domain, OEM } from "@/types/supabase"

const DOMAIN_COLORS = [
  { value: "default", label: "Gray" },
  { value: "primary", label: "Blue" },
  { value: "cloud", label: "Sky" },
  { value: "security", label: "Red" },
  { value: "network", label: "Purple" },
  { value: "infra", label: "Orange" },
  { value: "warning", label: "Yellow" },
]

export default function AdminSettingsPage() {
  const { isOrgAdmin, isLoading: isLoadingTeam } = useTeam()

  const [domains, setDomains] = React.useState<Domain[]>([])
  const [oems, setOems] = React.useState<OEM[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Domain editing state
  const [editingDomainId, setEditingDomainId] = React.useState<string | null>(null)
  const [editingDomainName, setEditingDomainName] = React.useState("")
  const [editingDomainColor, setEditingDomainColor] = React.useState("default")
  const [newDomainName, setNewDomainName] = React.useState("")
  const [newDomainColor, setNewDomainColor] = React.useState("default")
  const [isAddingDomain, setIsAddingDomain] = React.useState(false)

  // OEM editing state
  const [editingOemId, setEditingOemId] = React.useState<string | null>(null)
  const [editingOemName, setEditingOemName] = React.useState("")
  const [newOemName, setNewOemName] = React.useState("")
  const [isAddingOem, setIsAddingOem] = React.useState(false)

  const [isSaving, setIsSaving] = React.useState(false)

  // Load data
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [domainsData, oemsData] = await Promise.all([
          getDomains(),
          getOEMs(),
        ])
        setDomains(domainsData)
        setOems(oemsData)
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Domain handlers
  const handleAddDomain = async () => {
    if (!newDomainName.trim()) return
    setIsSaving(true)
    try {
      const domain = await createDomain({ name: newDomainName, color: newDomainColor })
      setDomains([...domains, domain].sort((a, b) => a.name.localeCompare(b.name)))
      setNewDomainName("")
      setNewDomainColor("default")
      setIsAddingDomain(false)
    } catch (error) {
      console.error("Failed to add domain:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateDomain = async (domainId: string) => {
    if (!editingDomainName.trim()) return
    setIsSaving(true)
    try {
      const updated = await updateDomain(domainId, {
        name: editingDomainName,
        color: editingDomainColor
      })
      setDomains(domains.map(d => d.id === domainId ? updated : d))
      setEditingDomainId(null)
    } catch (error) {
      console.error("Failed to update domain:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm("Delete this domain? This cannot be undone.")) return
    setIsSaving(true)
    try {
      await deleteDomain(domainId)
      setDomains(domains.filter(d => d.id !== domainId))
    } catch (error) {
      console.error("Failed to delete domain:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const startEditingDomain = (domain: Domain) => {
    setEditingDomainId(domain.id)
    setEditingDomainName(domain.name)
    setEditingDomainColor(domain.color || "default")
  }

  // OEM handlers
  const handleAddOem = async () => {
    if (!newOemName.trim()) return
    setIsSaving(true)
    try {
      const oem = await createOEM({ name: newOemName })
      setOems([...oems, oem].sort((a, b) => a.name.localeCompare(b.name)))
      setNewOemName("")
      setIsAddingOem(false)
    } catch (error) {
      console.error("Failed to add OEM:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateOem = async (oemId: string) => {
    if (!editingOemName.trim()) return
    setIsSaving(true)
    try {
      const updated = await updateOEM(oemId, { name: editingOemName })
      setOems(oems.map(o => o.id === oemId ? updated : o))
      setEditingOemId(null)
    } catch (error) {
      console.error("Failed to update OEM:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteOem = async (oemId: string) => {
    if (!confirm("Delete this OEM? This cannot be undone.")) return
    setIsSaving(true)
    try {
      await deleteOEM(oemId)
      setOems(oems.filter(o => o.id !== oemId))
    } catch (error) {
      console.error("Failed to delete OEM:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const startEditingOem = (oem: OEM) => {
    setEditingOemId(oem.id)
    setEditingOemName(oem.name)
  }

  if (isLoadingTeam || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!isOrgAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-500">You must be an organization admin to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Settings</h1>
        <p className="text-sm text-slate-500">Manage domains, OEMs, and system configuration</p>
      </header>

      <div className="p-8 max-w-4xl mx-auto space-y-8">
        {/* Domains */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Domains</CardTitle>
                <CardDescription>Technology domains used to categorize engagements</CardDescription>
              </div>
              {!isAddingDomain && (
                <Button variant="outline" size="sm" onClick={() => setIsAddingDomain(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Domain
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Add new domain form */}
              {isAddingDomain && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Input
                    placeholder="Domain name..."
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Select value={newDomainColor} onValueChange={setNewDomainColor}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAIN_COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          {color.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddDomain} disabled={isSaving || !newDomainName.trim()}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingDomain(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Domain list */}
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  {editingDomainId === domain.id ? (
                    <>
                      <Input
                        value={editingDomainName}
                        onChange={(e) => setEditingDomainName(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Select value={editingDomainColor} onValueChange={setEditingDomainColor}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOMAIN_COLORS.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              {color.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => handleUpdateDomain(domain.id)} disabled={isSaving}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingDomainId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge variant={domain.color as "default" | "cloud" | "security" | "network" | "infra" | "warning" | "primary"}>
                        {domain.name}
                      </Badge>
                      <span className="flex-1" />
                      <Button size="sm" variant="ghost" onClick={() => startEditingDomain(domain)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteDomain(domain.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}

              {domains.length === 0 && !isAddingDomain && (
                <p className="text-sm text-slate-500 text-center py-4">No domains configured</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* OEMs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>OEMs / Vendors</CardTitle>
                <CardDescription>Technology vendors and partners tracked in engagements</CardDescription>
              </div>
              {!isAddingOem && (
                <Button variant="outline" size="sm" onClick={() => setIsAddingOem(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add OEM
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Add new OEM form */}
              {isAddingOem && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Input
                    placeholder="OEM name..."
                    value={newOemName}
                    onChange={(e) => setNewOemName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleAddOem} disabled={isSaving || !newOemName.trim()}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingOem(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* OEM list */}
              <div className="grid grid-cols-2 gap-2">
                {oems.map((oem) => (
                  <div
                    key={oem.id}
                    className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    {editingOemId === oem.id ? (
                      <>
                        <Input
                          value={editingOemName}
                          onChange={(e) => setEditingOemName(e.target.value)}
                          className="flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleUpdateOem(oem.id)} disabled={isSaving}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingOemId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-slate-700">{oem.name}</span>
                        <Button size="sm" variant="ghost" onClick={() => startEditingOem(oem)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteOem(oem.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {oems.length === 0 && !isAddingOem && (
                <p className="text-sm text-slate-500 text-center py-4">No OEMs configured</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Types (read-only for now) */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Types</CardTitle>
            <CardDescription>Types of customer engagements (currently system-defined)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["Workshop", "Demo", "POC", "Advisory"].map((type) => (
                <Badge key={type} variant="outline" className="text-sm">
                  {type}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Activity types are system-defined. Contact support to add new types.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
