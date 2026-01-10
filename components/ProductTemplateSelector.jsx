"use client";

import ProductTemplateCard from "./ProductTemplateCard";
import { X } from "lucide-react";

export default function ProductTemplateSelector({ open, onClose, onSelect }) {
  if (!open) return null;

  const templates = [
    {
      id: "commercial-printing",
      name: "Commercial Printing",
      description: "Business cards, flyers, postcards, brochures, etc."
    },
    {
      id: "large-format",
      name: "Large Format",
      description: "Banners, posters, signs, decals, wall wraps, etc."
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl shadow-xl w-[95%] max-w-3xl p-6 border">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Select Template</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 md-grid-cols-2 gap-4">
          {templates.map(t => (
            <ProductTemplateCard
              key={t.id}
              template={t}
              onSelect={() => onSelect(t.id)}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
