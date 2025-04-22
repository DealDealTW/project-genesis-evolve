import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus-visible:ring-orange-500",
  {
    variants: {
      variant: {
        default: "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 dark:bg-orange-600 dark:text-white dark:hover:bg-orange-500 dark:active:bg-orange-700 shadow-sm",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700 dark:active:bg-red-800 shadow-sm",
        outline:
          "border-2 border-orange-300 bg-transparent text-orange-700 hover:bg-orange-50 hover:text-orange-800 hover:border-orange-400 active:bg-orange-100 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950 dark:hover:text-orange-300 dark:hover:border-orange-600 dark:active:bg-orange-900/30",
        secondary:
          "bg-orange-100 text-orange-800 hover:bg-orange-200 hover:text-orange-900 active:bg-orange-300 dark:bg-orange-800 dark:text-orange-200 dark:hover:bg-orange-700 dark:hover:text-orange-100 dark:active:bg-orange-600 shadow-sm",
        ghost: "text-orange-700 hover:bg-orange-100 hover:text-orange-800 active:bg-orange-200 dark:text-orange-400 dark:hover:bg-orange-900 dark:hover:text-orange-300 dark:active:bg-orange-800",
        link: "text-orange-600 underline-offset-4 hover:underline dark:text-orange-400 dark:hover:text-orange-300 p-0 h-auto",
        success: "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 dark:bg-orange-600 dark:text-white dark:hover:bg-orange-500 dark:active:bg-orange-700 shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 py-2 text-xs",
        lg: "h-11 rounded-md px-8 py-2.5 text-base",
        icon: "h-10 w-10 rounded-md",
        "icon-sm": "h-8 w-8 rounded-md p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
