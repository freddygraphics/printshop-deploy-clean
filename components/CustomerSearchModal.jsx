"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";

export default function CustomerSearchModal({
  onSelect,
  onClose,
  onAddCustomer,
}) {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.trim().length < 2) {
      setCustomers([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/clients?search=${search}`);
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
      } catch {
        setCustomers([]);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(delay);
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">Select Customer</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* SEARCH */}
        <div className="p-5">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              autoFocus
              type="text"
              placeholder="Search customer by name or company..."
              className="w-full border-2 border-gray-300 focus:border-blue-600 rounded-lg pl-10 pr-4 py-3 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* RESULTS */}
        <div className="max-h-72 overflow-y-auto border-t">
          {loading && <p className="p-6 text-sm text-gray-500">Searching…</p>}

          {!loading && search.length < 2 && (
            <p className="p-6 text-sm text-gray-500">
              Type at least 2 characters to search
            </p>
          )}

          {!loading && search.length >= 2 && customers.length === 0 && (
            <p className="p-6 text-sm text-gray-500">No customers found</p>
          )}

          {customers.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                onSelect(c);
                onClose();
              }}
              className="px-6 py-4 cursor-pointer hover:bg-blue-50 transition border-b"
            >
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-gray-800">
                  {c.name}
                </span>
                <span className="text-sm text-gray-500">
                  {c.company || "Individual customer"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t bg-gray-50">
          <button
            onClick={() => {
              onClose();
              onAddCustomer(); // 🔥 ABRE CreateCustomerModal
            }}
            className="w-full flex items-center justify-center gap-2
              bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
          >
            <UserPlus size={18} />
            Add New Customer
          </button>
        </div>
      </div>
    </div>
  );
}
