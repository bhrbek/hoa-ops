"use client"

import * as React from "react"
import { X, Search, FileText, Video, Presentation, File, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Asset } from "@/types/supabase"

interface AssetSelectorProps {
  assets: Asset[]
  selectedAssetIds: string[]
  onSelectionChange: (assetIds: string[]) => void
  isLoading?: boolean
  className?: string
}

function getAssetIcon(assetType: string) {
  switch (assetType.toLowerCase()) {
    case "deck":
    case "presentation":
      return Presentation
    case "video":
      return Video
    case "whitepaper":
    case "document":
      return FileText
    default:
      return File
  }
}

function getAssetTypeColor(assetType: string) {
  switch (assetType.toLowerCase()) {
    case "deck":
    case "presentation":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "video":
      return "bg-purple-50 text-purple-700 border-purple-200"
    case "demo":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "whitepaper":
    case "document":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    default:
      return "bg-slate-50 text-slate-700 border-slate-200"
  }
}

export function AssetSelector({
  assets,
  selectedAssetIds,
  onSelectionChange,
  isLoading = false,
  className,
}: AssetSelectorProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)

  const selectedAssets = assets.filter((a) => selectedAssetIds.includes(a.id))
  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.asset_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleAsset = (assetId: string) => {
    if (selectedAssetIds.includes(assetId)) {
      onSelectionChange(selectedAssetIds.filter((id) => id !== assetId))
    } else {
      onSelectionChange([...selectedAssetIds, assetId])
    }
  }

  const removeAsset = (assetId: string) => {
    onSelectionChange(selectedAssetIds.filter((id) => id !== assetId))
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label>Assets Used</Label>
        <div className="animate-pulse h-10 rounded-md bg-slate-100" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Assets Used</Label>

      {/* Selected Assets Display */}
      {selectedAssets.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedAssets.map((asset) => {
            const Icon = getAssetIcon(asset.asset_type)
            return (
              <Badge
                key={asset.id}
                variant="outline"
                className={cn(
                  "gap-1.5 pr-1",
                  getAssetTypeColor(asset.asset_type)
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="max-w-[120px] truncate">{asset.name}</span>
                <button
                  type="button"
                  onClick={() => removeAsset(asset.id)}
                  className="ml-1 p-0.5 rounded hover:bg-black/10 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}

      {/* Asset Selector Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-dashed"
          >
            <Plus className="h-4 w-4" />
            {selectedAssets.length === 0
              ? "Select assets..."
              : `Add more assets`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          {/* Search */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Asset List */}
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredAssets.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                {searchQuery ? "No assets found" : "No assets available"}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredAssets.map((asset) => {
                  const Icon = getAssetIcon(asset.asset_type)
                  const isSelected = selectedAssetIds.includes(asset.id)
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => toggleAsset(asset.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
                        isSelected
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-slate-50 border border-transparent"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded",
                          getAssetTypeColor(asset.asset_type)
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {asset.name}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                          {asset.asset_type}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500 text-center">
              {selectedAssetIds.length} asset{selectedAssetIds.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        </PopoverContent>
      </Popover>

      <p className="text-xs text-slate-500">
        Track which materials were used in this engagement
      </p>
    </div>
  )
}
