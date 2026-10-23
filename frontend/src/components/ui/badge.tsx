import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      default: "border border-border bg-background text-foreground",
      green: "bg-success/20 text-success border border-success/30",
      amber: "bg-warning/20 text-warning border border-warning/30",
      red: "bg-danger/20 text-danger border border-danger/30",
      blue: "bg-primary-accent/20 text-primary-accent border border-primary-accent/30",
      gray: "bg-secondary/20 text-secondary border border-secondary/30",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
