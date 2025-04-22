"use strict"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-50 hover:bg-orange-300 dark:hover:bg-orange-700",
        secondary:
          "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-50 hover:bg-orange-200 dark:hover:bg-orange-600",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 dark:bg-red-600 dark:text-white dark:hover:bg-red-700",
        outline: "text-foreground dark:text-slate-200",
        success: 
          "border-transparent bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-50 hover:bg-orange-300 dark:hover:bg-orange-700",
        warning: 
          "border-transparent bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-50 hover:bg-orange-300 dark:hover:bg-orange-700",
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
