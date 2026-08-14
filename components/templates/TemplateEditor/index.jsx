"use client";

import { useState } from "react";

import YardSign from "./YardSign";
import General from "./General";
import ProductOptions from "./ProductOptions";
import Pricing from "./Pricing";
import Inventory from "./Inventory";
import SaveBar from "./SaveBar";

export default function TemplateEditor({ template, onChange }) {
  const [saving, setSaving] = useState(false);

  const isYardSign =
    template.slug?.toLowerCase() === "yard-signs" ||
    template.name?.trim().toLowerCase() === "yard signs";

  async function saveTemplate() {
    try {
      setSaving(true);

      const payload = {
        ...template,

        configuration: {
          productOptions: template.optionGroups || [],
          pricing: template.quantityPricing || [],
          inventory: template.inventory || {},
          supplier: template.supplier || {},
          workflow: template.workflow || {},
          yardSign: template.yardSign || {},
        },
      };

      console.log("TEMPLATE", template);
      console.log("PAYLOAD", payload);

      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Error saving template");
      }

      const updated = await res.json();

      onChange({
        ...updated,

        optionGroups: updated.configuration?.productOptions || [],

        quantityPricing: updated.configuration?.pricing || [],

        inventory: updated.configuration?.inventory || {},

        supplier: updated.configuration?.supplier || {},

        workflow: updated.configuration?.workflow || {},

        yardSign: updated.configuration?.yardSign || {
          sizes: [],
          materials: [],
          printSides: [],
          stakes: [],
          packages: [],
        },
      });

      alert("✅ Template saved.");
    } catch (err) {
      console.error(err);

      alert("Error saving template.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <General template={template} onChange={onChange} />

      {isYardSign ? (
        <YardSign template={template} onChange={onChange} />
      ) : (
        <>
          <Pricing template={template} onChange={onChange} />

          <ProductOptions template={template} onChange={onChange} />

          <Inventory template={template} onChange={onChange} />
        </>
      )}

      <SaveBar saving={saving} onSave={saveTemplate} />
    </div>
  );
}
