import React from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "default" | "danger" | "warning" | "success";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variantStyles: Record<AlertVariant, string> = {
  default: "bg-elevated-surface border-border text-foreground",
  danger: "bg-danger bg-opacity-10 border-danger text-danger",
  warning: "bg-warning bg-opacity-10 border-warning text-warning",
  success: "bg-success bg-opacity-10 border-success text-success",
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border p-4 flex gap-3", variantStyles[variant], className)}
      {...props}
    />
  )
);
Alert.displayName = "Alert";

export const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("text-sm", className)} {...props} />
);
AlertDescription.displayName = "AlertDescription";

export const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
);
AlertTitle.displayName = "AlertTitle";
