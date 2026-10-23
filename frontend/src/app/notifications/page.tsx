"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Notification = { id: string; type: string; channel: string; delivery_status: string; created_at: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("amana_token");
    if (!token) { setError("Login required"); return; }
    apiFetch<Notification[]>("/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <ul className="mt-4 space-y-2">
        {items.map((n) => (
          <li key={n.id} className="rounded border p-3">
            <p className="font-medium">{n.type}</p>
            <p className="text-xs text-gray-600">{n.created_at} · {n.delivery_status}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
