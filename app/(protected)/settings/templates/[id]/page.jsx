"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TemplateEditor from "@/components/templates/TemplateEditor";

export default function EditTemplatePage() {
  const { id } = useParams();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplate();
  }, [id]);

  async function loadTemplate() {
    try {
      const res = await fetch(`/api/templates/${id}`);

      if (!res.ok) {
        throw new Error("Template not found");
      }

      const data = await res.json();

      setTemplate({
        ...data,

        optionGroups: data.configuration?.productOptions || [],

        quantityPricing: data.configuration?.pricing || [],

        inventory: data.configuration?.inventory || {},

        supplier: data.configuration?.supplier || {},

        workflow: data.configuration?.workflow || {},

        yardSign: data.configuration?.yardSign || {
          sizes: [],
          materials: [],
          printSides: [],
          stakes: [],
          packages: [],
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading template...</div>;
  }

  if (!template) {
    return <div className="p-8 text-red-500">Template not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <TemplateEditor template={template} onChange={setTemplate} />
    </div>
  );
}
