"use client";

import AuthProvider from "@/components/providers/AuthProvider";
import MainShell from "@/components/layout/MainShell";

export default function ProtectedShell({ children }) {
  return (
    <AuthProvider>
      <MainShell>{children}</MainShell>
    </AuthProvider>
  );
}
