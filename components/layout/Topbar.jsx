"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

import clsx from "clsx";
import {
  Plus,
  Search,
  Menu,
  ChevronDown,
  User,
  Settings,
  LogOut,
  FileText,
  FileSignature,
  Factory,
  Users,
  Package,
  Home,
} from "lucide-react";
export default function Topbar({
  collapsed,
  onToggleMobile,
  onToggleCollapse,
}) {
  const [openNew, setOpenNew] = useState(false);
  const menuRef = useRef(null);
  const { data: session, status } = useSession();
  const [openUser, setOpenUser] = useState(false);
  const userRef = useRef(null);

  const role = session?.user?.role;

  const canCreate = (type) => {
    if (!role) return false;
    return CREATE_PERMISSIONS[role]?.includes(type);
  };

  useEffect(() => {
    const handler = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setOpenUser(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // close floating menu
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenNew(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="h-14 bg-white border-b">
      <div className="max-w-[1200px] mx-auto h-full px-6">
        <div className="flex items-center justify-between h-full">
          {/* LEFT */}
          <div className="flex items-center gap-6">
            {/* BOTON + */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpenNew(!openNew)}
                className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow"
              >
                <Plus size={20} />
              </button>

              {openNew && (
                <div className="absolute top-12 left-0 w-44 bg-white border rounded-xl shadow-lg py-2 z-50">
                  <DropdownItem href="/quotes/new" label="New Quote" />
                  <DropdownItem href="/invoices/new" label="New Invoice" />
                </div>
              )}
            </div>

            {/* ICONOS */}
            <div className="flex items-center gap-5">
              <Link
                href="/"
                className="p-1 rounded hover:bg-gray-100"
                title="Dashboard"
              >
                <Home className="w-5 h-5 text-gray-600" />
              </Link>

              <Link
                href="/quotes"
                className="p-1 rounded hover:bg-gray-100"
                title="Quotes"
              >
                <FileSignature className="w-5 h-5 text-gray-600" />
              </Link>

              <Link
                href="/invoices"
                className="p-1 rounded hover:bg-gray-100"
                title="Invoices"
              >
                <FileText className="w-5 h-5 text-gray-600" />
              </Link>

              <Link
                href="/production"
                className="p-1 rounded hover:bg-gray-100"
                title="Production"
              >
                <Factory className="w-5 h-5 text-gray-600" />
              </Link>

              <Link
                href="/customers"
                className="p-1 rounded hover:bg-gray-100"
                title="Customers"
              >
                <Users className="w-5 h-5 text-gray-600" />
              </Link>

              <Link
                href="/products"
                className="p-1 rounded hover:bg-gray-100"
                title="Products"
              >
                <Package className="w-5 h-5 text-gray-600" />
              </Link>
            </div>
          </div>
          {/* RIGHT inside board: User */}
          <div className="flex justify-end items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-md px-3 h-10 w-64">
              <Search size={16} className="text-gray-400" />

              <input
                type="text"
                placeholder="Search…"
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>
            {session && (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setOpenUser(!openUser)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                    {session.user.name?.charAt(0)}
                  </div>

                  <div className="hidden md:block text-left leading-tight">
                    <div className="text-sm font-medium">
                      {session.user.name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {session.user.role}
                    </div>
                  </div>

                  <ChevronDown size={16} className="text-gray-400" />
                </button>

                {openUser && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border bg-white shadow-xl overflow-hidden">
                    <DropdownAction
                      icon={<User size={16} />}
                      label="Profile"
                      href="/profile"
                    />
                    <DropdownAction
                      icon={<Settings size={16} />}
                      label="Settings"
                      href="/settings"
                    />
                    <div className="border-t my-1" />
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
const CREATE_PERMISSIONS = {
  admin: ["quote", "invoice", "job", "product", "customer"],
  sales: ["quote", "invoice", "customer"],
  production: ["job"],
  staff: [],
};

function DropdownItem({ href, label }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 rounded-md hover:bg-gray-100 text-gray-700"
    >
      {label}
    </Link>
  );
}
function DropdownAction({ icon, label, href }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
    >
      {icon}
      {label}
    </Link>
  );
}
