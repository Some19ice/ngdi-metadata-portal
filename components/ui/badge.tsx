import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover border-transparent shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover border-transparent",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover border-transparent shadow-sm",
        success:
          "bg-success text-success-foreground hover:bg-success-dark border-transparent shadow-sm",
        warning:
          "bg-warning text-warning-foreground hover:bg-warning-dark border-transparent shadow-sm",
        info: "bg-info text-info-foreground hover:bg-info-dark border-transparent shadow-sm",
        outline:
          "text-foreground border-border hover:bg-accent hover:text-accent-foreground",
        "outline-primary": "text-primary border-primary hover:bg-primary-light",
        "outline-success": "text-success border-success hover:bg-success-light",
        "outline-warning": "text-warning border-warning hover:bg-warning-light",
        "outline-destructive":
          "text-destructive border-destructive hover:bg-destructive-light",
        "outline-info": "text-info border-info hover:bg-info-light"
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
