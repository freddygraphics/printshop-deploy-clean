"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import ProductBuilder from "@/components/products/ProductBuilder";

export default function NewTemplatePage() {
  const router = useRouter();

  async function handleSaveTemplate(templateData) {
    const payload = {
      name: templateData.name,
      slug:
        templateData.slug ||
        templateData.name?.toLowerCase().replace(/\s+/g, "-"),
      description: templateData.description || "",
      icon: templateData.icon || "",

      configuration: templateData.configuration || {
        sections: {},
        productOptions: [],
        pricing: [],
        inventory: {},
        supplier: {},
        metadata: {},
      },

      fields: templateData.fields || [],
      options: templateData.options || [],
    };

    const res = await fetch("/api/templates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error creating template");
      return;
    }

    router.push("/settings/templates");
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">New Template</h1>
        <p className="text-gray-500 mt-1">
          Create a reusable product template.
        </p>
      </div>

      <ProductBuilder mode="builder" onSave={handleSaveTemplate} />
    </div>
  );
}
