"use client";

import Topbar from "./Topbar";

export default function MainShell({ children }) {
  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col">
      <div className="h-16 shrink-0">
        <Topbar />
      </div>

      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
