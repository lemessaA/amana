"use client";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/auth";
import { getNotifications, type Notification } from "@/lib/api";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const { user, ready } = useRequireAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !user) return;

    getNotifications()
      .then(setNotifications)
      .catch((err) => setError(err.message || "Failed to load notifications"))
      .finally(() => setLoading(false));
  }, [ready, user]);

  if (!ready) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary-accent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-secondary">
            {notifications.length} {notifications.length === 1 ? "notification" : "notifications"}
          </p>
        </div>

        {error && (
          <Card className="border-danger/30 bg-danger/10">
            <CardContent className="pt-6 text-danger text-sm">
              Error loading notifications: {error}
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-card rounded border border-border animate-pulse" />
            ))}
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Bell className="h-12 w-12 mx-auto text-secondary/50 mb-3" />
              <p className="text-secondary">No notifications yet</p>
            </CardContent>
          </Card>
        )}

        {!loading && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notif, index) => (
              <Card key={`${notif.notification_id}-${index}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{notif.type}</h3>
                        <Badge variant={notif.delivery_status === "delivered" ? "green" : "amber"}>
                          {notif.channel}
                        </Badge>
                      </div>
                      {notif.subject && (
                        <p className="text-sm font-medium mb-1">{notif.subject}</p>
                      )}
                      {notif.body && (
                        <p className="text-sm text-secondary">{notif.body}</p>
                      )}
                      <p className="text-xs text-secondary/70 mt-2">
                        {formatDateTime(notif.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
