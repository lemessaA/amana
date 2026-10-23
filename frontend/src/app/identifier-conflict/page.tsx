"use client";
import { useState } from "react";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
export default function IdentifierConflictPage() {
  useRequireAuth();
  const [identifierValue, setIdentifierValue] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("amana_token");
    if (!token) { setMsg("Login required"); return; }
    try {
      const data = await apiFetch<{ case_id: string; status: string }>("/identifier-conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ identifier_value: identifierValue }),
      });
      setMsg(`Conflict held for review: ${data.case_id}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Submit Identifier Conflict</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input className="w-full border p-2" placeholder="Conflicting IMEI or serial" value={identifierValue} onChange={(e) => setIdentifierValue(e.target.value)} />
        <button className="rounded bg-black px-4 py-2 text-white" type="submit">Hold for Review</button>
      </form>
      {msg && <p className="mt-3 text-sm text-gray-700">{msg}</p>}
    </main>
  );
}
