"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Factory,
  Users,
  Package,
  BarChart3,
  Settings,
  ChevronDown,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  /* ---------------- ROUTE HELPERS ---------------- */
  const isActive = (path) => pathname.startsWith(path);
  const isExact = (path) => pathname === path;
  const isGroupRoute = (base) =>
    pathname === base || pathname.startsWith(base + "/");

  /* ---------------- LOCAL STATE ---------------- */
  const [openQuotes, setOpenQuotes] = useState(false);
  const [openInvoices, setOpenInvoices] = useState(false);

  /* ---------------- AUTO OPEN BY ROUTE ---------------- */
  useEffect(() => {
    setOpenQuotes(isGroupRoute("/quotes"));
    setOpenInvoices(isGroupRoute("/invoices"));
  }, [pathname]);

  return (
    <aside
      className="
        fixed top-0 left-0
        w-60 h-screen
        bg-white py-6
        p-4 flex flex-col
        border-r border-gray-200
        z-40
      "
    >
      {/* LOGO */}
      <div className="text-gray-900 font-semibold text-lg mb-2">
        Freddy Graphics LLC
      </div>

      {/* MENU */}
      <nav className="py-10 space-y-1 flex-1 overflow-y-auto pr-1">
        <NavItem
          href="/dashboard"
          icon={LayoutDashboard}
          active={isActive("/dashboard")}
        >
          Dashboard
        </NavItem>

        {/* QUOTES */}
        <MenuGroup
          title="Quotes"
          icon={FileText}
          open={openQuotes}
          onToggle={() => setOpenQuotes((v) => !v)}
        >
          <SubItem href="/quotes/new" active={isExact("/quotes/new")}>
            New Quote
          </SubItem>
          <SubItem href="/quotes" active={isExact("/quotes")}>
            Quote
          </SubItem>
        </MenuGroup>

        {/* INVOICES */}
        <MenuGroup
          title="Invoices"
          icon={Receipt}
          open={openInvoices}
          onToggle={() => setOpenInvoices((v) => !v)}
        >
          <SubItem href="/invoices/new" active={isExact("/invoices/new")}>
            New Invoice
          </SubItem>
          <SubItem href="/invoices" active={isExact("/invoices")}>
            Invoice
          </SubItem>
        </MenuGroup>

        <NavItem
          href="/production"
          icon={Factory}
          active={isActive("/production")}
        >
          Production
        </NavItem>

        <NavItem href="/customers" icon={Users} active={isActive("/customers")}>
          Customers
        </NavItem>

        <NavItem href="/products" icon={Package} active={isActive("/products")}>
          Products
        </NavItem>

        <NavItem href="/reports" icon={BarChart3} active={isActive("/reports")}>
          Reports
        </NavItem>
      </nav>

      {/* SETTINGS */}
      <NavItem href="/settings" icon={Settings} active={isActive("/settings")}>
        Settings
      </NavItem>
    </aside>
  );
}

/* ================= COMPONENTS ================= */

function NavItem({ href, icon: Icon, active, children }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg
        text-[15px] font-semibold text-[#5D6772]
        transition
        ${
          active
            ? "bg-white text-gray-900 border-l-4 border-blue-500 shadow-sm"
            : "hover:bg-white"
        }`}
    >
      <Icon className="w-4 h-4 text-[#8A94A3]" />
      {children}
    </Link>
  );
}

function MenuGroup({ title, icon: Icon, open, onToggle, children }) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="
          flex items-center justify-between w-full
          px-3 py-2 rounded-lg
           text-[15px] font-semibold text-[#5D6772]
          hover:bg-white
        "
      >
        <span className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-[#8A94A3]" />
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#8A94A3] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && <div className="ml-6 mt-1 space-y-1">{children}</div>}
    </div>
  );
}

/* -------- SubItem -------- */

function SubItem({ href, active, children }) {
  return (
    <Link
      href={href}
      className={`block px-3 py-1.5 rounded-md
        text-[14px] font-normal text-[#5D6772]
        transition
        ${active ? "bg-white text-gray-900 shadow-sm" : "hover:bg-white"}`}
    >
      {children}
    </Link>
  );
}
