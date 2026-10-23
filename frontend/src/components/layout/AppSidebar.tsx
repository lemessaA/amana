"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Smartphone,
  Plus,
  AlertTriangle,
  Gavel,
  GitBranch,
  Bell,
  Settings,
  Shield,
  ClipboardList,
  FileText,
  Users,
  X,
} from "lucide-react";

interface AppSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ open = true, onClose }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const isReviewer = user?.role && ["reviewer", "senior_reviewer", "system_administrator"].includes(user.role);

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/devices", label: "My Devices", icon: Smartphone },
    { href: "/devices/register", label: "Register Device", icon: Plus },
    { href: "/reports/new", label: "Report Theft", icon: AlertTriangle },
    { href: "/disputes/new", label: "Disputes", icon: Gavel },
    { href: "/transfers", label: "Transfers", icon: GitBranch },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/account", label: "Account", icon: Settings },
  ];

  const reviewerItems = [
    { href: "/reviewer", label: "Case Management", icon: Shield },
    { href: "/reviewer", label: "Investigations", icon: ClipboardList },
    { href: "/reviewer-disputes", label: "Disputes", icon: Gavel },
    { href: "/reviewer-conflicts", label: "Conflicts", icon: AlertTriangle },
  ];

  const adminItems = [
    { href: "#", label: "User Administration", icon: Users },
    { href: "#", label: "Audit Logs", icon: FileText },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static left-0 top-0 h-screen w-64 bg-sidebar-bg border-r border-border flex flex-col transition-transform duration-300 z-40",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary-accent">
            AMANA
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-elevated-surface rounded-md"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {/* User Navigation */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-secondary uppercase tracking-wider">
              Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-accent text-accent-foreground"
                      : "text-secondary hover:text-foreground hover:bg-elevated-surface"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Reviewer Navigation */}
          {isReviewer && (
            <div className="space-y-1 pt-4 border-t border-border">
              <p className="px-3 text-xs font-semibold text-secondary uppercase tracking-wider">
                Review
              </p>
              {reviewerItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-primary-accent text-accent-foreground"
                        : "text-secondary hover:text-foreground hover:bg-elevated-surface"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Admin Navigation */}
          {user?.role === "admin" && (
            <div className="space-y-1 pt-4 border-t border-border">
              <p className="px-3 text-xs font-semibold text-secondary uppercase tracking-wider">
                Admin
              </p>
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-secondary hover:text-foreground hover:bg-elevated-surface transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border text-xs text-secondary text-center">
          <p>v0.1.0</p>
        </div>
      </aside>
    </>
  );
};
