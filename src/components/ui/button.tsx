import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: cn(
          "bg-black/60 backdrop-blur-glass border border-white/10",
          "text-text-primary shadow-glass",
          "hover:bg-black/70 hover:border-white/20",
          "active:scale-[0.98]"
        ),
        destructive: cn(
          "bg-destructive/90 backdrop-blur-glass",
          "text-destructive-foreground shadow-sm",
          "hover:bg-destructive/100",
          "active:scale-[0.98]"
        ),
        outline: cn(
          "border border-white/20 bg-black/30",
          "backdrop-blur-glass text-text-primary shadow-sm",
          "hover:bg-black/40 hover:border-white/30",
          "active:scale-[0.98]"
        ),
        secondary: cn(
          "bg-white/5 backdrop-blur-glass",
          "text-text-primary shadow-sm",
          "hover:bg-white/10",
          "active:scale-[0.98]"
        ),
        ghost: "hover:bg-white/5 text-text-secondary hover:text-text-primary",
        link: "text-text-primary underline-offset-4 hover:underline",
        glow: cn(
          "bg-black/60 backdrop-blur-glass",
          "border border-white/10",
          "text-text-primary shadow-glow",
          "hover:bg-black/70 hover:border-white/20 hover:shadow-none",
          "active:scale-[0.98]"
        ),
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
