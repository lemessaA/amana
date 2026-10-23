"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

type Case = { case_id: string; device_id: string; remaining_hours: number; deadline_at: string; triage_due_at: string };
export default function ReviewerPage() {
  useRequireAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [selected, setSelected] = useState("");
  const [detail, setDetail] = useState<string>("");
  const [outcome, setOutcome] = useState("unsubstantiated");
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("30");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("amana_token");
    if (!token) return;
    apiFetch<Case[]>("/investigations/queue", { headers: { Authorization: `Bearer ${token}` } })
      .then(setCases)
      .catch((e) => setMsg(e instanceof Error ? e.message : "Error"));
  }, []);

  async function loadDetail() {
    const token = localStorage.getItem("amana_token");
    if (!token || !selected) return;
    try {
      const data = await apiFetch(`/investigations/${selected}`, { headers: { Authorization: `Bearer ${token}` } });
      setDetail(JSON.stringify(data, null, 2));
    } catch (e) { setMsg(e instanceof Error ? e.message : "Error"); }
  }

  async function triage() {
    const token = localStorage.getItem("amana_token");
    if (!token || !selected) return;
    try {
      await apiFetch(`/investigations/${selected}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ outcome, reason, next_review_days: outcome === "inconclusive" ? Number(days) : undefined }),
      });
      setMsg("Triaged");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Error"); }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Reviewer Queue</h1>
      {msg && <p className="mt-2 text-sm text-gray-700">{msg}</p>}
      <div className="mt-4 grid gap-2">
        {cases.map((c) => (
          <button key={c.case_id} className="rounded border p-3 text-left" onClick={() => setSelected(c.case_id)}>
            <p className="font-medium">{c.case_id}</p>
            <p className="text-xs text-gray-600">remaining {c.remaining_hours}h · triage due {c.triage_due_at}</p>
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        <input className="w-full border p-2" placeholder="Case ID" value={selected} onChange={(e) => setSelected(e.target.value)} />
        <button className="rounded bg-gray-800 px-3 py-2 text-white" onClick={loadDetail}>Load Detail</button>
        {detail && <pre className="max-h-48 overflow-auto rounded bg-gray-100 p-2 text-xs">{detail}</pre>}
        <select className="w-full border p-2" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
          <option value="substantiated">Substantiated</option>
          <option value="unsubstantiated">Unsubstantiated</option>
          <option value="invalid">Invalid</option>
          <option value="inconclusive">Inconclusive</option>
        </select>
        <input className="w-full border p-2" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        {outcome === "inconclusive" && <input className="w-full border p-2" placeholder="Review days (<=30)" value={days} onChange={(e) => setDays(e.target.value)} />}
        <button className="rounded bg-black px-4 py-2 text-white" onClick={triage}>Triage Case</button>
      </div>
    </main>
  );
}
