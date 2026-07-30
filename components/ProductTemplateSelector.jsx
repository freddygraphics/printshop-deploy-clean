"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import ProductTemplateCard from "./ProductTemplateCard";

const RAFFLE_TICKET_TEMPLATE = {
  id: "raffle-tickets",
  name: "Raffle Tickets",
  slug: "raffle-tickets",
  templateType: "raffle-tickets",
  description: "Custom numbered, perforated and booklet raffle tickets.",
};

export default function ProductTemplateSelector({
  open = true,
  onClose,
  onSelect,
  embedded = false,
}) {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const res = await fetch("/api/templates", {
        cache: "no-store",
      });

      const data = await res.json();
      const loadedTemplates = Array.isArray(data) ? data : [];

      const raffleExists = loadedTemplates.some(
        (template) =>
          template.slug === "raffle-tickets" ||
          template.templateType === "raffle-tickets",
      );

      setTemplates(
        raffleExists
          ? loadedTemplates
          : [...loadedTemplates, RAFFLE_TICKET_TEMPLATE],
      );
    } catch (err) {
      console.error("Error loading templates:", err);

      // Raffle Tickets seguirá visible aunque falle la API
      setTemplates([RAFFLE_TICKET_TEMPLATE]);
    }
  }

  // Debe estar después de los hooks
  if (!embedded && !open) return null;

  // ==========================================================
  // MODO PÁGINA
  // ==========================================================
  if (embedded) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-2 text-2xl font-semibold text-gray-900">
          Select Product Template
        </h2>

        <p className="mb-6 text-gray-500">
          Choose the template that best matches the product you want to create.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

  // ==========================================================
  // MODO MODAL
  // ==========================================================
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[95%] max-w-3xl rounded-xl border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Select Template
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-red-500"
            aria-label="Close template selector"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <ProductTemplateCard
              key={template.id}
              template={template}
              onSelect={() => onSelect(template)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
