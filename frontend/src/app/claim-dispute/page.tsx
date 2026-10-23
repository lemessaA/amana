"use client";
import { useState } from "react";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
export default function ClaimDisputePage() {
  useRequireAuth();
  const [identifierValue, setIdentifierValue] = useState("");
  const [acquisitionBasis, setAcquisitionBasis] = useState("other/unverified");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("amana_token");
    if (!token) { setMsg("Login required"); return; }
    try {
      const data = await apiFetch<{ case_id: string; status: string }>("/claim-disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ identifier_value: identifierValue, acquisition_basis: acquisitionBasis, description }),
      });
      setMsg(`Dispute opened: ${data.case_id}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Open Claim Dispute</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input className="w-full border p-2" placeholder="Device IMEI or serial" value={identifierValue} onChange={(e) => setIdentifierValue(e.target.value)} />
        <input className="w-full border p-2" placeholder="Acquisition basis" value={acquisitionBasis} onChange={(e) => setAcquisitionBasis(e.target.value)} />
        <textarea className="w-full border p-2" placeholder="Description / supporting basis" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className="rounded bg-black px-4 py-2 text-white" type="submit">Open Dispute</button>
      </form>
      {msg && <p className="mt-3 text-sm text-gray-700">{msg}</p>}
    </main>
  );
}
