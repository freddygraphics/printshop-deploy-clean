"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import RaffleTicketCalculator from "@/components/RaffleTicketCalculator";
// Modal wrapper
import ModalPortal from "./ModalPortal";
import ProductBuilder from "@/components/products/ProductBuilder";
// Templates
import CommercialPrintingTemplate from "@/app/templates/CommercialPrintingTemplate";
import LargeFormatTemplate from "@/app/templates/LargeFormatTemplate";
import SignsTemplate from "@/app/templates/SignsTemplate";

export default function ProductModal({
  open,
  onClose,
  product,
  mode = "new",
  onSave,
}) {
  const isEdit = mode === "edit";

  const [data, setData] = useState(null);

  // ---------------------------------------------
  // Inicializar datos según "new" o "edit"
  // ---------------------------------------------

  useEffect(() => {
    if (!open) return;

    if (product) {
      // EDITAR
      setData(product);
    } else {
      // NUEVO
      setData({
        name: "",
        templateType: "commercial-printing",
        customFields: {},
        defaultOptions: {},
        price: 0,
        basePrice: 0,
      });
    }
  }, [open, product]);

  if (!open || !data) return null;

  // ---------------------------------------------
  // GUARDAR EN BASE DE DATOS
  // ---------------------------------------------
  // --------------------
  // GUARDAR PRODUCTO
  // --------------------
  const handleSave = async (updated) => {
    try {
      const isEdit = mode === "edit";

      const payload = {
        ...data,
        ...updated,
        templateType: data.templateType, // 🔥 GARANTIZADO
      };

      const url = isEdit
        ? `/api/products/${payload.id}`
        : "/api/products/from-template";

      const method = isEdit ? "PUT" : "POST";

      console.log("🔥 PAYLOAD FINAL:", payload);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const saved = await res.json();

      if (!res.ok) {
        alert(saved.error || "Error saving product");
        return;
      }

      if (onSave) onSave(saved);
      onClose();
    } catch (err) {
      console.error("❌ Error saving product:", err);
      alert("Unexpected error");
    }
  };

  // ---------------------------------------------
  // Render del template
  // ---------------------------------------------
  const renderTemplate = () => {
    const props = {
      existingData: data,
      mode,
      onSave: handleSave,
    };

    switch (data.templateType) {
      case "commercial-printing":
        return <CommercialPrintingTemplate {...props} />;

      case "large-format":
        return <LargeFormatTemplate {...props} />;

      case "signs":
        return <ProductBuilder {...props} />;
      case "raffle-tickets":
        return <RaffleTicketCalculator {...props} />;
      default:
        return (
          <p className="text-gray-500 text-center">Select a product template</p>
        );
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-xl shadow-xl w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto animate-fadeIn border border-gray-200">
          {/* HEADER */}
          <div className="flex justify-between items-center border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === "edit"
                ? "Edit Product"
                : mode === "view"
                  ? "View Product"
                  : "New Product"}
            </h2>

            <button
              onClick={onClose}
              className="text-gray-500 hover:text-red-500 transition"
            >
              <X size={22} />
            </button>
          </div>

          {/* BODY */}
          <div className="p-6">{renderTemplate()}</div>
        </div>

        {/* Animation */}
        <style jsx>{`
          .animate-fadeIn {
            animation: fadeIn 0.25s ease-out;
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.96);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </ModalPortal>
  );
}
