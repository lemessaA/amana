"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

type Q = { case_id: string; submitted_by: string; deadline_at: string };
export default function ReviewerConflictsPage() {
  useRequireAuth();
  const [queue, setQueue] = useState<Q[]>([]);
  const [caseId, setCaseId] = useState("");
  const [outcome, setOutcome] = useState("duplicate");
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("7");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("amana_token"); if (!token) return;
    apiFetch<Q[]>("/identifier-conflicts/queue", { headers: { Authorization: `Bearer ${token}` } }).then(setQueue).catch((e) => setMsg(e instanceof Error ? e.message : "Error"));
  }, []);

  async function resolve() {
    const token = localStorage.getItem("amana_token"); if (!token || !caseId) return;
    try {
      const d = { outcome, reason, next_review_days: outcome === "unresolved_conflict" ? Number(days) : undefined };
      await apiFetch(`/identifier-conflicts/${caseId}/resolve`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(d) });
      setMsg("Resolved");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Error"); }
  }

  async function extend() {
    const token = localStorage.getItem("amana_token"); if (!token || !caseId) return;
    try {
      await apiFetch(`/identifier-conflicts/${caseId}/extend`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ extension_hours: 24, reason: "need more time" }) });
      setMsg("Extended");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Error"); }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Identifier Conflict Review</h1>
      {msg && <p className="mt-2 text-sm text-gray-700">{msg}</p>}
      <div className="mt-4 space-y-2">{queue.map((q) => <button key={q.case_id} className="block w-full rounded border p-3 text-left" onClick={() => setCaseId(q.case_id)}><p className="font-medium">{q.case_id}</p><p className="text-xs text-gray-600">deadline {q.deadline_at}</p></button>)}</div>
      <div className="mt-6 space-y-3">
        <input className="w-full border p-2" placeholder="Case ID" value={caseId} onChange={(e) => setCaseId(e.target.value)} />
        <select className="w-full border p-2" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
          <option value="duplicate">Duplicate</option>
          <option value="data_entry_error">Data entry error</option>
          <option value="legitimate_additional_identifier">Legitimate additional identifier</option>
          <option value="unresolved_conflict">Unresolved conflict</option>
        </select>
        <input className="w-full border p-2" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        {outcome === "unresolved_conflict" && <input className="w-full border p-2" placeholder="Review days <=30" value={days} onChange={(e) => setDays(e.target.value)} />}
        <div className="flex gap-2">
          <button className="rounded bg-black px-4 py-2 text-white" onClick={resolve}>Resolve</button>
          <button className="rounded bg-gray-700 px-4 py-2 text-white" onClick={extend}>Extend</button>
        </div>
      </div>
    </main>
  );
}
