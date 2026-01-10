"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

// Modal wrapper
import ModalPortal from "./ModalPortal";

// Templates
import CommercialPrintingTemplate from "@/app/templates/CommercialPrintingTemplate";
import LargeFormatTemplate from "@/app/templates/LargeFormatTemplate";

export default function ProductModal({ open, onClose, product, mode = "new", onSave }) {
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
    console.log("🔥 FETCHING: /api/products/from-template");

    const res = await fetch("/api/products/from-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error saving product");
      return;
    }

    // 🔥 Mensaje bonito
    alert("Producto guardado con éxito!");

    // 🔥 Enviar producto nuevo al padre (ProductsPage)
    if (onSave) onSave(data);

    // 🔥 Cerrar modal automáticamente
    onClose();

  } catch (err) {
    console.error("❌ Error saving product:", err);
    alert("Error inesperado");
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

      default:
        return (
          <p className="text-gray-500 text-center">
            Select a product template
          </p>
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
          <div className="p-6">
            {renderTemplate()}
          </div>

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
