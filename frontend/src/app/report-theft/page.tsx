"use client";
import { useState } from "react";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
export default function ReportTheftPage() {
  useRequireAuth();
  const [identifierValue, setIdentifierValue] = useState("");
  const [category, setCategory] = useState("lost");
  const [description, setDescription] = useState("");
  const [incidentPeriod, setIncidentPeriod] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("amana_token");
    if (!token) { setMsg("Login required"); return; }
    try {
      const data = await apiFetch<{ report_id: string; case_id: string; duplicate: boolean }>("/theft-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          identifier_value: identifierValue,
          allegation_category: category,
          description,
          incident_period: incidentPeriod || null,
        }),
      });
      setMsg(`Report submitted. Case: ${data.case_id}${data.duplicate ? " (linked to existing case)" : ""}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Report Possible Theft</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input className="w-full border p-2" placeholder="IMEI or serial" value={identifierValue} onChange={(e) => setIdentifierValue(e.target.value)} />
        <select className="w-full border p-2" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="lost">Lost</option>
          <option value="stolen">Stolen</option>
          <option value="suspicious">Suspicious</option>
        </select>
        <textarea className="w-full border p-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="w-full border p-2" placeholder="Incident period (optional)" value={incidentPeriod} onChange={(e) => setIncidentPeriod(e.target.value)} />
        <button className="rounded bg-black px-4 py-2 text-white" type="submit">Submit Report</button>
      </form>
      {msg && <p className="mt-3 text-sm text-gray-700">{msg}</p>}
    </main>
  );
}
