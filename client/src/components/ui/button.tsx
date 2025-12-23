import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-bold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-accent text-foreground hover:bg-accent/80 hover:shadow-xl hover:scale-105 active:scale-95 focus-visible:ring-accent",
        orange: "bg-primary text-white hover:bg-primary/80 hover:shadow-xl hover:scale-105 active:scale-95 focus-visible:ring-primary",
        destructive: "bg-primary text-white hover:bg-primary/80 hover:shadow-xl hover:scale-105 active:scale-95 focus-visible:ring-primary",
        outline: "border-2 border-primary bg-transparent text-foreground hover:bg-primary/10 hover:border-primary hover:shadow-md hover:scale-105 active:scale-95 focus-visible:ring-primary transition-all",
        secondary: "bg-secondary text-white hover:bg-secondary/80 hover:shadow-xl hover:scale-105 active:scale-95 focus-visible:ring-secondary",
        ghost: "hover:bg-accent/15 text-foreground hover:shadow-md active:scale-95 hover:scale-105",
        link: "text-foreground underline-offset-4 hover:underline hover:opacity-80 hover:scale-105 active:scale-95",
        dark: "bg-primary text-white hover:bg-primary/80 hover:shadow-xl hover:scale-105 active:scale-95 focus-visible:ring-primary",
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
