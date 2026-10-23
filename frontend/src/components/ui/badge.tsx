import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "red" | "amber" | "blue" | "gray" | "default";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-success bg-opacity-10 text-success border border-success border-opacity-20",
  red: "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20",
  amber: "bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20",
  blue: "bg-secondary-accent bg-opacity-10 text-secondary-accent border border-secondary-accent border-opacity-20",
  gray: "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-20",
  default: "bg-primary-accent bg-opacity-10 text-primary-accent border border-primary-accent border-opacity-20",
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";
