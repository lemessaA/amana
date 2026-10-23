"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

type LookupResponse = { effective_status: string; explanation: string };

export default function LookupPage() {
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await apiFetch<LookupResponse>(`/devices/lookup?identifier=${encodeURIComponent(identifier)}`);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Public Device Lookup</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input className="w-full border p-2" placeholder="IMEI or serial" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        <button className="rounded bg-black px-4 py-2 text-white" type="submit">Lookup</button>
      </form>
      {result && (
        <div className="mt-4 rounded border p-3">
          <p className="font-semibold">{result.effective_status}</p>
          <p className="text-sm text-gray-700">{result.explanation}</p>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </main>
  );
}
