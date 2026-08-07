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

  async function handleSave(product) {
    try {
      if (!selectedTemplate) {
        alert("Select a product template first.");
        return;
      }

      const numericTemplateId = Number(selectedTemplate?.id);

      const templateSlug =
        selectedTemplate?.slug ||
        selectedTemplate?.templateType ||
        selectedTemplate?.type ||
        product?.templateType ||
        null;

      const category =
        templateSlug === "stickers"
          ? "stickers"
          : templateSlug === "apparel"
            ? "apparel"
            : templateSlug === "raffle-tickets"
              ? "raffle-tickets"
              : product?.category || null;

      const payload = {
        ...product,

        category,

        templateId:
          Number.isInteger(numericTemplateId) && numericTemplateId > 0
            ? numericTemplateId
            : null,

        templateSlug,

        templateType: templateSlug,
      };

      console.log("PRODUCT CREATE PAYLOAD:", payload);

      const res = await fetch("/api/products/from-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();

      let data = null;

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error("API returned non-JSON response:", responseText);
        }
      }

      if (!res.ok) {
        alert(data?.error || `Error saving product (${res.status})`);
        return;
      }

      router.push("/settings/products");
      router.refresh();
    } catch (err) {
      console.error("Unexpected product creation error:", err);

      alert(err instanceof Error ? err.message : "Unexpected error");
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
            console.log("SELECTED TEMPLATE:", template);

            setSelectedTemplate(template);
          }}
        />
      ) : (
        <ProductBuilder
          template={selectedTemplate}
          mode="new"
          onSave={handleSave}
        />
      )}
    </main>
  );
}
