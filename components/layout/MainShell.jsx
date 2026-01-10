"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function MainShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col overflow-hidden">
      {/* TOPBAR */}
      <div className="h-16 shrink-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* CONTENT */}
        <div className="flex-1 flex flex-col overflow-x-hidden ml-0 md:ml-60">
          <main className="flex-1 px-4 py-6">
            <div className="mx-auto max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
