"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useRequireAuth() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("amana_token");
    if (!t) {
      router.replace("/login");
      setReady(true);
      return;
    }
    setToken(t);
    setReady(true);
  }, [router]);

  return { token, ready };
}
