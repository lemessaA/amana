"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/auth";
import { deactivateAccount, logout } from "@/lib/api";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AccountPage() {
  const router = useRouter();
  const { user, ready } = useRequireAuth();
  const [deactivating, setDeactivating] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleDeactivate() {
    setError("");
    setSuccess("");
    setDeactivating(true);

    try {
      await deactivateAccount();
      setSuccess("Account deactivated successfully. Logging out...");
      setTimeout(async () => {
        await logout();
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Deactivation failed");
    } finally {
      setDeactivating(false);
    }
  }

  if (!ready || !user) {
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
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="mt-1 text-secondary">Manage your account and preferences</p>
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

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-secondary">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-secondary">Account Role</p>
              <p className="font-medium capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-secondary">Account Status</p>
              <p className={`font-medium capitalize ${user.account_status === "active" ? "text-success" : "text-warning"}`}>
                {user.account_status}
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary">Account Created</p>
              <p className="font-medium">{formatDate(user.created_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Language</p>
                <p className="text-sm text-secondary">English (Default)</p>
              </div>
              <Button variant="secondary" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-danger/30 bg-danger/10">
          <CardHeader>
            <CardTitle className="text-danger">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible account actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!confirmDeactivate ? (
              <div className="space-y-3">
                <p className="text-sm text-secondary">
                  Deactivating your account will disable login but retain your records for active cases, security, and audit purposes.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmDeactivate(true)}
                  disabled={deactivating}
                >
                  Deactivate Account
                </Button>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-background border border-danger/30 rounded">
                <p className="text-sm font-medium">Are you sure?</p>
                <p className="text-sm text-secondary">
                  This action is irreversible. Your account will be deactivated and you will be logged out.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleDeactivate}
                    disabled={deactivating}
                  >
                    {deactivating ? "Deactivating..." : "Yes, Deactivate"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setConfirmDeactivate(false)}
                    disabled={deactivating}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
