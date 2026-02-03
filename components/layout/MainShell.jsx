"use client";

import { useState } from "react"; // 👈 ESTE FALTABA
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function MainShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col">
      {/* TOPBAR */}
      <header className="h-16 shrink-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
      </header>

      {/* BODY */}
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 ml-64">
          <div className="max-w-[1900px] mx-auto px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
