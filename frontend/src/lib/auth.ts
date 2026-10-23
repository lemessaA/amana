"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, type User } from "./api";

export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("amana_token");
    if (!t) {
      router.replace("/login");
      setReady(true);
      return;
    }

    // Verify token by fetching user
    getMe()
      .then((u) => {
        setUser(u);
        setReady(true);
      })
      .catch(() => {
        localStorage.removeItem("amana_token");
        router.replace("/login");
        setReady(true);
      });
  }, [router]);

  return { user, ready };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("amana_token");
    if (!t) {
      setLoading(false);
      return;
    }

    getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem("amana_token"))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
