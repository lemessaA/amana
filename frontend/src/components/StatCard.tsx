import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
  onClick?: () => void;
}

const variantColors: Record<string, { bg: string; icon: string }> = {
  default: { bg: "bg-primary-accent", icon: "text-primary-accent" },
  success: { bg: "bg-success", icon: "text-success" },
  warning: { bg: "bg-warning", icon: "text-warning" },
  danger: { bg: "bg-danger", icon: "text-danger" },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
  onClick,
}) => {
  const colors = variantColors[variant] || variantColors.default;

  return (
    <Card className={onClick ? "cursor-pointer hover:border-primary-accent transition-colors" : ""} onClick={onClick}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-secondary">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
            {description && <p className="text-xs text-secondary mt-2">{description}</p>}
          </div>
          {Icon && (
            <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center bg-opacity-10", colors.bg)}>
              <Icon className={cn("h-6 w-6", colors.icon)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
