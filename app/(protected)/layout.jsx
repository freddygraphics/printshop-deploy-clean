"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainShell from "@/components/layout/MainShell";

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        const session = await res.json();

        if (!session?.user) {
          router.replace("/login");
          return;
        }

        setReady(true);
      } catch (err) {
        router.replace("/login");
      }
    }

    checkSession();
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return <MainShell>{children}</MainShell>;
}
