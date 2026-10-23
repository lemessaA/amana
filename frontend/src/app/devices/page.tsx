"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyDevices, type MyDevice } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus, Smartphone, Trash2, Copy } from "lucide-react";
import { useToast } from "@/components/ErrorToast";
import { ErrorHandler } from "@/lib/errors";

export default function MyDevicesPage() {
  const { user, ready } = useRequireAuth();
  const { addToast } = useToast();
  const [devices, setDevices] = useState<MyDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !user) return;

    async function loadDevices() {
      try {
        setError("");
        const response = await getMyDevices();
        setDevices(response.devices || []);
      } catch (err: any) {
        const message = ErrorHandler.getUserMessage(err);
        setError(message);
        addToast(message, "error");
        console.error("Failed to load devices:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDevices();
  }, [ready, user, addToast]);

  if (!ready || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="space-y-4 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary-accent" />
            <p className="text-secondary">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Devices</h1>
            <p className="mt-1 text-secondary">
              Devices you have registered or claimed in AMANA
            </p>
          </div>
          <Link href="/devices/register">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Register New Device
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="danger">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="space-y-4 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary-accent" />
              <p className="text-secondary">Loading your devices...</p>
            </div>
          </div>
        ) : devices.length === 0 ? (
          <Card className="bg-card/50">
            <CardContent className="py-12 text-center">
              <Smartphone className="h-12 w-12 mx-auto text-secondary mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Devices Yet</h3>
              <p className="text-secondary mb-6">
                You haven't registered any devices yet. Register your first device to get started.
              </p>
              <Link href="/devices/register">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Register Your First Device
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {devices.map((device) => (
              <DeviceCard key={device.device_id} device={device} onRefresh={() => window.location.reload()} />
            ))}
          </div>
        )}

        {devices.length > 0 && (
          <Card className="bg-blue-950/20 border-blue-700/30">
            <CardHeader>
              <CardTitle className="text-base">Total Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary-accent">{devices.length}</p>
              <p className="text-sm text-secondary mt-1">Active devices registered</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

function DeviceCard({ device, onRefresh }: { device: MyDevice; onRefresh: () => void }) {
  const { addToast } = useToast();

  const handleCopyId = () => {
    navigator.clipboard.writeText(device.device_id);
    addToast("Device ID copied to clipboard", "success", 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary-accent" />
              {device.device_type === "phone" ? "📱 Mobile Device" : "💻 Computer"}
            </CardTitle>
            <CardDescription className="mt-2">
              Registered on {new Date(device.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              device.association_status === "active"
                ? "bg-success/10 text-success border border-success/30"
                : "bg-secondary/10 text-secondary border border-secondary/30"
            }`}
          >
            {device.association_status === "active" ? "✓ Active" : "Inactive"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {device.identifier && (
          <div className="bg-background/50 rounded p-3 space-y-2">
            <div>
              <p className="text-xs text-secondary uppercase tracking-wide">
                {device.identifier.identifier_type === "imei" ? "IMEI" : "Serial Number"}
              </p>
              <p className="font-mono text-sm font-medium">{device.identifier.identifier_value}</p>
            </div>
            <button
              onClick={handleCopyId}
              className="text-xs text-primary-accent hover:underline flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              Copy Device ID
            </button>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-secondary">Device ID</p>
          <code className="block bg-background px-3 py-2 rounded text-xs break-all font-mono">
            {device.device_id}
          </code>
        </div>

        <div className="flex gap-2 pt-2">
          <Link href={`/reports/new?device=${device.device_id}`} className="flex-1">
            <Button variant="secondary" size="sm" className="w-full">
              Report Issue
            </Button>
          </Link>
          <Link href={`/transfers?device=${device.device_id}`} className="flex-1">
            <Button variant="secondary" size="sm" className="w-full">
              Transfer
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
