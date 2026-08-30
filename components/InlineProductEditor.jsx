"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { memo } from "react";

import { calculateOptionPricing } from "@/lib/product-builder/pricing";
import { normalizeOptionGroups } from "@/lib/product-builder/normalizeOptionGroups";
import RaffleTicketCalculator from "@/components/RaffleTicketCalculator";
import ProductConfigurator from "@/components/products/ProductConfigurator";
import ConfigurableTemplateEditor from "@/components/invoice/ConfigurableTemplateEditor";
import SinaliteConfigurator from "@/components/SinaliteConfigurator";

function unitLabel(unit) {
  switch (unit) {
    case "ft":
      return "ft";
    case "cm":
      return "cm";
    case "mm":
      return "mm";
    default:
      return "in";
  }
}
function InlineProductEditor({
  product,
  data,
  onChange,
  onClose,
  autoCalculateOnMount = false,
}) {
  // ======================================================
  // RESOLVE PRODUCT
  // Para Apparel cargado desde Invoice, product puede venir null.
  // En ese caso recuperamos la prenda SanMar guardada en options.
  // ======================================================
  const effectiveProduct =
    product || data?.product || data?.options?.apparelProduct || null;

  const savedProductType = String(data?.options?.productType || "")
    .trim()
    .toLowerCase();

  const isManual = !effectiveProduct && savedProductType !== "apparel";
  const configuration =
    effectiveProduct?.configuration || effectiveProduct?.defaultOptions || {};

  console.log("DEFAULT OPTIONS");
  console.log(configuration);

  console.log("configuration", configuration);
  console.log("configuration.pricing", configuration.pricing);
  console.log("isArray", Array.isArray(configuration.pricing));
  const optionGroups = normalizeOptionGroups(
    configuration.productOptions || [],
  );

  const pricingRows = configuration.pricing ?? [];

  console.log("pricingRows", pricingRows);

  const inventory = configuration.inventory ?? {};

  const supplier = configuration.supplier ?? {};
  const measurements = configuration.measurements ?? {};

  // ------------------------------------------
  // SAFE INITIAL VALUES
  // ------------------------------------------
  const [finishes, setFinishes] = useState([]);
  const [selectedFinishes, setSelectedFinishes] = useState({});

  const [widthIn, setWidthIn] = useState(data.options?.width || "");
  const [heightIn, setHeightIn] = useState(data.options?.height || "");
  const [unit, setUnit] = useState(data.options?.unit || "in");
  const [materialId, setMaterialId] = useState(data.options?.materialId || "");

  const [materials, setMaterials] = useState([]);
  useEffect(() => {
    setUnit(data.options?.unit || "in");
  }, [data.options?.unit]);

  const opts = data?.options || {};
  const safe = {
    description: data?.name ?? "",
    qty: Number(data?.qty ?? 1),
    unitPrice: Number(data?.unitPrice ?? 0),

    subtotal: Number(data?.total ?? 0),
    total: Number(data?.total ?? 0),

    discountType: data?.discountType ?? null,
    discountValue: data?.discountValue ?? null,
    discountReason: data?.discountReason ?? "",

    dynamicOptions:
      opts.dynamicOptions ??
      optionGroups.reduce((acc, group) => {
        if (!group.key) return acc;

        if (group.type === "checkbox") {
          acc[group.key] = false;
        } else {
          const first =
            group.values.find((v) => v.default)?.key ??
            group.values[0]?.key ??
            "";

          acc[group.key] = first;
        }

        return acc;
      }, {}),
  };

  const [local, setLocal] = useState(safe);

  useEffect(() => {
    fetch("/api/finishes")
      .then((r) => r.json())
      .then(setFinishes)
      .catch(console.error);
  }, []);

  // Reset when data changes
  // -----------------------------------------------------
  // RESET LOCAL STATE AL CAMBIAR DATA
  // -----------------------------------------------------
  useEffect(() => {
    if (data?.options?.pricingMode !== "sqft") return;

    fetch("/api/materials")
      .then((r) => r.json())
      .then(setMaterials)
      .catch(console.error);
  }, [data?.options?.pricingMode]);

  useEffect(() => {
    if (!data?._expanded) return;

    const opts = data.options || {};

    setLocal({
      description: data?.name ?? "",
      qty: Number(data?.qty ?? 1),
      unitPrice: Number(data?.unitPrice ?? 0),

      subtotal: Number(data?.total ?? 0),
      total: Number(data?.total ?? 0),

      discountType: data?.discountType ?? null,
      discountValue: data?.discountValue ?? null,
      discountReason: data?.discountReason ?? "",

      dynamicOptions: opts.dynamicOptions || {},
    });

    setWidthIn(opts.width || "");
    setHeightIn(opts.height || "");
    setUnit(opts.unit || "in");
  }, [data]);

  // -----------------------------------------------------
  // 🔥 FIX: AUTO-CALCULAR AL ABRIR CONFIGURABLE
  // -----------------------------------------------------
  // -----------------------------------------------------
  // 🔥 AUTO-RECALCULAR SOLO AL ABRIR, PERO RESPETANDO QTY EXISTENTE
  // -----------------------------------------------------
  useEffect(() => {
    // En /products se utiliza el efecto nuevo.
    if (autoCalculateOnMount) return;

    // Se conserva el mismo cálculo de Invoice.
    if (
      !isManual &&
      !isSpecialProduct &&
      !isSinalite &&
      data._expanded === true
    ) {
      const firstQty =
        pricingRows.length > 0 ? Number(pricingRows[0].minQty) : local.qty;

      const shouldForceFirstQty =
        data.qty === 1 || data.qty === 0 || data.qty === undefined;

      recalcConfigured({
        qty: shouldForceFirstQty ? firstQty : data.qty,
        dynamicOptions: local.dynamicOptions,
      });
    }
  }, [data._expanded, autoCalculateOnMount]);
  const latestSpecialItemRef = useRef(null);
  const [specialDraft, setSpecialDraft] = useState(null);

  useEffect(() => {
    latestSpecialItemRef.current = null;
    setSpecialDraft(null);
  }, [data?.id]);
  // ------------------------------------------
  // MANUAL UPDATE
  // ------------------------------------------
  const updateManual = (patch = {}) => {
    const updated = { ...local, ...patch };
    const subtotal = Number(updated.qty) * Number(updated.unitPrice);

    const total = applyDiscount(subtotal, updated);

    const final = { ...updated, subtotal, total };

    setLocal(final);
  };

  const handleManualDone = () =>
    onChange({
      ...local,
      name: local.description,
      _expanded: false,
    });

  // ------------------------------------------
  // CONFIGURABLE RECALC
  // ------------------------------------------
  console.log("configuration.pricing", configuration.pricing);
  console.log("pricingRows", pricingRows);
  const recalcConfigured = (patch = {}) => {
    const updated = { ...local, ...patch };

    const qty = Number(updated.qty);
    console.log("local.qty", updated.qty);
    const qtyObj = pricingRows.find((r) => {
      const minOk = qty >= Number(r.minQty);

      const maxOk = r.maxQty == null || qty <= Number(r.maxQty);

      return minOk && maxOk;
    });

    const qtyPrice = Number(qtyObj?.unitPrice || 0);

    console.log("qtyObj", qtyObj);
    console.log("qtyPrice", qtyPrice);
    const dynamicOptionsPrice = calculateOptionPricing({
      optionGroups,
      dynamicOptions: updated.dynamicOptions,
      qty,
      qtyPrice,

      width: Number(updated.options?.width) || Number(data.options?.width) || 0,

      height:
        Number(updated.options?.height) || Number(data.options?.height) || 0,

      unit: updated.options?.unit || data.options?.unit || "in",
    });

    const subtotal = qtyPrice + dynamicOptionsPrice;

    const total = applyDiscount(subtotal, updated);

    const final = {
      ...updated,
      unitPrice: subtotal,
      subtotal,
      total,
    };

    setLocal(final);

    onChange({
      ...final,

      options: {
        ...(data.options || {}),
        ...(updated.options || {}),

        dynamicOptions: final.dynamicOptions,
      },
    });
  };
  const applyDiscount = (subtotal, item) => {
    let total = subtotal;
    const v = Number(item.discountValue);

    if (item.discountType && !isNaN(v)) {
      if (item.discountType === "amount") {
        total = Math.max(0, subtotal - v);
      }

      if (item.discountType === "percent") {
        total = subtotal - (subtotal * v) / 100;
      }

      if (item.discountType === "override") {
        total = Math.max(0, v);
      }
    }

    return Number(total.toFixed(2));
  };
  const category = String(effectiveProduct?.category || "");

  const isSinalite = effectiveProduct?.sinaliteEnabled === true;
  const productCalculationRef = useRef(false);

  useEffect(() => {
    if (
      !autoCalculateOnMount ||
      productCalculationRef.current ||
      isManual ||
      isSticker ||
      isSinalite ||
      isApparel ||
      isRaffleTicket ||
      isYardSign ||
      data?._expanded !== true ||
      pricingRows.length === 0
    ) {
      return;
    }

    const firstQty = Number(pricingRows[0]?.minQty ?? pricingRows[0]?.qty ?? 1);

    const currentQty = Number(data?.qty);

    const initialQty = !currentQty || currentQty === 1 ? firstQty : currentQty;

    const initialDynamicOptions =
      Object.keys(data?.options?.dynamicOptions || {}).length > 0
        ? data.options.dynamicOptions
        : local.dynamicOptions;

    recalcConfigured({
      qty: initialQty,
      dynamicOptions: initialDynamicOptions,
    });

    productCalculationRef.current = true;
  }, [
    autoCalculateOnMount,
    effectiveProduct?.id,
    data?._expanded,
    pricingRows.length,
  ]);
  // ------------------------------------------
  // RENDER
  // ------------------------------------------

  return (
    <div className="mt-4 p-5 bg-white-50  rounded-xl shadow-sm">
      {/* PRODUCT HEADER */}
      <div
        className={`grid grid-cols-1 gap-8 mb-8 ${
          effectiveProduct && !isYardSign
            ? "xl:grid-cols-[320px_1fr]"
            : "xl:grid-cols-1"
        }`}
      >
        {/* LEFT */}
        {effectiveProduct && !isYardSign && (
          <div className="p-4 shadow-sm h-fit">
            {effectiveProduct?.image || effectiveProduct?.imageUrl ? (
              <img
                src={effectiveProduct.image || effectiveProduct.imageUrl}
                alt={effectiveProduct.name}
                className="
      w-full
      aspect-[4/5]
      object-cover
      border
      bg-gray-50
    "
              />
            ) : (
              <div
                className="
      w-full
      aspect-[4/5]
      border
      bg-gray-50
      flex
      items-center
      justify-center
      text-gray-400
    "
              >
                No Image
              </div>
            )}

            {effectiveProduct?.description && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Product description
                </p>

                <p className="whitespace-pre-line text-sm leading-6 text-gray-700">
                  {effectiveProduct.description}
                </p>
              </div>
            )}
          </div>
        )}
        {/* RIGHT */}
        <div>
          {effectiveProduct && (
            <div className="pb-5 border-b mb-6">
              <h2 className="text-3xl font-semibold text-gray-900">
                {effectiveProduct.name}
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                Configure product options
              </p>
            </div>
          )}

          {/* ===================================================== */}
          {/* 🔥 MANUAL PRODUCTS */}
          {/* ===================================================== */}
          {isManual && !isSpecialProduct && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Description</label>
                <input
                  type="text"
                  className="border rounded-lg p-2 w-full mt-1"
                  value={local.description}
                  onChange={(e) =>
                    updateManual({ description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold">Quantity</label>
                  <input
                    type="number"
                    className="border rounded-lg p-2 w-full mt-1"
                    value={local.qty}
                    onChange={(e) =>
                      updateManual({ qty: Number(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Unit Price</label>
                  <input
                    type="number"
                    className="border rounded-lg p-2 w-full mt-1"
                    value={local.unitPrice}
                    onChange={(e) =>
                      updateManual({ unitPrice: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              {/* 🔥 DISCOUNT BLOCK — AQUÍ MISMO */}
              {/* 🔥 DISCOUNT + TOTAL — MANUAL (KANAKKU / SHOPVOX STYLE) */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-4">
                {/* LEFT — DISCOUNT */}
                <div className="flex items-center gap-2 flex-1">
                  {/* % */}
                  <button
                    onClick={() =>
                      updateManual({
                        discountType: "percent",
                        discountValue: "",
                      })
                    }
                    className={`w-9 h-9 rounded-md border text-sm font-medium transition
        ${
          local.discountType === "percent"
            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        }`}
                  >
                    %
                  </button>

                  {/* $ */}
                  <button
                    onClick={() =>
                      updateManual({
                        discountType: "amount",
                        discountValue: "",
                      })
                    }
                    className={`w-9 h-9 rounded-md border text-sm font-medium transition
        ${
          local.discountType === "amount"
            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        }`}
                  >
                    $
                  </button>

                  {/* INPUT */}
                  <input
                    type="number"
                    step="0.01"
                    disabled={!local.discountType}
                    placeholder={
                      local.discountType === "percent"
                        ? "Discount %"
                        : local.discountType === "amount"
                          ? "Discount amount"
                          : "Add discount"
                    }
                    value={local.discountValue ?? ""}
                    onChange={(e) =>
                      updateManual({ discountValue: e.target.value })
                    }
                    className={`w-40 h-11 px-3 rounded-lg border border-gray-200 text-sm transition
        ${
          local.discountType
            ? "bg-white focus:ring-2 focus:ring-blue-100"
            : "bg-gray-50 text-gray-400 cursor-not-allowed"
        }`}
                  />
                </div>

                {/* TOTAL */}
                <div className="text-right min-w-[160px] ml-6">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Total
                  </p>
                  <p className="text-xl font-semibold text-gray-900">
                    ${Number(local.total).toLocaleString()}
                  </p>
                </div>

                {/* DONE */}
                <button
                  onClick={() =>
                    onChange({
                      ...data,

                      name: local.description,
                      description: local.description,

                      qty: local.qty,
                      unitPrice: local.unitPrice,
                      total: local.total,

                      finishes: selectedFinishes,

                      options: {
                        ...(data.options || {}),

                        width: widthIn,
                        height: heightIn,
                        unit,

                        dynamicOptions: local.dynamicOptions,
                      },

                      discountType: local.discountType,
                      discountValue: local.discountValue,

                      _expanded: false,
                      __commit: true,
                    })
                  }
                  className="h-11 px-6 rounded-xl bg-blue-600 text-white font-medium
               hover:bg-blue-700 transition shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* 🔥 SINALITE PRODUCTS */}
          {/* ===================================================== */}

          {isSinalite && (
            <SinaliteConfigurator
              product={effectiveProduct}
              onAdd={(item) =>
                onChange({
                  ...item,

                  _expanded: false,

                  __commit: true,
                })
              }
            />
          )}

          {isSpecialProduct && (
            <ProductConfigurator
              product={effectiveProduct}
              initialData={data}
              onChange={(configuredItem) => {
                if (!configuredItem) return;

                const nextConfiguredItem = {
                  ...data,
                  ...configuredItem,

                  // MUY IMPORTANTE:
                  // conservar siempre el ID del item que estamos editando
                  id: data.id,

                  productId: isApparel
                    ? null
                    : configuredItem.productId ||
                      data.productId ||
                      effectiveProduct?.id ||
                      null,

                  product:
                    configuredItem.product || data.product || effectiveProduct,

                  name:
                    configuredItem.name ||
                    configuredItem.description ||
                    data.name ||
                    effectiveProduct?.name ||
                    "Item",
                  description:
                    configuredItem.description ||
                    configuredItem.name ||
                    data.description ||
                    data.name ||
                    effectiveProduct?.name ||
                    "Item",

                  qty: Number(configuredItem.qty ?? data.qty ?? 1),

                  unitPrice: Number(
                    configuredItem.unitPrice ?? data.unitPrice ?? 0,
                  ),

                  subtotal: Number(
                    configuredItem.subtotal ??
                      configuredItem.total ??
                      data.total ??
                      0,
                  ),

                  total: Number(configuredItem.total ?? data.total ?? 0),

                  options: {
                    ...(data.options || {}),
                    ...(configuredItem.options || {}),

                    dynamicOptions: {
                      ...(data.options?.dynamicOptions || {}),
                      ...(configuredItem.options?.dynamicOptions || {}),
                    },
                  },

                  // Mientras configura NO hacemos commit
                  _expanded: true,
                  __commit: false,
                };

                // Guardamos temporalmente los cambios.
                // El ref conserva el valor inmediatamente.
                // El state fuerza el re-render para habilitar Done.
                latestSpecialItemRef.current = nextConfiguredItem;
                setSpecialDraft(nextConfiguredItem);
              }}
            />
          )}
          {isSpecialProduct && (
            <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => {
                  const itemToSave =
                    specialDraft || latestSpecialItemRef.current || data;

                  onChange({
                    ...itemToSave,
                    id: data.id,
                    _expanded: false,
                    __commit: true,
                  });
                }}
                disabled={
                  Number(
                    specialDraft?.total ??
                      latestSpecialItemRef.current?.total ??
                      data?.total ??
                      0,
                  ) <= 0
                }
                className="h-11 rounded-xl bg-blue-600 px-6 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Done
              </button>
            </div>
          )}
          {!isManual && !isSpecialProduct && !isSinalite && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* QUANTITY */}
                {pricingRows.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold">Quantity</label>
                    <select
                      className="border rounded-lg p-2 w-full mt-1"
                      value={Number(local.qty)} // 🔥 FIX REAL
                      onChange={(e) =>
                        recalcConfigured({ qty: Number(e.target.value) })
                      }
                    >
                      {pricingRows.map((r, i) => (
                        <option key={i} value={Number(r.minQty)}>
                          {r.minQty}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {measurements.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500">
                        Unit
                      </label>

                      <select
                        className="mt-1 border rounded-lg px-3 py-2.5 w-full"
                        value={unit}
                        onChange={(e) => {
                          const newUnit = e.target.value;

                          setUnit(newUnit);

                          const nextOptions = {
                            ...(data.options || {}),
                            width: Number(widthIn) || 0,
                            height: Number(heightIn) || 0,
                            unit: newUnit,
                          };

                          onChange({
                            options: nextOptions,
                          });

                          recalcConfigured({
                            options: nextOptions,
                          });
                        }}
                      >
                        <option value="in">In</option>
                        <option value="ft">Ft</option>
                        <option value="cm">CM</option>
                        <option value="mm">Mll</option>
                      </select>
                    </div>
                    {/* WIDTH */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500">
                        {measurements.width?.label || "Width"} (
                        {unitLabel(unit)})
                      </label>
                      <input
                        inputMode="decimal"
                        className="mt-1 border rounded-lg px-3 py-2.5 w-full"
                        value={widthIn}
                        onChange={(e) => {
                          const value = e.target.value;

                          const nextOptions = {
                            ...(data.options || {}),
                            width: Number(value),
                            height: Number(heightIn) || 0,
                            unit,
                          };

                          setWidthIn(value);

                          onChange({
                            options: nextOptions,
                          });

                          recalcConfigured({
                            options: nextOptions,
                          });
                        }}
                      />
                    </div>

                    {/* HEIGHT */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500">
                        {measurements.height?.label || "Height"} (
                        {unitLabel(unit)})
                      </label>
                      <input
                        inputMode="decimal"
                        className="mt-1 border rounded-lg px-3 py-2.5 w-full"
                        value={heightIn}
                        onChange={(e) => {
                          const value = e.target.value;

                          const nextOptions = {
                            ...(data.options || {}),
                            width: Number(widthIn) || 0,
                            height: Number(value),
                            unit,
                          };

                          setHeightIn(value);

                          onChange({
                            options: nextOptions,
                          });

                          recalcConfigured({
                            options: nextOptions,
                          });
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <ConfigurableTemplateEditor
                  optionGroups={optionGroups}
                  value={local.dynamicOptions}
                  onChange={(dynamicOptions) =>
                    recalcConfigured({ dynamicOptions })
                  }
                />
              </div>

              {/* 🔥 DISCOUNT + TOTAL — KANAKKU / SHOPVOX STYLE */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-4">
                {/* LEFT — DISCOUNT */}
                <div className="flex items-center gap-2 flex-1">
                  {/* % */}
                  <button
                    onClick={() =>
                      recalcConfigured({
                        discountType: "percent",
                        discountValue: "",
                      })
                    }
                    className={`w-9 h-9 rounded-md border text-sm font-medium transition
        ${
          local.discountType === "percent"
            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        }`}
                  >
                    %
                  </button>

                  {/* $ */}
                  <button
                    onClick={() =>
                      recalcConfigured({
                        discountType: "amount",
                        discountValue: "",
                      })
                    }
                    className={`w-9 h-9 rounded-md border text-sm font-medium transition
        ${
          local.discountType === "amount"
            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        }`}
                  >
                    $
                  </button>

                  {/* INPUT */}
                  <input
                    type="number"
                    step="0.01"
                    disabled={!local.discountType}
                    placeholder={
                      local.discountType === "percent"
                        ? "Discount %"
                        : local.discountType === "amount"
                          ? "Discount amount"
                          : "Add discount"
                    }
                    value={local.discountValue ?? ""}
                    onChange={(e) =>
                      recalcConfigured({ discountValue: e.target.value })
                    }
                    className={`w-40 h-11 px-3  border border-gray-200 text-sm
        ${
          local.discountType
            ? "bg-white border-gray-200 focus:ring-2 focus:ring-blue-100"
            : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
        }`}
                  />
                </div>

                {/* TOTAL */}
                <div className="text-left min-w-[140px] ">
                  <p className="text-m text-gray-400 uppercase tracking-wide">
                    Total
                  </p>
                  <p className="text-xl font-semibold text-blue-600">
                    ${Number(local.total).toLocaleString()}
                  </p>
                </div>

                {/* DONE */}

                <button
                  onClick={() =>
                    onChange({
                      ...data,

                      qty: local.qty,
                      unitPrice: local.unitPrice,
                      total: local.total,

                      finishes: selectedFinishes,

                      options: {
                        ...(data.options || {}),
                        dynamicOptions: local.dynamicOptions,
                      },

                      discountType: local.discountType,
                      discountValue: local.discountValue,

                      _expanded: false,
                      __commit: true,
                    })
                  }
                  className="h-11 px-6 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-sm"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default memo(InlineProductEditor);
