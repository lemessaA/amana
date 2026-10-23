"use client";
import { useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/auth";
import { submitIdentifierConflict, type IdentifierConflictResponse } from "@/lib/api";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormField } from "@/components/form-field";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function IdentifierConflictPage() {
  const { user, ready } = useRequireAuth();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<IdentifierConflictResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    try {
      const result = await submitIdentifierConflict({
        identifier_value: identifier,
      });
      setSuccess(result);
      setIdentifier("");
    } catch (err: any) {
      setError(err.data?.detail || err.message || "Conflict submission failed");
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
          <h1 className="text-3xl font-bold">Report Identifier Conflict</h1>
          <p className="mt-1 text-secondary">
            Report if you're trying to register an identifier that already exists in AMANA
          </p>
        </div>

        {success && (
          <Alert className="bg-success/10 border-success/30 text-success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Conflict Reported</AlertTitle>
            <AlertDescription>
              Case ID: <code className="bg-background px-2 py-1 rounded text-xs font-mono">{success.case_id}</code>
              <br />
              Deadline for review: {new Date(success.deadline_at).toLocaleDateString()}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Identifier Conflict Details</CardTitle>
            <CardDescription>
              The system detected an identifier already in use. Report this conflict for review.
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
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIdentifier(e.target.value.trim())}
                disabled={loading || !!success}
                required
              />

              <div className="bg-blue-950/20 border border-blue-700/30 rounded p-3 text-sm text-secondary">
                <p>
                  ℹ️ AMANA reviewers will investigate whether this is a duplicate record, a data entry error, or a legitimate additional identifier for the same device.
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading || !identifier || !!success}>
                  {loading ? "Reporting..." : "Report Conflict"}
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
