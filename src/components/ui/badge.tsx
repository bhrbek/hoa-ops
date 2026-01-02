import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-slate-100 text-slate-700 ring-slate-200",
        primary:
          "bg-blue-50 text-blue-700 ring-blue-200",
        success:
          "bg-emerald-50 text-emerald-700 ring-emerald-200",
        warning:
          "bg-amber-50 text-amber-700 ring-amber-200",
        destructive:
          "bg-red-50 text-red-700 ring-red-200",
        outline:
          "bg-transparent text-slate-700 ring-slate-300",
        // Domain-specific badges
        cloud:
          "bg-sky-50 text-sky-700 ring-sky-200",
        security:
          "bg-purple-50 text-purple-700 ring-purple-200",
        infra:
          "bg-orange-50 text-orange-700 ring-orange-200",
        network:
          "bg-indigo-50 text-indigo-700 ring-indigo-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
