"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  ListOrdered,
  CheckCircle2,
  Users,
  Calculator,
  ShoppingBag,
  Plus,
  Search,
} from "lucide-react";

export default function Topbar() {
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menú si clic afuera
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="w-full bg-white border-b">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-6">

        {/* ===================================================== */}
        {/*  IZQUIERDA: BOTÓN + */}
        {/* ===================================================== */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white text-2xl shadow-lg transition"
          >
            <Plus size={26} />
          </button>

          {openMenu && (
            <div className="absolute left-0 mt-3 w-48 rounded-xl shadow-xl bg-white border animate-fadeIn z-50">
              <a href="/quotes/new" className="block px-4 py-2 hover:bg-gray-100">➕ New Quote</a>
              <a href="/jobs/new" className="block px-4 py-2 hover:bg-gray-100">🛠 New Job</a>
              <a href="/invoices/new" className="block px-4 py-2 hover:bg-gray-100">💵 New Invoice</a>
              <a href="/products/new" className="block px-4 py-2 hover:bg-gray-100">📦 New Product</a>
              <a href="/clients/new" className="block px-4 py-2 hover:bg-gray-100">👤 New Customer</a>
            </div>
          )}
        </div>

        {/* ===================================================== */}
        {/*  CENTRO: ICONOS DE NAVEGACIÓN */}
        {/* ===================================================== */}
        <nav className="flex items-center gap-10 text-gray-700">

          <NavItem icon={<Home size={22} />} label="Dashboard" href="/dashboard" active />

          <NavItem icon={<ListOrdered size={22} />} label="Jobs" href="/jobs" />

          <div className="relative">
            <NavItem icon={<CheckCircle2 size={22} />} label="Tasks" href="/tasks" />
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              1
            </span>
          </div>

          <NavItem icon={<Users size={22} />} label="Customers" href="/clients" />

          <NavItem icon={<Calculator size={22} />} label="Quotes" href="/quotes" />

          <NavItem icon={<ShoppingBag size={22} />} label="Orders" href="/orders" />
        </nav>

        {/* ===================================================== */}
        {/*  DERECHA: BARRA DE BUSQUEDA */}
        {/* ===================================================== */}
        <div className="relative w-60">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full border border-gray-300 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Animación fade */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.18s ease-out; }
      `}</style>
    </header>
  );
}

// =====================================================
// COMPONENTE DE ITEM DEL TOPBAR
// =====================================================
function NavItem({ icon, label, href, active }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center text-gray-700 hover:text-blue-600 transition relative"
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
      {active && (
        <span className="absolute -bottom-2 w-8 h-0.5 bg-blue-500 rounded-full"></span>
      )}
    </Link>
  );
}
