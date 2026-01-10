"use client";
import { useState } from "react";
import { X, Search } from "lucide-react";

export default function ProductSearchModal({ open, onClose, onSelect, products }) {
  const [search, setSearch] = useState("");

  if (!open) return null;

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold text-[#0EA5E9] mb-4">Select a Product</h2>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border border-[#E9EDF1] rounded-lg w-full focus:ring-2 focus:ring-[#0EA5E9] outline-none"
          />
        </div>

        <div className="max-h-64 overflow-y-auto divide-y divide-[#E9EDF1]">
          {filtered.length > 0 ? (
            filtered.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  onSelect(product);
                  onClose();
                }}
                className="p-3 hover:bg-[#F5F7F9] cursor-pointer flex justify-between"
              >
                <span>{product.name}</span>
                <span className="text-gray-500 text-sm">{product.templateType}</span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No results found</p>
          )}
        </div>
      </div>
    </div>
  );
}
