"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/auth";
import { getMe, getNotifications, type User, type Notification } from "@/lib/api";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Bell, Package } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { user, ready } = useRequireAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    if (ready && user) {
      getNotifications()
        .then(setNotifications)
        .catch(() => setNotifications([]))
        .finally(() => setLoadingNotifications(false));
    }
  }, [ready, user]);

  if (!ready || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary-accent" />
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Registered Devices", value: "—", icon: Package },
    { label: "Active Claims", value: "—", icon: AlertCircle },
    { label: "Notifications", value: notifications.length.toString(), icon: Bell },
    { label: "Pending Actions", value: "—", icon: Plus },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-secondary">
            Welcome back, <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-secondary uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className="text-primary-accent/50">
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/devices/register" className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" />
                    Register Device
                  </Button>
                </Link>
                <Link href="/reports/new" className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    Report Theft
                  </Button>
                </Link>
                <Link href="/transfers" className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    Transfer Device
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Notifications</CardTitle>
              <CardDescription>
                {notifications.length} {notifications.length === 1 ? "notification" : "notifications"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingNotifications ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-card rounded animate-pulse" />
                  ))}
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-auto">
                  {notifications.slice(0, 5).map((notif) => (
                    <div key={notif.notification_id} className="text-sm p-2 rounded bg-elevated-surface border border-border">
                      <p className="font-medium">{notif.type}</p>
                      <p className="text-xs text-secondary">{notif.body || "No additional details"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-secondary">No notifications yet.</p>
              )}
              <Link href="/notifications" className="block mt-4">
                <Button variant="outline" className="w-full">
                  View All
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Role-specific Info */}
        {(user.role === "reviewer" || user.role === "senior_reviewer") && (
          <Card className="border-primary-accent/30 bg-primary-accent/10">
            <CardHeader>
              <CardTitle className="text-lg">Reviewer Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/investigations">
                <Button variant="secondary" className="w-full justify-start">
                  View Investigation Queue
                </Button>
              </Link>
              <Link href="/admin/disputes">
                <Button variant="secondary" className="w-full justify-start">
                  View Disputes Queue
                </Button>
              </Link>
              <Link href="/admin/conflicts">
                <Button variant="secondary" className="w-full justify-start">
                  View Conflicts Queue
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="font-bold text-primary-accent">1.</span>
                <span>
                  <strong>Register your device</strong> with an IMEI or serial number to establish a claim.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary-accent">2.</span>
                <span>
                  <strong>Check device status</strong> anytime by looking up an identifier.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary-accent">3.</span>
                <span>
                  <strong>Report issues</strong> if you suspect theft or have conflicting claims.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary-accent">4.</span>
                <span>
                  <strong>Complete transfers</strong> safely through the AMANA platform.
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
