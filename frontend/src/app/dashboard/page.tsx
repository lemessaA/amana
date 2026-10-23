"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getNotifications } from "@/lib/api";
import { AlertCircle, CheckCircle, FileText, Clock, Smartphone, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const notifications = await getNotifications();
        setNotificationCount(notifications.length);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-accent from-0% to-secondary-accent to-100% bg-opacity-10 rounded-lg p-6 border border-primary-accent border-opacity-20">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.email?.split("@")[0] || "User"}
          </h1>
          <p className="text-secondary mt-2">
            Manage your devices, review case status, and maintain secure device records.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Registered Devices"
            value="—"
            icon={Smartphone}
            description="Device list API not available"
            variant="default"
          />
          <StatCard
            title="Pending Actions"
            value={notificationCount}
            icon={Clock}
            description="Notifications requiring attention"
            variant="warning"
            onClick={() => window.location.href = "/notifications"}
          />
          <StatCard
            title="Active Cases"
            value="—"
            icon={FileText}
            description="Disputes and reports"
            variant="default"
          />
          <StatCard
            title="Account Status"
            value={user?.account_status || "Active"}
            icon={CheckCircle}
            description={`Role: ${user?.role || "User"}`}
            variant={user?.account_status === "active" ? "success" : "warning"}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/devices/register" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  + Register Device
                </Button>
              </Link>
              <Link href="/reports/new" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  📋 Report Suspected Theft
                </Button>
              </Link>
              <Link href="/claim-dispute" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  ⚖️ Submit Dispute Claim
                </Button>
              </Link>
              <Link href="/transfers" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  → Initiate Transfer
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Getting Started Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Getting Started
              </CardTitle>
              <CardDescription>First time here?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-foreground">1. Register a Device</p>
                <p className="text-secondary">Start by creating a claim for your device with its IMEI or serial number.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">2. Report Issues</p>
                <p className="text-secondary">If you suspect theft or have conflicting claims, submit a report for review.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">3. Transfer Safely</p>
                <p className="text-secondary">Complete secure transfers after all disputes are resolved.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Banner */}
        <div className="bg-elevated-surface border border-border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Important Information
          </h3>
          <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
            <li>Device listing from your account is not yet available. You can view registered devices when accessing transfers or dispute details.</li>
            <li>All cases and disputes are reviewed by authorized staff within the specified deadline.</li>
            <li>Transfers require all restrictions and disputes to be resolved before completion.</li>
            <li>You can request reconsideration of any decision within the appeal period.</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
