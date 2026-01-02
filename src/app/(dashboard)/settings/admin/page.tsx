'use client'

import { useState, useEffect, useCallback } from 'react'
import { useJar } from '@/contexts/jar-context'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import {
  Settings,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Layers,
  Building2,
  AlertTriangle
} from 'lucide-react'

interface Domain {
  id: string
  name: string
  color: string | null
  active: boolean
}

interface OEM {
  id: string
  name: string
  logo_url: string | null
  active: boolean
}

export default function AdminSettingsPage() {
  const { user, loading: contextLoading } = useJar()
  const supabase = createClient()

  const [domains, setDomains] = useState<Domain[]>([])
  const [oems, setOems] = useState<OEM[]>([])
  const [loading, setLoading] = useState(true)

  // Domain form state
  const [domainDialogOpen, setDomainDialogOpen] = useState(false)
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null)
  const [domainName, setDomainName] = useState('')
  const [domainColor, setDomainColor] = useState('#3b82f6')
  const [domainActive, setDomainActive] = useState(true)
  const [savingDomain, setSavingDomain] = useState(false)

  // OEM form state
  const [oemDialogOpen, setOemDialogOpen] = useState(false)
  const [editingOem, setEditingOem] = useState<OEM | null>(null)
  const [oemName, setOemName] = useState('')
  const [oemLogoUrl, setOemLogoUrl] = useState('')
  const [oemActive, setOemActive] = useState(true)
  const [savingOem, setSavingOem] = useState(false)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'domain' | 'oem'; item: Domain | OEM } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)

    const [domainsRes, oemsRes] = await Promise.all([
      supabase.from('domains').select('*').order('name'),
      supabase.from('oems').select('*').order('name'),
    ])

    setDomains((domainsRes.data || []) as Domain[])
    setOems((oemsRes.data || []) as OEM[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Check if user is admin
  const isAdmin = user?.role === 'admin'

  // Domain handlers
  const openDomainDialog = (domain?: Domain) => {
    if (domain) {
      setEditingDomain(domain)
      setDomainName(domain.name)
      setDomainColor(domain.color || '#3b82f6')
      setDomainActive(domain.active)
    } else {
      setEditingDomain(null)
      setDomainName('')
      setDomainColor('#3b82f6')
      setDomainActive(true)
    }
    setDomainDialogOpen(true)
  }

  const saveDomain = async () => {
    if (!domainName.trim()) return

    setSavingDomain(true)

    if (editingDomain) {
      await supabase
        .from('domains')
        .update({ name: domainName, color: domainColor, active: domainActive } as never)
        .eq('id', editingDomain.id)
    } else {
      await supabase
        .from('domains')
        .insert({ name: domainName, color: domainColor, active: domainActive } as never)
    }

    setSavingDomain(false)
    setDomainDialogOpen(false)
    fetchData()
  }

  // OEM handlers
  const openOemDialog = (oem?: OEM) => {
    if (oem) {
      setEditingOem(oem)
      setOemName(oem.name)
      setOemLogoUrl(oem.logo_url || '')
      setOemActive(oem.active)
    } else {
      setEditingOem(null)
      setOemName('')
      setOemLogoUrl('')
      setOemActive(true)
    }
    setOemDialogOpen(true)
  }

  const saveOem = async () => {
    if (!oemName.trim()) return

    setSavingOem(true)

    if (editingOem) {
      await supabase
        .from('oems')
        .update({ name: oemName, logo_url: oemLogoUrl || null, active: oemActive } as never)
        .eq('id', editingOem.id)
    } else {
      await supabase
        .from('oems')
        .insert({ name: oemName, logo_url: oemLogoUrl || null, active: oemActive } as never)
    }

    setSavingOem(false)
    setOemDialogOpen(false)
    fetchData()
  }

  // Delete handler
  const confirmDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)

    if (deleteTarget.type === 'domain') {
      await supabase.from('domains').delete().eq('id', deleteTarget.item.id)
    } else {
      await supabase.from('oems').delete().eq('id', deleteTarget.item.id)
    }

    setDeleting(false)
    setDeleteDialogOpen(false)
    setDeleteTarget(null)
    fetchData()
  }

  const openDeleteDialog = (type: 'domain' | 'oem', item: Domain | OEM) => {
    setDeleteTarget({ type, item })
    setDeleteDialogOpen(true)
  }

  if (contextLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need admin privileges to access this page. Contact your administrator to request access.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span>Settings</span>
              <span>/</span>
              <span className="text-foreground font-medium">Admin</span>
            </div>
            <h1 className="text-2xl font-mono font-bold flex items-center gap-3">
              <Settings className="h-6 w-6" />
              Admin Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage system configuration and lookup tables
            </p>
          </div>
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            <Shield className="mr-1 h-3 w-3" />
            Admin Only
          </Badge>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Domains Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Layers className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>Domains</CardTitle>
                    <CardDescription>
                      Technology domains for categorizing engagements
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={() => openDomainDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Domain
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain) => (
                    <TableRow key={domain.id}>
                      <TableCell className="font-medium">{domain.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded"
                            style={{ backgroundColor: domain.color || '#6b7280' }}
                          />
                          <span className="text-sm text-muted-foreground font-mono">
                            {domain.color || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={domain.active ? 'default' : 'secondary'}>
                          {domain.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDomainDialog(domain)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog('domain', domain)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {domains.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No domains configured. Add your first domain to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* OEMs Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Building2 className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle>OEMs / Vendors</CardTitle>
                    <CardDescription>
                      Technology vendors and manufacturers
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={() => openOemDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add OEM
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Logo URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {oems.map((oem) => (
                    <TableRow key={oem.id}>
                      <TableCell className="font-medium">{oem.name}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                          {oem.logo_url || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={oem.active ? 'default' : 'secondary'}>
                          {oem.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openOemDialog(oem)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog('oem', oem)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {oems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No OEMs configured. Add your first vendor to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Domain Dialog */}
      <Dialog open={domainDialogOpen} onOpenChange={setDomainDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDomain ? 'Edit Domain' : 'Add New Domain'}
            </DialogTitle>
            <DialogDescription>
              {editingDomain
                ? 'Update the domain details below.'
                : 'Enter the details for the new domain.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain-name">Name</Label>
              <Input
                id="domain-name"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                placeholder="e.g., Wi-Fi, Security, Cloud"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain-color">Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="domain-color"
                  value={domainColor}
                  onChange={(e) => setDomainColor(e.target.value)}
                  className="h-10 w-14 rounded border border-input cursor-pointer"
                />
                <Input
                  value={domainColor}
                  onChange={(e) => setDomainColor(e.target.value)}
                  className="font-mono"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="domain-active">Active</Label>
              <Switch
                id="domain-active"
                checked={domainActive}
                onCheckedChange={setDomainActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDomainDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDomain} disabled={savingDomain || !domainName.trim()}>
              {savingDomain && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingDomain ? 'Save Changes' : 'Add Domain'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OEM Dialog */}
      <Dialog open={oemDialogOpen} onOpenChange={setOemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOem ? 'Edit OEM' : 'Add New OEM'}
            </DialogTitle>
            <DialogDescription>
              {editingOem
                ? 'Update the vendor details below.'
                : 'Enter the details for the new vendor.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="oem-name">Name</Label>
              <Input
                id="oem-name"
                value={oemName}
                onChange={(e) => setOemName(e.target.value)}
                placeholder="e.g., Cisco, Aruba, Juniper"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oem-logo">Logo URL (optional)</Label>
              <Input
                id="oem-logo"
                value={oemLogoUrl}
                onChange={(e) => setOemLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="oem-active">Active</Label>
              <Switch
                id="oem-active"
                checked={oemActive}
                onCheckedChange={setOemActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveOem} disabled={savingOem || !oemName.trim()}>
              {savingOem && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingOem ? 'Save Changes' : 'Add OEM'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>{deleteTarget?.item.name}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
