"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

type Q = { case_id: string; device_id: string; requester_user_id: string; deadline_at: string };
export default function ReviewerDisputesPage() {
  useRequireAuth();
  const [queue, setQueue] = useState<Q[]>([]);
  const [caseId, setCaseId] = useState("");
  const [outcome, setOutcome] = useState("current_claimant_retained");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("amana_token"); if (!token) return;
    apiFetch<Q[]>("/claim-disputes/queue", { headers: { Authorization: `Bearer ${token}` } }).then(setQueue).catch((e) => setMsg(e instanceof Error ? e.message : "Error"));
  }, []);

  async function resolve() {
    const token = localStorage.getItem("amana_token"); if (!token || !caseId) return;
    try {
      await apiFetch(`/claim-disputes/${caseId}/resolve`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ outcome, reason }) });
      setMsg("Resolved");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Error"); }
  }

  async function extend() {
    const token = localStorage.getItem("amana_token"); if (!token || !caseId) return;
    try {
      await apiFetch(`/claim-disputes/${caseId}/extend`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ extension_hours: 24, reason: "need more time" }) });
      setMsg("Extended");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Error"); }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Claim Dispute Review</h1>
      {msg && <p className="mt-2 text-sm text-gray-700">{msg}</p>}
      <div className="mt-4 space-y-2">{queue.map((q) => <button key={q.case_id} className="block w-full rounded border p-3 text-left" onClick={() => setCaseId(q.case_id)}><p className="font-medium">{q.case_id}</p><p className="text-xs text-gray-600">deadline {q.deadline_at}</p></button>)}</div>
      <div className="mt-6 space-y-3">
        <input className="w-full border p-2" placeholder="Case ID" value={caseId} onChange={(e) => setCaseId(e.target.value)} />
        <input className="w-full border p-2" placeholder="Outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} />
        <input className="w-full border p-2" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="flex gap-2">
          <button className="rounded bg-black px-4 py-2 text-white" onClick={resolve}>Resolve</button>
          <button className="rounded bg-gray-700 px-4 py-2 text-white" onClick={extend}>Extend</button>
        </div>
      </div>
    </main>
  );
}
