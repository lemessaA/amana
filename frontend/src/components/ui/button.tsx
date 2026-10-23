import React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "destructive" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    const variants: Record<ButtonVariant, string> = {
      primary: "bg-primary-accent text-accent-foreground hover:bg-opacity-90 active:bg-opacity-100",
      secondary: "bg-elevated-surface text-foreground border border-border hover:bg-opacity-75 active:bg-opacity-50",
      danger: "bg-danger text-white hover:bg-opacity-90 active:bg-opacity-100",
      destructive: "bg-danger text-white hover:bg-opacity-90 active:bg-opacity-100",
      ghost: "text-foreground hover:bg-elevated-surface active:bg-opacity-75",
    };

    const sizes: Record<ButtonSize, string> = {
      sm: "px-3 py-1 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? "..." : children}
      </button>
    );
  }
);
Button.displayName = "Button";
