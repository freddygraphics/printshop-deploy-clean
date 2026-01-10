"use client";

import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";

export default function CustomerSelectModal({ open, onClose, onSelect }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (search.trim().length < 1) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      const res = await fetch(`/api/clients/search?q=${search}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    }, 300);

    return () => clearTimeout(delay);
  }, [search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6 relative">

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Select Customer
        </h2>

        {/* SEARCH */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="pl-10 border rounded-md w-full py-2 px-3"
          />
        </div>

        {/* RESULTS */}
        <div className="max-h-80 overflow-y-auto border rounded-md">
          {results.length === 0 ? (
            <p className="p-4 text-gray-500 text-sm text-center">
              No customers found.
            </p>
          ) : (
            results.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  onSelect(c);
                  onClose();
                }}
                className="p-3 border-b cursor-pointer hover:bg-gray-100"
              >
                <p className="font-medium text-gray-800">{c.name}</p>
                <p className="text-sm text-gray-500">{c.email}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
