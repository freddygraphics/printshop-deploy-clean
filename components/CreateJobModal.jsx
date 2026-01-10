"use client";

import { useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";

export default function CreateJobModal({
  invoice,
  items = [],
  onCreate,
  onClose,
}) {
  const modalRef = useRef(null);

  // cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const itemCount = items.length;
  const totalQty = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.qty || 0), 0),
    [items]
  );

  const handleCreate = () => {
    // 👇 NO enviamos datos
    onCreate?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div
        ref={modalRef}
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create Job</h2>
            <p className="text-xs text-gray-500">
              Invoice #{invoice?.invoiceNumber ?? "—"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg border bg-white hover:bg-gray-100 flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-700">
            This action will create a production job for this invoice. All items
            will be sent to the Production Board.
          </p>

          {/* SUMMARY */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-xl p-4">
              <p className="text-xs text-gray-500">Items</p>
              <p className="text-lg font-semibold">{itemCount}</p>
            </div>
            <div className="border rounded-xl p-4">
              <p className="text-xs text-gray-500">Total Quantity</p>
              <p className="text-lg font-semibold">{totalQty}</p>
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
            ⚠️ A job can only be created once per invoice.
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border bg-white hover:bg-gray-100 text-sm font-medium"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow"
          >
            Create Job
          </button>
        </div>
      </div>
    </div>
  );
}
