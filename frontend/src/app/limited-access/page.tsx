"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
export default function LimitedAccessPage() {
  useRequireAuth();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("amana_token");
    if (!token) { setError("Token required"); return; }
    apiFetch("/account/limited-case-access", { headers: { Authorization: `Bearer ${token}` } })
      .then((x) => setData(x as Record<string, unknown>))
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Limited Case Access</h1>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {data && <pre className="mt-4 overflow-auto rounded bg-gray-100 p-3 text-xs">{JSON.stringify(data, null, 2)}</pre>}
    </main>
  );
}
