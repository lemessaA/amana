"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function AccountPage() {
  const [msg, setMsg] = useState("");

  async function deactivate() {
    const token = localStorage.getItem("amana_token");
    if (!token) { setMsg("Login required"); return; }
    try {
      await apiFetch("/account/deactivate", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      localStorage.removeItem("amana_token");
      setMsg("Account deactivated");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Account</h1>
      <button className="mt-4 rounded bg-red-700 px-4 py-2 text-white" onClick={deactivate}>Deactivate Account</button>
      {msg && <p className="mt-3 text-sm text-gray-700">{msg}</p>}
    </main>
  );
}
