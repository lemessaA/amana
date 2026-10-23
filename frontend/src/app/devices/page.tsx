"use client";
import { useState } from "react";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
export default function DevicesPage() {
  useRequireAuth();
  const [deviceType, setDeviceType] = useState("phone");
  const [identifierType, setIdentifierType] = useState("imei");
  const [identifierValue, setIdentifierValue] = useState("");
  const [msg, setMsg] = useState("");
  const [releaseId, setReleaseId] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("amana_token");
    if (!token) { setMsg("Login required"); return; }
    try {
      const data = await apiFetch<{ device_id: string }>("/devices/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ device_type: deviceType, identifier_type: identifierType, identifier_value: identifierValue }),
      });
      setMsg(`Registered device ${data.device_id}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Register Device</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <select className="w-full border p-2" value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
          <option value="phone">Phone</option>
          <option value="computer">Computer</option>
        </select>
        <select className="w-full border p-2" value={identifierType} onChange={(e) => setIdentifierType(e.target.value)}>
          <option value="imei">IMEI</option>
          <option value="serial">Serial</option>
        </select>
        <input className="w-full border p-2" placeholder="Identifier value" value={identifierValue} onChange={(e) => setIdentifierValue(e.target.value)} />
        <button className="rounded bg-black px-4 py-2 text-white" type="submit">Register</button>
      </form>
      <div className="mt-6 space-y-2">
        <h2 className="font-semibold">Release Association</h2>
        <input className="w-full border p-2" placeholder="Device ID" value={releaseId} onChange={(e) => setReleaseId(e.target.value)} />
        <button className="rounded bg-red-700 px-4 py-2 text-white" onClick={async () => {
          const token = localStorage.getItem("amana_token");
          if (!token || !releaseId) { setMsg("Login and device ID required"); return; }
          try {
            await apiFetch(`/devices/${releaseId}/release`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
            setMsg("Association released");
          } catch (e) { setMsg(e instanceof Error ? e.message : "Error"); }
        }}>Release</button>
      </div>
      {msg && <p className="mt-3 text-sm text-gray-700">{msg}</p>}
    </main>
  );
}
