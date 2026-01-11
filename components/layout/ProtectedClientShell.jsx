"use client";

import { SessionProvider } from "next-auth/react";
import MainShell from "@/components/layout/MainShell";

export default function ProtectedClientShell({ children }) {
  return (
    <SessionProvider>
      <MainShell>{children}</MainShell>
    </SessionProvider>
  );
}
