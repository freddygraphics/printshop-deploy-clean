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
      const payload = {
        ...product,
        templateId: selectedTemplate.id,
        templateSlug: selectedTemplate.slug,
      };

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

      router.push("/products");
    } catch (err) {
      console.error(err);
      alert("Unexpected error");
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* HEADER */}

      <div className="mb-8">
        <Link
          href="/products"
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
        <ProductBuilder
          template={selectedTemplate}
          mode="new"
          onSave={handleSave}
        />
      )}
    </main>
  );
}
