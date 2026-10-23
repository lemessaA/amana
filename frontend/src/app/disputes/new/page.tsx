"use client";
import { useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/auth";
import { submitClaimDispute, type ClaimDisputeResponse } from "@/lib/api";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormField } from "@/components/form-field";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function DisputePage() {
  const { user, ready } = useRequireAuth();
  const [identifier, setIdentifier] = useState("");
  const [basis, setBasis] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<ClaimDisputeResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    try {
      const result = await submitClaimDispute({
        identifier_value: identifier,
        acquisition_basis: basis,
        description,
      });
      setSuccess(result);
      setIdentifier("");
      setDescription("");
    } catch (err: any) {
      setError(err.data?.detail || err.message || "Dispute submission failed");
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
          <h1 className="text-3xl font-bold">Claim Dispute</h1>
          <p className="mt-1 text-secondary">
            Submit a dispute if you believe you have a competing or superior claim to a device
          </p>
        </div>

        {success && (
          <Alert className="bg-success/10 border-success/30 text-success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Dispute Submitted</AlertTitle>
            <AlertDescription>
              Case ID: <code className="bg-background px-2 py-1 rounded text-xs font-mono">{success.case_id}</code>
              <br />
              Deadline for review: {new Date(success.deadline_at).toLocaleDateString()}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Submit a Claim Dispute</CardTitle>
            <CardDescription>
              Dispute another user's claim on a device
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
                label="Device Identifier"
                type="text"
                placeholder="IMEI or serial number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading || !!success}
                required
              />

              <FormField
                label="Your Acquisition Basis"
                as="select"
                value={basis}
                onChange={(e) => setBasis(e.target.value)}
                disabled={loading || !!success}
                options={[
                  { value: "personal_purchase", label: "Personal Purchase" },
                  { value: "gift", label: "Gift" },
                  { value: "inherited", label: "Inherited" },
                  { value: "other", label: "Other" },
                ]}
                required
              />

              <FormField
                label="Reason for Dispute"
                as="textarea"
                placeholder="Explain why you believe you have a claim to this device..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading || !!success}
                required
              />

              <div className="bg-blue-950/20 border border-blue-700/30 rounded p-3 text-sm text-secondary">
                <p>
                  ℹ️ A reviewer will assess competing claims based on evidence and will communicate the outcome.
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading || !identifier || !basis || !description || !!success}>
                  {loading ? "Submitting..." : "Submit Dispute"}
                </Button>
                <Link href="/dashboard">
                  <Button variant="secondary">Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
