import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const actionButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-feedback action-button-ripple",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 dark:from-orange-600 dark:to-orange-500 dark:hover:from-orange-500 dark:hover:to-orange-400 dark:active:from-orange-700 dark:active:to-orange-600 shadow-sm",
        danger: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 dark:from-red-600 dark:to-red-500 dark:hover:from-red-500 dark:hover:to-red-600 dark:active:from-red-700 dark:active:to-red-600 shadow-sm",
        success: "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 dark:from-green-600 dark:to-green-500 dark:hover:from-green-500 dark:hover:to-green-400 dark:active:from-green-700 dark:active:to-green-600 shadow-sm",
        outline: "border-2 border-orange-300 bg-white text-orange-700 hover:bg-orange-50 hover:text-orange-800 hover:border-orange-400 active:bg-orange-100 dark:bg-slate-900 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950 dark:hover:text-orange-300 dark:hover:border-orange-600 dark:active:bg-orange-900/30",
        ghost: "bg-transparent text-orange-700 hover:bg-orange-100 hover:text-orange-800 active:bg-orange-200 dark:text-orange-400 dark:hover:bg-orange-900 dark:hover:text-orange-300 dark:active:bg-orange-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 py-2 text-xs",
        lg: "h-11 rounded-md px-6 py-2.5 text-base",
        icon: "h-10 w-10 rounded-md p-0",
        "icon-sm": "h-8 w-8 rounded-md p-0",
      },
      fullWidth: {
        true: "w-full",
      },
      standard: {
        true: "btn-standard",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
      standard: false,
    },
  }
)

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof actionButtonVariants> {
  asChild?: boolean
  fullWidth?: boolean
  standard?: boolean
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, variant, size, fullWidth, standard, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // 如果启用了标准按钮样式，自动添加適當的按鈕大小類
    let sizeClass = "";
    if (standard) {
      if (size === "lg") sizeClass = "btn-lg";
      else if (size === "sm") sizeClass = "btn-sm";
      else sizeClass = "btn-md";
    }
    
    return (
      <Comp
        className={cn(
          actionButtonVariants({ variant, size, fullWidth, standard, className }),
          sizeClass
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
ActionButton.displayName = "ActionButton"

export { ActionButton, actionButtonVariants } 