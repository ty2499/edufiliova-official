import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-success text-black hover:bg-success/90 focus-visible:ring-success",
        orange: "bg-accent text-white hover:bg-accent/90 focus-visible:ring-accent",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary/10",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        ghost: "hover:bg-success/10 text-success",
        link: "text-primary underline-offset-4 hover:underline",
        dark: "bg-gray-900 text-white hover:bg-gray-800",
      },
      size: {
        default: "h-11 px-4 sm:px-6 py-2.5 text-sm",
        sm: "h-9 px-3 sm:px-4 py-2 text-xs",
        lg: "h-13 px-6 sm:px-8 py-3 text-base",
        icon: "h-11 w-11",
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
