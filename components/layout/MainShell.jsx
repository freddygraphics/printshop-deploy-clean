"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { usePathname } from "next/navigation";

export default function MainShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col">
      {/* TOPBAR */}
      <header className="h-16 shrink-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
      </header>

      {/* BODY */}
      <div className="flex flex-1">
        {/* SIDEBAR */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* CONTENT */}
        <main className="flex-1 md:ml-64">
          <div className="max-w-[1900px] mx-auto px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
