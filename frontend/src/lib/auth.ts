"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, type User } from "@/lib/api";

export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const token = localStorage.getItem("amana_token");
        if (!token) {
          router.replace("/login");
          setReady(true);
          return;
        }
        const userData = await getMe();
        setUser(userData);
      } catch (err) {
        localStorage.removeItem("amana_token");
        router.replace("/login");
      } finally {
        setReady(true);
      }
    };
    hydrate();
  }, [router]);

  return { user, ready };
}
