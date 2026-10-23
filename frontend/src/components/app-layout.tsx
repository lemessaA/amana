"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { logout, getNotifications, type Notification } from "@/lib/api";
import { Button } from "./ui/button";
import { Menu, X, Bell, LogOut, Settings, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AppLayout({ children, requireAuth = true }: AppLayoutProps) {
  const router = useRouter();
  const { user, ready } = useRequireAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  React.useEffect(() => {
    if (ready && user) {
      getNotifications()
        .then((n) => setNotificationCount(n.length))
        .catch(() => {});
    }
  }, [ready, user]);

  if (requireAuth && !ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary-accent" />
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isReviewer = user?.role === "reviewer" || user?.role === "senior_reviewer";
  const isAdmin = user?.role === "admin";

  const navItems = [
    { label: "Dashboard", href: "/dashboard", public: false },
    { label: "Device Lookup", href: "/lookup", public: true },
    { label: "My Devices", href: "/devices", public: false },
    { label: "Register Device", href: "/devices/register", public: false },
    { label: "Report Theft", href: "/reports/new", public: false },
    { label: "Disputes", href: "/disputes/new", public: false },
    { label: "Transfers", href: "/transfers", public: false },
    { label: "Notifications", href: "/notifications", public: false },
    ...(isReviewer
      ? [
          { label: "Review Cases", href: "/admin/investigations", public: false },
          { label: "Disputes Queue", href: "/admin/disputes", public: false },
          { label: "Conflicts Queue", href: "/admin/conflicts", public: false },
          { label: "Evidence Review", href: "/admin/evidence", public: false },
        ]
      : []),
  ];

  return (
    <div className="flex h-screen flex-col bg-background text-foreground md:flex-row">
      {/* Mobile Menu Button */}
      <div className="flex items-center justify-between border-b border-border bg-elevated-surface px-4 py-3 md:hidden">
        <Link href="/" className="font-bold text-primary-accent">
          AMANA
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded p-2 hover:bg-card"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <nav
        className={cn(
          "fixed inset-0 top-[58px] z-40 w-64 border-r border-border bg-sidebar-bg md:relative md:top-auto md:w-64 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="space-y-1 p-4">
          <Link href="/" className="mb-4 hidden font-bold text-primary-accent md:block">
            AMANA
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm hover:bg-elevated-surface"
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="hidden border-b border-border bg-elevated-surface px-6 py-4 md:flex md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">AMANA</h1>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/notifications" className="relative rounded-full p-2 hover:bg-card">
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs font-bold text-foreground">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Link>

            <details className="relative">
              <summary className="list-none cursor-pointer rounded-full p-2 hover:bg-card">
                <UserIcon size={20} />
              </summary>
              <div className="absolute right-0 top-full mt-2 w-40 rounded-lg border border-border bg-card shadow-lg">
                <div className="border-b border-border px-4 py-2 text-sm">
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-xs text-secondary capitalize">{user?.role}</p>
                </div>
                <Link
                  href="/account"
                  className="flex items-center gap-2 border-b border-border px-4 py-2 text-sm hover:bg-elevated-surface"
                >
                  <Settings size={16} />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-danger hover:bg-elevated-surface"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </details>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 top-[58px] z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
