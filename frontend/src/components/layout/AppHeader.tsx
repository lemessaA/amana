"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Settings, Menu } from "lucide-react";
import { useState } from "react";

interface AppHeaderProps {
  onMenuClick?: () => void;
  title?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <header className="border-b border-border bg-elevated-surface sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-card rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          {title && (
            <h1 className="text-lg font-semibold text-foreground hidden sm:block">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/notifications" className="p-2 hover:bg-card rounded-md transition-colors relative">
            <Bell className="h-5 w-5 text-secondary" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-warning rounded-full"></span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 hover:bg-card rounded-md transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-accent flex items-center justify-center">
                <span className="text-accent-foreground text-sm font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden sm:inline text-sm text-secondary">{user?.email}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                <Link
                  href="/account"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-elevated-surface transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Account Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger hover:bg-opacity-10 transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
