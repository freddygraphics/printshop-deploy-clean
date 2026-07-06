"use client";

import ProductTemplateCard from "./ProductTemplateCard";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProductTemplateSelector({
  open = true,
  onClose,
  onSelect,
  embedded = false,
}) {
  if (!embedded && !open) return null;

  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const res = await fetch("/api/templates");

      const data = await res.json();

      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }

  // ===== MODO PÁGINA =====
  if (embedded) {
    return (
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Select Product Template
        </h2>

        <p className="text-gray-500 mb-6">
          Choose the template that best matches the product you want to create.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <ProductTemplateCard
              key={template.id}
              template={template}
              onSelect={() => onSelect(template)}
            />
          ))}
        </div>
      </div>
    );
  }

  // ===== MODO MODAL (actual) =====
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl shadow-xl w-[95%] max-w-3xl p-6 border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Select Template
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
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
