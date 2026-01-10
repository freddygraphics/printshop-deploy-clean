"use client";
import { useEffect, useState } from "react";

export default function DiscountModal({
  open,
  onClose,
  discounts = [],
  selectedDiscounts = [], // descuentos aplicados (del parent)
  setSelectedDiscounts, // setter del parent (solo al presionar Apply)
  onApply, // normalmente cierra el modal
}) {
  if (!open) return null;

  // ✅ draftSelected es UN SOLO descuento (objeto) o null
  const [draftSelected, setDraftSelected] = useState(null);
  const [customName, setCustomName] = useState("");
  const [customValue, setCustomValue] = useState("");

  // ✅ al abrir el modal, copiar lo aplicado -> draft
  useEffect(() => {
    if (!open) return;

    setDraftSelected(selectedDiscounts?.[0] || null);
    setCustomName("");
    setCustomValue("");
  }, [open, selectedDiscounts]);

  // ✅ seleccionar descuento (solo cambia draft)
  const selectDiscount = (discount) => {
    setDraftSelected(discount);
  };

  // ✅ aplicar al invoice (aquí sí cambia totals)
  const handleApply = () => {
    // 🔥 PRIORIDAD: Custom Discount
    if (customValue && Number(customValue) > 0) {
      setSelectedDiscounts([
        {
          id: `custom-${Date.now()}`, // ID único
          name: customName?.trim() || "",
          type: "percent",
          value: Number(customValue),
        },
      ]);

      onApply?.();
      return;
    }

    // ✅ Si no hay custom, aplicar el seleccionado
    setSelectedDiscounts(draftSelected ? [draftSelected] : []);
    onApply?.();
  };

  // (opcional) quitar descuento
  const clearDraft = () => setDraftSelected(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* HEADER */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Apply Discount
          </h2>

          {/* opcional: clear */}
          <button
            type="button"
            onClick={clearDraft}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 py-4 space-y-3">
          {discounts.length === 0 && (
            <p className="text-sm text-gray-500">No discounts available</p>
          )}

          {/* LISTA DE DESCUENTOS */}
          <div className="space-y-2">
            {discounts.map((discount) => {
              const discountId = String(discount.id);
              const activeId = draftSelected ? String(draftSelected.id) : null;

              const isActive = activeId === discountId;

              return (
                <div
                  key={discountId}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    selectDiscount({ ...discount, id: discountId })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      selectDiscount({ ...discount, id: discountId });
                  }}
                  className={`cursor-pointer rounded-lg border p-4 transition
        ${
          isActive
            ? "border-blue-600 bg-blue-50"
            : "border-gray-200 hover:bg-gray-50"
        }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-800">
                        {discount.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {discount.type === "percent"
                          ? `${discount.value}%`
                          : `$${discount.value}`}
                      </p>
                    </div>

                    <div
                      className={`mt-1 h-4 w-4 rounded-full border flex items-center justify-center
            ${isActive ? "border-blue-600" : "border-gray-300"}`}
                    >
                      {isActive && (
                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CUSTOM DISCOUNT */}
          <div className="border-t pt-4 mt-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-800">
              Custom Discount
            </h4>

            <input
              type="text"
              placeholder="Discount name (optional)"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />

            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="%"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={customValue}
                onChange={(e) => {
                  setCustomValue(e.target.value);
                  setDraftSelected(null); // 👈 limpia selección previa (UX FIX)
                }}
              />
            </div>

            {/* preview del custom seleccionado */}
            {draftSelected?.id === "custom" && (
              <p className="text-xs text-blue-700">
                Selected: {draftSelected.name} ({draftSelected.value}%)
              </p>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Apply Discount
          </button>
        </div>
      </div>
    </div>
  );
}
