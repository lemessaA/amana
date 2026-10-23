"use client";
import { useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/auth";
import { initiateTransfer } from "@/lib/api";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormField } from "@/components/form-field";
import { AlertCircle, CheckCircle, Send } from "lucide-react";

export default function TransfersPage() {
  const { user, ready } = useRequireAuth();
  const [deviceId, setDeviceId] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ transferId: string; expiresAt: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    try {
      const result = await initiateTransfer({
        device_id: deviceId,
        recipient_email: recipientEmail,
      });
      setSuccess({
        transferId: result.transfer_id,
        expiresAt: result.expires_at,
      });
      setDeviceId("");
      setRecipientEmail("");
    } catch (err: any) {
      setError(err.data?.detail || err.message || "Transfer initiation failed");
    } finally {
      setLoading(false);
    }
  }

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
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Device Transfers</h1>
          <p className="mt-1 text-secondary">
            Transfer device ownership through AMANA's approved workflow
          </p>
        </div>

        {success && (
          <Alert className="bg-success/10 border-success/30 text-success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Transfer Initiated</AlertTitle>
            <AlertDescription>
              Transfer ID: <code className="bg-background px-2 py-1 rounded text-xs font-mono">{success.transferId}</code>
              <br />
              The recipient will need to accept this transfer. It expires at {new Date(success.expiresAt).toLocaleString()}.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Initiate Transfer</CardTitle>
            <CardDescription>
              Send a device to another user through AMANA
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
                label="Device ID"
                type="text"
                placeholder="Paste the device ID to transfer"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value.trim())}
                disabled={loading || !!success}
                required
                hint="You must be the current owner of the device"
              />

              <FormField
                label="Recipient Email"
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value.trim())}
                disabled={loading || !!success}
                required
              />

              <div className="bg-blue-950/20 border border-blue-700/30 rounded p-3 text-sm text-secondary">
                <p>
                  ℹ️ The recipient will receive a notification to accept or decline the transfer. Transfers expire after 7 days if not accepted.
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading || !deviceId || !recipientEmail || !!success}>
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? "Initiating..." : "Initiate Transfer"}
                </Button>
                <Link href="/dashboard">
                  <Button variant="secondary">Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-1">1. Eligibility Check</p>
              <p className="text-secondary">The device must not have active restrictions or disputes.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">2. Recipient Notification</p>
              <p className="text-secondary">The recipient receives a notification and has 7 days to accept or decline.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">3. Acceptance</p>
              <p className="text-secondary">Once accepted, ownership transfers and a new claim is created for the recipient.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">4. Completion</p>
              <p className="text-secondary">Your association is released and the transfer is recorded in the audit trail.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
