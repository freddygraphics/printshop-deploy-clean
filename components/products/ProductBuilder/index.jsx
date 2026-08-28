"use client";

import { useEffect, useState } from "react";

import { normalizeOptionGroups } from "@/lib/product-builder/normalizeOptionGroups";

import TruckLetteringProduct from "./TruckLetteringProduct";
import SaveBar from "./SaveBar";
import { defaultSections } from "./sections";
import SectionRenderer from "./SectionRenderer";
import BuilderToolbar from "./BuilderToolbar";
import YardSignProduct from "./YardSignProduct";
const DEFAULT_VINYL_COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Black", value: "#231F20" },
  { name: "Red", value: "#FF0000" },
  { name: "Blue", value: "#10069F" },
  { name: "Cool Blue", value: "#009FE3" },
  { name: "Navy", value: "#080866" },
  { name: "Green", value: "#008A17" },
  { name: "Hunter", value: "#00520D" },
  { name: "Yellow", value: "#FFE500" },
  { name: "Orange", value: "#FF9200" },
  { name: "Maroon", value: "#A90000" },
  { name: "Charcoal", value: "#666666" },
];
export default function ProductBuilder({
  template = null,
  existingData = {},
  mode = "new",
  templateType,
  productType = "standard",
  onSave,
}) {
  const configuration =
    existingData.defaultOptions ||
    existingData.configuration ||
    template?.configuration ||
    {};

  const resolvedTemplate = template || existingData?.template || null;

  // ============================
  // PRODUCT TYPES
  // ============================

  const isYardSign =
    resolvedTemplate?.slug?.toLowerCase() === "yard-signs" ||
    resolvedTemplate?.name?.trim().toLowerCase() === "yard signs";

  const isTruckLettering =
    productType === "truck-lettering" ||
    existingData?.category === "truck-lettering" ||
    resolvedTemplate?.slug?.toLowerCase() === "truck-lettering" ||
    resolvedTemplate?.templateType === "truck-lettering";

  // ============================
  // DEFAULT TRUCK LETTERING
  // ============================

  const defaultTruckLettering = {
    enabled: isTruckLettering,

    lines: 1,

    lineSettings: [
      {
        id: "line1",
        label: "Line 1",
        placeholder: "USDOT 1234567",
        required: true,
      },
    ],

    font: "Arial Bold",

    availableFonts: ["Arial Bold", "Arial Black", "Impact", "Helvetica Bold"],

    defaultColor: "#000000",

    colors: DEFAULT_VINYL_COLORS,

    preview: {
      enabled: true,
      background: "#ffffff",
    },
  };

  // ============================
  // PRODUCT STATE
  // ============================

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

    // ============================
    // YARD SIGN
    // ============================

    yardSign: isYardSign
      ? configuration.yardSign || {
          sizes: [],
          materials: [],
          printSides: [],
          stakes: [],
          packages: [],
        }
      : null,

    // ============================
    // TRUCK LETTERING
    // ============================

    truckLettering: isTruckLettering
      ? {
          ...defaultTruckLettering,
          ...(configuration.truckLettering || {}),

          // Siempre usar la lista estándar actual
          colors: DEFAULT_VINYL_COLORS,
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
  });

  // ============================
  // LOAD TEMPLATE
  // ============================

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

      truckLettering: isTruckLettering
        ? {
            ...defaultTruckLettering,
            ...(template.configuration?.truckLettering || {}),
            colors: DEFAULT_VINYL_COLORS,
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

  // ============================
  // SECTIONS
  // ============================

  const [sections, setSections] = useState(defaultSections);

  useEffect(() => {
    setSections(defaultSections);
  }, []);

  // ============================
  // UPDATE PRODUCT
  // ============================

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

  // ============================
  // RENDER
  // ============================

  return (
    <div className="space-y-8">
      {/* BUILDER TOOLBAR */}

      {mode === "builder" && (
        <BuilderToolbar sections={sections} onToggleSection={toggleSection} />
      )}

      {/* IMAGE + GENERAL INFO */}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
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

      {/* ============================
          SPECIAL PRODUCT CONFIGURATORS
      ============================ */}

      {isYardSign ? (
        <YardSignProduct product={product} update={update} />
      ) : (
        <>
          {/* TRUCK LETTERING */}

          {isTruckLettering && (
            <TruckLetteringProduct product={product} update={update} />
          )}

          {/* PRICING */}

          {sections.pricing && (
            <SectionRenderer
              section="pricing"
              product={product}
              update={update}
            />
          )}

          {/* OPTIONS */}

          {sections.options && (
            <SectionRenderer
              section="options"
              product={product}
              update={update}
            />
          )}

          {/* MEASUREMENTS */}

          {sections.measurements && (
            <SectionRenderer
              section="measurements"
              product={product}
              update={update}
            />
          )}

          {/* INVENTORY */}

          {sections.inventory && (
            <SectionRenderer
              section="inventory"
              product={product}
              update={update}
            />
          )}

          {/* SUPPLIER */}

          {sections.supplier && (
            <SectionRenderer
              section="supplier"
              product={product}
              update={update}
            />
          )}
        </>
      )}

      {/* ============================
          SAVE
      ============================ */}

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

              ...(isTruckLettering
                ? {
                    truckLettering: product.truckLettering,
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
