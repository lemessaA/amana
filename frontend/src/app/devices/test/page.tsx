"use client";

import { useState } from "react";
import Link from "next/link";
import { registerDeviceTest, type RegisterDeviceResponse } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormField } from "@/components/form-field";
import { AlertCircle, CheckCircle, Copy, Zap } from "lucide-react";
import { useToast } from "@/components/ErrorToast";
import { ErrorHandler } from "@/lib/errors";

export default function TestRegisterDevicePage() {
  const { user, ready } = useRequireAuth();
  const { addToast } = useToast();
  const [deviceType, setDeviceType] = useState("phone");
  const [identifierType, setIdentifierType] = useState("imei");
  const [identifierValue, setIdentifierValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<RegisterDeviceResponse | null>(null);
  const [count, setCount] = useState(1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    try {
      if (!identifierValue.trim()) {
        throw new Error("Please enter a device identifier");
      }

      const result = await registerDeviceTest({
        device_type: deviceType,
        identifier_type: identifierType,
        identifier_value: identifierValue.trim(),
      });

      setSuccess(result);
      setIdentifierValue("");
      addToast("✓ Test device registered!", "success", 5000);
    } catch (err: any) {
      const errorMessage = ErrorHandler.getUserMessage(err);
      setError(errorMessage);
      addToast(errorMessage, "error");
      console.error("Test device registration error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkRegister() {
    setError("");
    setSuccess(null);
    setLoading(true);

    let registered = 0;
    let failed = 0;

    try {
      for (let i = 0; i < count; i++) {
        try {
          // Generate random identifier
          let identifier = "";
          if (identifierType === "imei") {
            // Generate random 15-digit number
            identifier = String(Math.random()).replace("0.", "").substring(0, 15).padEnd(15, "0");
          } else {
            // Generate random serial
            identifier = `TEST-${Date.now()}-${i}`;
          }

          await registerDeviceTest({
            device_type: deviceType,
            identifier_type: identifierType,
            identifier_value: identifier,
          });

          registered++;
          addToast(`✓ Device ${i + 1}/${count} registered`, "info", 1000);
        } catch (err) {
          failed++;
          console.error(`Failed device ${i + 1}:`, err);
        }
      }

      addToast(
        `Bulk registration complete: ${registered} registered, ${failed} failed`,
        registered > failed ? "success" : "warning",
        5000
      );
      setCount(1);
    } catch (err: any) {
      const errorMessage = ErrorHandler.getUserMessage(err);
      setError(errorMessage);
      addToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }

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
      <div className="max-w-3xl space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-warning" />
            <h1 className="text-3xl font-bold">Test Device Registration</h1>
          </div>
          <p className="mt-1 text-secondary">
            Register test devices with ANY identifier (no validation). Perfect for testing workflows.
          </p>
        </div>

        <Alert className="bg-warning/10 border-warning/30 text-warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Test Mode Active</AlertTitle>
          <AlertDescription>
            This endpoint bypasses IMEI/Serial validation. Use only for development and testing.
            All devices will appear in "My Devices".
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="danger">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-success/10 border-success/30 text-success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>✓ Device Registered (Test Mode)</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">Device ID: <code className="bg-background px-2 py-1 rounded text-xs font-mono">{success.device_id}</code></p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(success.device_id);
                  addToast("Device ID copied", "success", 2000);
                }}
                className="flex items-center gap-1 text-sm hover:underline"
              >
                <Copy className="h-3 w-3" />
                Copy Device ID
              </button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Single Register */}
          <Card>
            <CardHeader>
              <CardTitle>Single Device</CardTitle>
              <CardDescription>Register one test device</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField
                  label="Device Type"
                  as="select"
                  value={deviceType}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeviceType(e.target.value)}
                  disabled={loading}
                  options={[
                    { value: "phone", label: "Phone" },
                    { value: "computer", label: "Computer" },
                  ]}
                  required
                />

                <FormField
                  label="Identifier Type"
                  as="select"
                  value={identifierType}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdentifierType(e.target.value)}
                  disabled={loading}
                  options={[
                    { value: "imei", label: "IMEI" },
                    { value: "serial", label: "Serial" },
                  ]}
                  required
                />

                <FormField
                  label="Identifier Value"
                  type="text"
                  placeholder={identifierType === "imei" ? "Any 15+ digits" : "Any text"}
                  value={identifierValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdentifierValue(e.target.value)}
                  disabled={loading}
                  required
                  hint={identifierType === "imei" ? "IMEI validation is BYPASSED in test mode" : "Any serial number accepted"}
                />

                <Button type="submit" disabled={loading || !identifierValue} isLoading={loading} className="w-full">
                  Register Test Device
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Bulk Register */}
          <Card>
            <CardHeader>
              <CardTitle>Bulk Register</CardTitle>
              <CardDescription>Generate and register multiple devices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Number of Devices</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={count}
                  onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  disabled={loading}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 py-2 text-sm mt-1"
                />
                <p className="text-xs text-secondary mt-1">Max 100 devices per batch</p>
              </div>

              <FormField
                label="Device Type"
                as="select"
                value={deviceType}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeviceType(e.target.value)}
                disabled={loading}
                options={[
                  { value: "phone", label: "Phone" },
                  { value: "computer", label: "Computer" },
                ]}
                required
              />

              <FormField
                label="Identifier Type"
                as="select"
                value={identifierType}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdentifierType(e.target.value)}
                disabled={loading}
                options={[
                  { value: "imei", label: "IMEI (random)" },
                  { value: "serial", label: "Serial (random)" },
                ]}
                required
              />

              <Button
                onClick={handleBulkRegister}
                disabled={loading || count < 1}
                isLoading={loading}
                className="w-full"
              >
                Generate & Register {count} Devices
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Test Data Section */}
        <Card className="bg-blue-950/20 border-blue-700/30">
          <CardHeader>
            <CardTitle className="text-base">Quick Test Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-secondary">Click any to copy:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                "111111111111111",
                "123456789012345",
                "999999999999999",
                "TEST-SERIAL-001",
                "DEVICE-PROD-123",
                "QA-TEST-DEVICE",
              ].map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    navigator.clipboard.writeText(value);
                    addToast("Copied!", "success", 1000);
                  }}
                  className="p-2 bg-background border border-border rounded hover:border-primary-accent transition-colors text-xs font-mono truncate"
                >
                  {value}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How to Use Test Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-secondary">
            <p>
              ✓ Register with ANY identifier (no validation checks)
            </p>
            <p>
              ✓ Create multiple test devices quickly
            </p>
            <p>
              ✓ Devices appear in "My Devices" list
            </p>
            <p>
              ✓ Test reporting, transfers, disputes
            </p>
            <p>
              ✓ Perfect for QA and workflow testing
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Link href="/devices" className="flex-1">
            <Button variant="secondary" className="w-full">
              View My Devices
            </Button>
          </Link>
          <Link href="/devices/register" className="flex-1">
            <Button variant="secondary" className="w-full">
              Production Register
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
