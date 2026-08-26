"use client";

import { useState, useEffect } from "react";
import { normalizeOptionGroups } from "@/lib/product-builder/normalizeOptionGroups";

import SaveBar from "./SaveBar";
import { defaultSections } from "./sections";
import SectionRenderer from "./SectionRenderer";
import BuilderToolbar from "./BuilderToolbar";
import YardSignProduct from "./YardSignProduct";

export default function ProductBuilder({
  template = null,
  existingData = {},
  mode = "new",
  templateType,
  onSave,
}) {
  const configuration =
    existingData.defaultOptions ||
    existingData.configuration ||
    template?.configuration ||
    {};

  const resolvedTemplate = template || existingData?.template || null;

  const isYardSign =
    resolvedTemplate?.slug?.toLowerCase() === "yard-signs" ||
    resolvedTemplate?.name?.trim().toLowerCase() === "yard signs";
  const [product, setProduct] = useState({
    image: existingData.image || "",

    images:
      existingData.images?.length > 0
        ? existingData.images
        : existingData.image
          ? [
              {
                url: existingData.image,
                position: 0,
                isPrimary: true,
              },
            ]
          : [],

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

    yardSign: isYardSign
      ? configuration.yardSign || {
          sizes: [],
          materials: [],
          printSides: [],
          stakes: [],
          packages: [],
        }
      : null,

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

      yardSign: isYardSign
        ? template.configuration?.yardSign || {
            sizes: [],
            materials: [],
            printSides: [],
            stakes: [],
            packages: [],
          }
        : null,

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
  }, [template, mode]);

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

      {/* IMAGE + GENERAL INFO */}
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

      {/* YARD SIGNS */}
      {isYardSign ? (
        <YardSignProduct product={product} update={update} />
      ) : (
        <>
          {/* NORMAL PRODUCTS */}
          {sections.pricing && (
            <SectionRenderer
              section="pricing"
              product={product}
              update={update}
            />
          )}

          {sections.options && (
            <SectionRenderer
              section="options"
              product={product}
              update={update}
            />
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
            <SectionRenderer
              section="supplier"
              product={product}
              update={update}
            />
          )}
        </>
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

              ...(isYardSign
                ? {
                    yardSign: product.yardSign,
                  }
                : {}),

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
