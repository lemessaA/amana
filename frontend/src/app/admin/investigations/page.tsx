"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/auth";
import { getInvestigationQueue, type Investigation } from "@/lib/api";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export default function InvestigationQueuePage() {
  const { user, ready } = useRequireAuth();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !user || !["reviewer", "senior_reviewer"].includes(user.role)) return;

    getInvestigationQueue()
      .then(setInvestigations)
      .catch((err) => setError(err.message || "Failed to load cases"))
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

  if (user?.role !== "reviewer" && user?.role !== "senior_reviewer") {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-danger mb-3" />
            <h2 className="text-lg font-semibold text-danger">Access Denied</h2>
            <p className="text-secondary mt-1">Only reviewers can access this page.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Investigation Queue</h1>
          <p className="mt-1 text-secondary">
            {investigations.length} case{investigations.length !== 1 ? "s" : ""} assigned to you
          </p>
        </div>

        {error && (
          <Card className="border-danger/30 bg-danger/10">
            <CardContent className="pt-6 text-danger text-sm">
              Error loading cases: {error}
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-card rounded border border-border animate-pulse" />
            ))}
          </div>
        )}

        {!loading && investigations.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-secondary">
              No cases to review at this time.
            </CardContent>
          </Card>
        )}

        {!loading && investigations.length > 0 && (
          <div className="space-y-3">
            {investigations
              .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime())
              .map((inv) => (
                <Link key={inv.case_id} href={`/admin/investigations/${inv.case_id}`}>
                  <Card className="hover:bg-elevated-surface transition-colors cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-sm text-secondary">{inv.case_id}</span>
                            <Badge variant={inv.status === "open" ? "amber" : inv.status === "deciding" ? "blue" : "gray"}>
                              {inv.status}
                            </Badge>
                            {inv.has_provisional_restriction && (
                              <Badge variant="red">Provisional Restriction</Badge>
                            )}
                          </div>
                          <p className="text-sm text-secondary mb-2">
                            Device: <span className="font-mono">{inv.device_id}</span>
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs text-secondary">
                            <span>Opened: {formatDate(inv.opened_at)}</span>
                            <span>Deadline: {formatDate(inv.deadline_at)}</span>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm">
                          Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
