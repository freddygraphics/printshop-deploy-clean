"use client";
export const dynamic = "force-dynamic";
import { useSession } from "next-auth/react";
import MainShell from "@/components/layout/MainShell";

export default function ProtectedLayout({ children }) {
  const { data: session, status } = useSession();

  // Mientras carga la sesión
  if (status === "loading") return null;

  // ❌ NO sesión → renderizar solo children (login)
  if (!session) {
    return <>{children}</>;
  }

  // ✅ Con sesión → layout completo
  return <MainShell>{children}</MainShell>;
}
