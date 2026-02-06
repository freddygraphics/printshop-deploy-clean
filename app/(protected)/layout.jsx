"use client";

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import MainShell from "@/components/layout/MainShell";

export default async function ProtectedLayout({ children }) {
  const session = await auth();

  if (!session) redirect("/login");

  return <MainShell>{children}</MainShell>;
}
