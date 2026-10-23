"use client";
import { useState } from "react";
import Link from "next/link";
import { lookupDevice, type PublicLookupResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor } from "@/lib/utils";
import { AlertCircle, Check, Clock, AlertTriangle } from "lucide-react";

export default function LookupPage() {
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<PublicLookupResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const data = await lookupDevice(identifier);
      setResult(data);
    } catch (err: any) {
      setError(err.data?.detail || err.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  const statusIcon = {
    green: <Check className="h-5 w-5" />,
    amber: <Clock className="h-5 w-5" />,
    red: <AlertTriangle className="h-5 w-5" />,
    blue: null,
    gray: null,
  };

  const statusColor = result ? getStatusColor(result.effective_status) : "gray";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-elevated-surface px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="text-lg font-bold text-primary-accent">
            ← Back to AMANA
          </Link>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Device Status Lookup</h1>
            <p className="mt-2 text-secondary">
              Check the restriction status of any device by IMEI or serial number.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Device Identifier</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter IMEI (phone) or serial number (computer)..."
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="flex-1 h-10 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  disabled={loading}
                  autoFocus
                />
                <Button type="submit" disabled={loading || !identifier}>
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
              <p className="mt-1 text-xs text-secondary">
                Enter a 15-digit IMEI or your device's serial number
              </p>
            </div>

            {error && (
              <Alert className="bg-danger/10 border-danger/30 text-danger">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Device Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {statusIcon[statusColor] || null}
                  <Badge variant={statusColor}>
                    {result.effective_status}
                  </Badge>
                </div>

                <div className="bg-elevated-surface rounded p-4 border border-border">
                  <p className="text-sm leading-relaxed">{result.explanation}</p>
                </div>

                <div className="bg-warning/10 border border-warning/30 rounded p-4 text-sm text-warning">
                  <p className="font-medium mb-1">⚠️ Important Disclaimer</p>
                  <p>
                    This lookup shows general device restriction status in AMANA. It does NOT:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                    <li>Prove legal ownership of the device</li>
                    <li>Guarantee the device is legitimate</li>
                    <li>Prevent fraud or theft</li>
                    <li>Substitute for direct verification with the seller</li>
                  </ul>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIdentifier("");
                      setResult(null);
                    }}
                  >
                    Search Again
                  </Button>
                  <Link href="/register">
                    <Button variant="secondary">Register Device</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="bg-card border border-border rounded-lg p-6 space-y-3 text-sm">
            <h3 className="font-semibold">How to interpret results:</h3>
            <ul className="space-y-2 text-secondary">
              <li>
                <strong className="text-foreground">Clear:</strong> No active restrictions in AMANA.
              </li>
              <li>
                <strong className="text-foreground">Restricted pending review:</strong> A report or dispute is being investigated.
              </li>
              <li>
                <strong className="text-foreground">Restricted:</strong> An active restriction exists. Contact AMANA for details.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
