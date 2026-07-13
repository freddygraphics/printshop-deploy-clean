"use client";

import { Search } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search job, invoice or client...",
}) {
  return (
    <div className="mt-5 bg-white border rounded-2xl p-4 shadow-sm">
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

        <input
          className="w-full pl-10 pr-4 py-2 border rounded-xl"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
