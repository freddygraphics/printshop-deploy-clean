"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Plus, Search, Menu } from "lucide-react";
import { ChevronDown, User, Settings, LogOut } from "lucide-react";
import clsx from "clsx";
import { FileText, Factory, Users } from "lucide-react";

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
    <header
      className={`
    fixed top-0 left-0 h-16
    bg-white border-b shadow-sm z-30 flex items-center
    w-full
    md:w-[calc(100%-15rem)]
    md:ml-60
    transition-all duration-200
  `}
    >
      {/* Align content with sidebar width */}
      <div className="flex items-center w-full px-6 max-w-[1400px] mx-auto">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <button
            onClick={onToggleMobile}
            className="lg:hidden h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-md px-3 h-10 w-64">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search…"
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
        </div>

        {/* CENTER – QUICK ACTIONS */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2">
            <Link
              href="/invoices/new"
              title="New Invoice"
              className="p-2 rounded-md hover:bg-gray-100 transition"
            >
              <FileText className="w-5 h-5 text-gray-700" />
            </Link>

            <Link
              href="/production"
              title="Production"
              className="p-2 rounded-md hover:bg-gray-100 transition"
            >
              <Factory className="w-5 h-5 text-gray-700" />
            </Link>

            <Link
              href="/customers"
              title="Customers"
              className="p-2 rounded-md hover:bg-gray-100 transition"
            >
              <Users className="w-5 h-5 text-gray-700" />
            </Link>
          </div>
        </div>

        {/* RIGHT – USER */}
        <div className="flex items-center">
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
                  <div className="text-sm font-medium">{session.user.name}</div>
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
