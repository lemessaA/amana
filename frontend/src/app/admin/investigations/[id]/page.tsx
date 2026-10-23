"use client";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/auth";
import { getInvestigation, triageInvestigation, type Investigation } from "@/lib/api";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormField } from "@/components/form-field";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function InvestigationDetailPage({ params }: { params: { id: string } }) {
  const { user, ready } = useRequireAuth();
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!ready || !user || !["reviewer", "senior_reviewer"].includes(user.role)) return;

    getInvestigation(params.id)
      .then(setInvestigation)
      .catch((err) => setError(err.message || "Failed to load investigation"))
      .finally(() => setLoading(false));
  }, [ready, user, params.id]);

  async function handleTriage(e: React.FormEvent) {
    e.preventDefault();
    if (!investigation) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await triageInvestigation(investigation.case_id, {
        outcome,
        reason,
      });
      setSuccess("Investigation triaged successfully");
      setOutcome("");
      setReason("");
      // Refresh investigation
      const updated = await getInvestigation(investigation.case_id);
      setInvestigation(updated);
    } catch (err: any) {
      setError(err.data?.detail || err.message || "Triage failed");
    } finally {
      setSubmitting(false);
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

  if (user?.role !== "reviewer" && user?.role !== "senior_reviewer") {
    return (
      <AppLayout>
        <Alert variant="danger">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>Only reviewers can access this page.</AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary-accent" />
        </div>
      </AppLayout>
    );
  }

  if (!investigation) {
    return (
      <AppLayout>
        <Alert variant="danger">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Investigation not found.</AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Investigation Details</h1>
          <p className="mt-1 text-secondary font-mono">{investigation.case_id}</p>
        </div>

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
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Case Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Case Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-secondary">Status</p>
                <p className="font-medium capitalize">{investigation.status}</p>
              </div>
              <div>
                <p className="text-secondary">Device ID</p>
                <p className="font-mono text-xs">{investigation.device_id}</p>
              </div>
              <div>
                <p className="text-secondary">Opened</p>
                <p className="font-medium">{formatDateTime(investigation.opened_at)}</p>
              </div>
              <div>
                <p className="text-secondary">Deadline</p>
                <p className="font-medium">{formatDateTime(investigation.deadline_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Triage Form */}
        {investigation.status !== "closed" && (
          <Card>
            <CardHeader>
              <CardTitle>Triage Decision</CardTitle>
              <CardDescription>
                Make a decision on this investigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTriage} className="space-y-4">
                <FormField
                  label="Outcome"
                  as="select"
                  value={outcome}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOutcome(e.target.value)}
                  disabled={submitting}
                  options={[
                    { value: "", label: "Select an outcome..." },
                    { value: "approved", label: "Approved - Device Claim Valid" },
                    { value: "rejected", label: "Rejected - Claim Invalid" },
                    { value: "inconclusive", label: "Inconclusive - Needs Further Review" },
                  ]}
                  required
                />

                <FormField
                  label="Reason"
                  as="textarea"
                  placeholder="Explain your decision..."
                  value={reason}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
                  disabled={submitting}
                  required
                />

                <Button type="submit" disabled={submitting || !outcome || !reason}>
                  {submitting ? "Submitting..." : "Submit Decision"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
