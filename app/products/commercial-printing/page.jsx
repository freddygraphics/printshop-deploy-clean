"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CommercialPrintingTemplate from "../../templates/CommercialPrintingTemplate";

export default function CommercialPrintingPage() {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // 🔹 Función para guardar producto en la base de datos
  const handleSave = async (details) => {
    try {
      setSaving(true);
      setMessage("Guardando producto...");

      const payload = {
        template_id: 1, // usa el ID real del template (por ejemplo 1 = Commercial Printing)
        name: details?.name || "Commercial Printing - Custom",
        custom_fields: details,
      };

      console.log("🟢 Enviando producto a API:", payload);

      const res = await fetch("/api/products/from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.id) {
        console.log("✅ Producto guardado en Neon:", data);
        setMessage(`✅ Producto "${data.name}" guardado correctamente`);
      } else {
        console.error("❌ Error al guardar:", data);
        setMessage("❌ Error al guardar el producto");
      }
    } catch (err) {
      console.error("⚠️ Error de conexión:", err);
      setMessage("⚠️ No se pudo conectar con el servidor");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F7F9] py-24 px-6 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        {/* Botón volver */}
        <div className="flex items-center mb-4">
          <Link
            href="/products"
            className="flex items-center text-[#0EA5E9] hover:text-[#0284C7] font-medium transition"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Products
          </Link>
        </div>

        {/* Template del producto */}
        <CommercialPrintingTemplate
          mode="product"
          onSave={handleSave} // ✅ Conecta con la API
        />

        {/* Estado visual */}
        {saving && (
          <p className="text-sm text-cyan-600 mt-4 animate-pulse">
            💾 Guardando producto...
          </p>
        )}
        {message && (
          <p className="text-cyan-700 font-medium mt-4">{message}</p>
        )}
      </div>
    </main>
  );
}
