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
  existingData = {},
  mode = "new",
  templateType,
  productType = "standard",
  onSave,
}) {
  const configuration =
    existingData.defaultOptions || existingData.configuration || {};

  // ============================
  // PRODUCT TYPES
  // ============================

  const normalizedProductType = String(
    productType || existingData.productType || existingData.templateType || "",
  )
    .trim()
    .toLowerCase();

  const normalizedCategory = String(existingData.category || "")
    .trim()
    .toLowerCase();

  const normalizedTemplateType = String(
    templateType || existingData.templateType || "",
  )
    .trim()
    .toLowerCase();

  const isYardSign =
    normalizedProductType === "yard-sign" ||
    normalizedProductType === "yard-signs" ||
    normalizedCategory === "yard-sign" ||
    normalizedCategory === "yard-signs" ||
    normalizedTemplateType === "yard-sign" ||
    normalizedTemplateType === "yard-signs" ||
    normalizedTemplateType === "large-format";

  const isTruckLettering =
    normalizedProductType === "truck-lettering" ||
    normalizedCategory === "truck-lettering" ||
    normalizedTemplateType === "truck-lettering";

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
  // RESET FROM PRODUCT DATA
  // ============================

  useEffect(() => {
    const nextConfiguration =
      existingData.defaultOptions || existingData.configuration || {};

    setProduct((prev) => ({
      ...prev,

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

      quantityPricing: nextConfiguration.pricing || [
        {
          minQty: 1,
          maxQty: null,
          unitPrice: 0,
        },
      ],

      optionGroups: normalizeOptionGroups(
        nextConfiguration.productOptions || [],
      ),

      yardSign: isYardSign
        ? nextConfiguration.yardSign || {
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
            ...(nextConfiguration.truckLettering || {}),
            colors: DEFAULT_VINYL_COLORS,
          }
        : null,

      inventory: nextConfiguration.inventory || {},
      supplier: nextConfiguration.supplier || {},
      metadata: nextConfiguration.metadata || {},

      measurements: nextConfiguration.measurements || {
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
    }));
  }, [existingData, isYardSign, isTruckLettering]);

  // ============================
  // SECTIONS
  // ============================

  const [sections, setSections] = useState(
    configuration.sections || defaultSections,
  );

  useEffect(() => {
    setSections(configuration.sections || defaultSections);
  }, [configuration.sections]);

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
      {mode === "builder" && (
        <BuilderToolbar sections={sections} onToggleSection={toggleSection} />
      )}

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

      {isYardSign ? (
        <YardSignProduct product={product} update={update} />
      ) : (
        <>
          {isTruckLettering && (
            <TruckLetteringProduct product={product} update={update} />
          )}

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
