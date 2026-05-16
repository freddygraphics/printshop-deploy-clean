"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

import MainShell from "@/components/layout/MainShell";
import Topbar from "@/components/layout/Topbar";

export default function ProtectedLayout({ children }) {
  const { status } = useSession();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // 🔥 ONLY HIDE SIDEBAR
  const hideSidebar = pathname.includes("/production");

  if (hideSidebar) {
    return (
      <div className="min-h-screen bg-[#F5F7F9]">
        <Topbar />
        {children}
      </div>
    );
  }

  return <MainShell>{children}</MainShell>;
}
