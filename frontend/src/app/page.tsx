"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { lookupDevice, type PublicLookupResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getStatusColor } from "@/lib/utils";
import { AlertCircle, Search, Check, Clock, AlertTriangle, Lock } from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
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
    blue: <Lock className="h-5 w-5" />,
    gray: null,
  };

  const statusColor = result ? getStatusColor(result.effective_status) : "gray";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-elevated-surface">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary-accent">
              AMANA
            </Link>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-sm text-secondary">{user.email}</span>
                  <Link href="/dashboard">
                    <Button size="sm" variant="secondary">
                      Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/lookup">
                    <Button size="sm" variant="secondary">
                      Device Lookup
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="sm">Sign In</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-elevated-surface to-background px-4 py-12 sm:py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Know the Device.
            <br />
            Check the Status.
            <br />
            <span className="text-primary-accent">Make Informed Decisions.</span>
          </h1>
          <p className="text-lg text-secondary mb-8 max-w-2xl mx-auto">
            AMANA helps people register device claims, report suspected theft, resolve conflicting claims, and review permitted device-status information before a second-hand transaction.
          </p>

          {/* Lookup Form */}
          <div className="bg-card border border-border rounded-lg p-6 md:p-8 max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-left mb-2">
                  Search Device Status
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter IMEI or serial number..."
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="flex-1 h-10 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    disabled={loading || !identifier}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {loading ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="danger">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {result && (
                <div className="text-left space-y-3">
                  <div className="flex items-center gap-2">
                    {statusIcon[statusColor]}
                    <Badge variant={statusColor}>
                      {result.effective_status}
                    </Badge>
                  </div>
                  <p className="text-sm text-secondary">{result.explanation}</p>
                  <div className="text-xs text-secondary border-t border-border pt-3">
                    ⚠️ This lookup shows general device restriction status. It does not prove ownership or guarantee the device is legitimate.
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            {!user && (
              <>
                <Link href="/register">
                  <Button size="lg">Register a Device</Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="secondary">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold mb-8 text-center">How AMANA Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Register Your Device",
                description: "Create a device claim with your IMEI or serial number to establish a record and timeline.",
              },
              {
                title: "Report Issues",
                description: "If you suspect theft or have a conflicting claim, submit a report for review by authorized staff.",
              },
              {
                title: "Resolve Disputes",
                description: "AMANA reviewers assess evidence and resolve disputes fairly and transparently.",
              },
              {
                title: "Check Status Anytime",
                description: "Look up any device to see its restriction status before purchasing second-hand.",
              },
              {
                title: "Approved Transfers",
                description: "Complete a safe, auditable transfer after meeting eligibility requirements.",
              },
              {
                title: "Full Audit Trail",
                description: "All actions are recorded for accountability and dispute resolution.",
              },
            ].map((feature, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-secondary text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-12 md:py-16 bg-elevated-surface">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Does a clear lookup mean the device is safe?",
                a: "A clear status indicates no active theft restriction in AMANA. However, AMANA does not guarantee the device is legitimate or prove legal ownership. Always use caution and verify directly with the seller.",
              },
              {
                q: "How long are records kept?",
                a: "Record retention follows our privacy policy and legal requirements. Completed transfers are retained for audit purposes.",
              },
              {
                q: "Can I transfer a device with an active restriction?",
                a: "No. Transfers are blocked if the device has an active restriction or unresolved dispute. A reviewer must resolve the issue first.",
              },
              {
                q: "Is AMANA affiliated with police or manufacturers?",
                a: "No. AMANA is an independent platform for device claim registration and dispute resolution. It is not affiliated with law enforcement or device manufacturers.",
              },
            ].map((item, i) => (
              <details key={i} className="group border border-border rounded-lg p-4">
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {item.q}
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-secondary text-sm">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & Limitations */}
      <section className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Privacy and Platform Limitations</h3>
            <ul className="space-y-2 text-sm text-secondary list-disc list-inside">
              <li>AMANA does not expose claimant or reporter identities in public lookups.</li>
              <li>Personal case details and evidence are protected and visible only to authorized parties.</li>
              <li>A clear lookup does not prove legal ownership or device authenticity.</li>
              <li>AMANA does not guarantee recovery of stolen devices or conclusive identification.</li>
              <li>Always contact the seller directly and exercise due diligence when purchasing second-hand.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-elevated-surface px-4 py-8 text-center text-sm text-secondary">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-center gap-6 mb-6">
            <Link href="#" className="hover:text-foreground">Terms of Service</Link>
            <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground">Contact</Link>
          </div>
          <p>&copy; 2026 AMANA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
