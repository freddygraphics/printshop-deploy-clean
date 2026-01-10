"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Plus, Search, Menu } from "lucide-react";
import { ChevronDown, User, Settings, LogOut } from "lucide-react";
import clsx from "clsx";

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
      <div className={`flex items-center w-full px-4 gap-6`}>
        {/* MOBILE MENU BTN */}
        <button
          onClick={onToggleMobile}
          className="lg:hidden h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center"
        >
          <Menu size={20} />
        </button>

        {/* + BUTTON (ROLE BASED) */}
        {role && CREATE_PERMISSIONS[role]?.length > 0 && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpenNew(!openNew)}
              className="w-11 h-11 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 shadow-md"
            >
              <Plus size={24} />
            </button>

            {openNew && (
              <div className="absolute left-0 mt-3 w-52 rounded-xl border bg-white shadow-xl p-1">
                {canCreate("quote") && (
                  <DropdownItem href="/quotes/new" label="➕ New Quote" />
                )}

                {canCreate("invoice") && (
                  <DropdownItem href="/invoices/new" label="💵 New Invoice" />
                )}
                {canCreate("job") && (
                  <DropdownItem href="/jobs/new" label="🛠 New Job" />
                )}
                {canCreate("customer") && (
                  <DropdownItem href="/clients/new" label="👤 New Customer" />
                )}
              </div>
            )}
          </div>
        )}

        {/* RIGHT SIDE - USER */}
        <div className="ml-auto flex items-center">
          {session && (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setOpenUser(!openUser)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                {/* AVATAR */}
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  {session.user.name?.charAt(0)}
                </div>

                {/* NAME + ROLE */}
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-sm font-medium">{session.user.name}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {session.user.role}
                  </div>
                </div>

                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {/* DROPDOWN */}
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
