"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import ProductTemplateSelector from "@/components/ProductTemplateSelector";
import ProductBuilder from "@/components/products/ProductBuilder/index";

export default function NewProductPage() {
  const router = useRouter();

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [category, setCategory] = useState("standard");

  async function handleSave(product) {
    try {
      const payload = {
        ...product,

        category: category === "standard" ? null : category,

        templateId: selectedTemplate.id,
        templateSlug: selectedTemplate.slug,
      };

      console.log("PRODUCT PAYLOAD:", payload);

      const res = await fetch("/api/products/from-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error saving product");
        return;
      }

      router.push("/settings/products");
    } catch (err) {
      console.error(err);
      alert("Unexpected error");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <Link
          href="/settings/products"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Back to Products
        </Link>
      </div>

      {!selectedTemplate ? (
        <ProductTemplateSelector
          embedded
          onSelect={(template) => {
            console.log("SELECTED TEMPLATE", template);
            setSelectedTemplate(template);
          }}
        />
      ) : (
        <>
          <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="max-w-md">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Product Type
              </label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="standard">Standard Product</option>
                <option value="stickers">Stickers</option>
                <option value="apparel">Apparel</option>
                <option value="raffle-tickets">Raffle Tickets</option>
              </select>

              <p className="mt-2 text-xs text-gray-500">
                This determines which configurator opens when the product is
                selected.
              </p>
            </div>
          </section>

          <ProductBuilder
            template={selectedTemplate}
            mode="new"
            onSave={handleSave}
          />
        </>
      )}
    </main>
  );
}
