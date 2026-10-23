"use client";
import { useState } from "react";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
export default function TransfersPage() {
  useRequireAuth();
  const token = typeof window !== "undefined" ? localStorage.getItem("amana_token") : null;
  const [deviceId, setDeviceId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [transferId, setTransferId] = useState("");
  const [msg, setMsg] = useState("");

  async function authed(path: string, method = "POST", body?: unknown) {
    if (!token) throw new Error("Login required");
    return apiFetch(path, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async function initiate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = await authed("/transfers/initiate", "POST", { device_id: deviceId, recipient_user_id: recipientId }) as { transfer_id: string };
      setTransferId(data.transfer_id);
      setMsg(`Transfer initiated: ${data.transfer_id}`);
    } catch (err) { setMsg(err instanceof Error ? err.message : "Error"); }
  }

  async function action(path: string) {
    try {
      const data = await authed(`/transfers/${transferId}/${path}`, "POST");
      setMsg(JSON.stringify(data));
    } catch (err) { setMsg(err instanceof Error ? err.message : "Error"); }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-bold">AMANA Transfers</h1>
      <form onSubmit={initiate} className="space-y-3">
        <input className="w-full border p-2" placeholder="Device ID" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} />
        <input className="w-full border p-2" placeholder="Recipient user ID" value={recipientId} onChange={(e) => setRecipientId(e.target.value)} />
        <button className="rounded bg-black px-4 py-2 text-white" type="submit">Initiate Transfer</button>
      </form>
      <div className="space-y-2">
        <input className="w-full border p-2" placeholder="Transfer ID" value={transferId} onChange={(e) => setTransferId(e.target.value)} />
        <div className="flex gap-2">
          <button className="rounded bg-green-700 px-3 py-2 text-white" onClick={() => action("accept")}>Accept</button>
          <button className="rounded bg-gray-700 px-3 py-2 text-white" onClick={() => action("decline")}>Decline</button>
          <button className="rounded bg-red-700 px-3 py-2 text-white" onClick={() => action("cancel")}>Cancel</button>
        </div>
      </div>
      {msg && <p className="text-sm text-gray-700">{msg}</p>}
    </main>
  );
}
