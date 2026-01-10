// frontend/components/Layout.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const [workflowCounts, setWorkflowCounts] = useState({});
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", path: "/" },
    { name: "Clients", path: "/clients" },
    { name: "Products", path: "/products" },
    { name: "Orders / Workflow", path: "/orders" },
    { name: "Invoices", path: "/invoices" },
  ];

  // 🔄 Fetch workflow data (ejemplo opcional)
  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/orders/status-counts`);
        if (!res.ok) return;
        const data = await res.json();
        setWorkflowCounts(data);
      } catch (error) {
        console.error("Error fetching workflow counts:", error);
      }
    }
    fetchCounts();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          open ? "translate-x-0" : "-translate-x-full"
        } fixed md:static md:translate-x-0 bg-cyan-700 text-white w-64 p-5 transition-transform duration-200 ease-in-out z-40`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 mr-2" />
          <h2 className="text-2xl font-bold">PrintShop</h2>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`block px-4 py-2 rounded-lg hover:bg-cyan-600 ${
                pathname === item.path ? "bg-cyan-600" : ""
              }`}
              onClick={() => setOpen(false)}
            >
              <div className="flex justify-between items-center">
                <span>{item.name}</span>
                {/* Badges dinámicos para Workflow */}
                {item.name === "Orders / Workflow" && workflowCounts && (
                  <span className="text-xs bg-white text-cyan-700 font-semibold px-2 py-0.5 rounded-full">
                    {Object.values(workflowCounts).reduce((a, b) => a + b, 0) || 0}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center md:pl-6">
          <button
            className="md:hidden bg-cyan-600 text-white px-3 py-1 rounded-lg"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
          <h1 className="text-xl font-semibold text-cyan-700">
            {menuItems.find((i) => i.path === pathname)?.name || "Dashboard"}
          </h1>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
