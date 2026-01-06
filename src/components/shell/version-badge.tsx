"use client"

import { useState } from "react"

const VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev"

export function VersionBadge() {
  const [copied, setCopied] = useState(false)

  const handleClick = () => {
    navigator.clipboard.writeText(VERSION)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-4 right-4 z-50 px-2.5 py-1 text-[10px] font-mono text-slate-400 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm hover:text-slate-600 hover:border-slate-300 transition-all"
      title="Click to copy version"
    >
      {copied ? "Copied!" : VERSION}
    </button>
  )
}
