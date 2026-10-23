"use client";
import { useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/auth";
import { submitTheftReport, type TheftReportResponse } from "@/lib/api";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormField } from "@/components/form-field";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function ReportTheftPage() {
  const { user, ready } = useRequireAuth();
  const [identifier, setIdentifier] = useState("");
  const [category, setCategory] = useState("theft");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<TheftReportResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    try {
      const result = await submitTheftReport({
        identifier_value: identifier,
        allegation_category: category,
        description,
      });
      setSuccess(result);
      setIdentifier("");
      setDescription("");
    } catch (err: any) {
      setError(err.data?.detail || err.message || "Report submission failed");
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
          <h1 className="text-3xl font-bold">Report Theft or Issue</h1>
          <p className="mt-1 text-secondary">
            Submit a report if you suspect a device is stolen or have concerns about a device.
          </p>
        </div>

        {success && (
          <Alert className="bg-success/10 border-success/30 text-success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Report Submitted</AlertTitle>
            <AlertDescription>
              Case ID: <code className="bg-background px-2 py-1 rounded text-xs font-mono">{success.case_id}</code>
              <br />
              Status: <span className="font-medium capitalize">{success.status}</span>
              <br />
              Your report has been submitted for review. You'll receive notifications about updates.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Theft Report Details</CardTitle>
            <CardDescription>
              Provide information about the device and the issue you're reporting
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)}
                disabled={loading || !!success}
                required
              />

              <FormField
                label="Report Category"
                as="select"
                value={category}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCategory(e.target.value)}
                disabled={loading || !!success}
                options={[
                  { value: "theft", label: "Suspected Theft" },
                  { value: "lost", label: "Device Lost" },
                  { value: "suspicious", label: "Suspicious Activity" },
                  { value: "damage", label: "Damage/Defect Report" },
                ]}
                required
              />

              <FormField
                label="Description"
                as="textarea"
                placeholder="Provide details about the issue..."
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                disabled={loading || !!success}
                required
              />

              <div className="bg-blue-950/20 border border-blue-700/30 rounded p-3 text-sm text-secondary">
                <p>
                  ℹ️ Reports are screened and investigated by authorized AMANA reviewers. Provide as much detail as possible.
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading || !identifier || !description || !!success}>
                  {loading ? "Submitting..." : "Submit Report"}
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
