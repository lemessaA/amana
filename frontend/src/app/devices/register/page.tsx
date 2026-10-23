"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerDevice, type RegisterDeviceResponse } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormField } from "@/components/form-field";
import { AlertCircle, CheckCircle, Copy } from "lucide-react";
import { useToast } from "@/components/ErrorToast";
import { ErrorHandler } from "@/lib/errors";

export default function RegisterDevicePage() {
  const router = useRouter();
  const { user, ready } = useRequireAuth();
  const { addToast } = useToast();
  const [deviceType, setDeviceType] = useState("phone");
  const [identifierType, setIdentifierType] = useState("imei");
  const [identifierValue, setIdentifierValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<RegisterDeviceResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    try {
      if (!identifierValue.trim()) {
        throw new Error("Please enter a device identifier");
      }

      const result = await registerDevice({
        device_type: deviceType,
        identifier_type: identifierType,
        identifier_value: identifierValue.trim(),
      });
      
      setSuccess(result);
      setIdentifierValue("");
      addToast("Device registered successfully!", "success", 5000);
    } catch (err: any) {
      const errorMessage = ErrorHandler.getUserMessage(err);
      setError(errorMessage);
      addToast(errorMessage, "error");
      console.error("Device registration error:", err);
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
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Register Device</h1>
          <p className="mt-1 text-secondary">
            Register your phone or computer to establish a claim and create a record in AMANA.
          </p>
        </div>

        {success && (
          <Alert className="bg-success/10 border-success/30 text-success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Device Registered Successfully</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">Device ID: <code className="bg-background px-2 py-1 rounded text-xs font-mono">{success.device_id}</code></p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(success.device_id);
                  addToast("Device ID copied to clipboard", "success", 2000);
                }}
                className="flex items-center gap-1 text-sm hover:underline"
              >
                <Copy className="h-3 w-3" />
                Copy Device ID
              </button>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
            <CardDescription>
              Provide the identifier for the device you're registering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="danger">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

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
                  { value: "imei", label: "IMEI (15 digits for phones)" },
                  { value: "serial", label: "Serial Number" },
                ]}
                required
              />

              <FormField
                label={
                  identifierType === "imei"
                    ? "IMEI Number"
                    : "Serial Number"
                }
                type="text"
                placeholder={
                  identifierType === "imei"
                    ? "e.g., 490154203237518"
                    : "e.g., ABC123456789"
                }
                value={identifierValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdentifierValue(e.target.value.trim())}
                disabled={loading}
                required
                hint={
                  identifierType === "imei"
                    ? "Enter the 15-digit IMEI. Dial *#06# on your phone to find it."
                    : "Check the device's settings or back panel."
                }
              />

              <div className="bg-blue-950/20 border border-blue-700/30 rounded p-3 text-sm text-secondary">
                <p>
                  ℹ️ This registration establishes your claim in AMANA. You can submit evidence or update information later.
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading || !identifierValue} isLoading={loading}>
                  {loading ? "Registering..." : "Register Device"}
                </Button>
                <Link href="/dashboard">
                  <Button variant="secondary">Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>How to Find Your Device Identifier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">📱 For Phones (IMEI)</h4>
              <ul className="list-disc list-inside text-secondary space-y-1">
                <li>Dial <code className="bg-card px-2 py-1 rounded text-xs font-mono">*#06#</code> to display your IMEI</li>
                <li>Must be 15 digits</li>
                <li>Format: 490154203237518</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">💻 For Computers (Serial)</h4>
              <ul className="list-disc list-inside text-secondary space-y-1">
                <li>Check Settings → System Information</li>
                <li>Look for a label on the device or back panel</li>
                <li>Format: ABC123456789</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
