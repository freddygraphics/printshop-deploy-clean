"use client";

import { useState, useEffect } from "react";
import { normalizeOptionGroups } from "@/lib/product-builder/normalizeOptionGroups";
import SaveBar from "./SaveBar";
import { defaultSections } from "./sections";
import SectionRenderer from "./SectionRenderer";
import BuilderToolbar from "./BuilderToolbar";

export default function ProductBuilder({
  template = null,
  existingData = {},
  mode = "new",
  templateType,
  onSave,
}) {
  // SIEMPRE priorizar el producto.
  const configuration =
    existingData.defaultOptions ||
    existingData.configuration ||
    template?.configuration ||
    {};
  console.log("PRODUCT", existingData);

  console.log("DEFAULT OPTIONS", existingData.defaultOptions);

  console.log("CONFIGURATION", configuration);

  console.log("PRODUCT OPTIONS", configuration.productOptions);
  const [product, setProduct] = useState({
    image: existingData.image || "",

    name: existingData.name || "",

    sku: existingData.sku || "",

    description: existingData.description || "",

    quantityPricing: configuration.pricing || [
      {
        minQty: 1,
        maxQty: null,
        unitPrice: 0,
      },
    ],

    optionGroups: normalizeOptionGroups(configuration.productOptions || []),

    inventory: configuration.inventory || {},

    supplier: configuration.supplier || {},

    metadata: configuration.metadata || {},
    measurements: configuration.measurements || {
      enabled: false,

      width: {
        enabled: true,
        label: "Width",
        default: "",
      },

      height: {
        enabled: true,
        label: "Height",
        default: "",
      },
    },
  });

  useEffect(() => {
    if (!template || mode === "edit") return;

    setProduct((prev) => ({
      ...prev,

      quantityPricing: template.configuration?.pricing || [],

      optionGroups: normalizeOptionGroups(
        template.configuration?.productOptions || [],
      ),

      inventory: template.configuration?.inventory || {},

      measurements: template.configuration?.measurements || {
        enabled: false,

        width: {
          enabled: true,
          label: "Width",
          unit: "in",
          default: "",
        },

        height: {
          enabled: true,
          label: "Height",
          unit: "in",
          default: "",
        },
      },

      supplier: template.configuration?.supplier || {},

      metadata: template.configuration?.metadata || {},
    }));
  }, [template]);

  const [sections, setSections] = useState(defaultSections);

  useEffect(() => {
    setSections(defaultSections);
  }, []);

  function update(values) {
    setProduct((prev) => ({
      ...prev,
      ...values,
    }));
  }

  function toggleSection(section) {
    setSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  return (
    <div className="space-y-8">
      {mode === "builder" && (
        <BuilderToolbar sections={sections} onToggleSection={toggleSection} />
      )}

      {/* Primera fila */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {sections.image && (
          <div className="lg:col-span-1">
            <SectionRenderer
              section="image"
              product={product}
              update={update}
            />
          </div>
        )}

        {sections.header && (
          <div className="lg:col-span-2">
            <SectionRenderer
              section="header"
              product={product}
              update={update}
            />
          </div>
        )}
      </div>

      {/* Resto de secciones */}
      {sections.pricing && (
        <SectionRenderer section="pricing" product={product} update={update} />
      )}

      {sections.options && (
        <SectionRenderer section="options" product={product} update={update} />
      )}
      {sections.measurements && (
        <SectionRenderer
          section="measurements"
          product={product}
          update={update}
        />
      )}
      {sections.inventory && (
        <SectionRenderer
          section="inventory"
          product={product}
          update={update}
        />
      )}

      {sections.supplier && (
        <SectionRenderer section="supplier" product={product} update={update} />
      )}

      <SaveBar
        mode={mode}
        product={product}
        templateType={templateType}
        onSave={() =>
          onSave({
            ...product,

            configuration: {
              sections,

              productOptions: product.optionGroups,

              pricing: product.quantityPricing,

              inventory: product.inventory,

              supplier: product.supplier,
              measurements: product.measurements,
              metadata: product.metadata,
            },
          })
        }
      />
    </div>
  );
}
