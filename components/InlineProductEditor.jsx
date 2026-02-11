"use client";

import { useEffect, useState, useMemo } from "react";
import { memo } from "react";

function InlineProductEditor({ product, data, onChange, onClose }) {
  const cfg = product?.customFields || {};
  const isManual = !product;

  // ------------------------------------------
  // SAFE INITIAL VALUES
  // ------------------------------------------
  const [finishes, setFinishes] = useState([]);
  const [selectedFinishes, setSelectedFinishes] = useState({});

  const [widthIn, setWidthIn] = useState(data.options?.widthIn || "");
  const [heightIn, setHeightIn] = useState(data.options?.heightIn || "");
  const [materialId, setMaterialId] = useState(data.options?.materialId || "");

  const [materials, setMaterials] = useState([]);

  const opts = data?.options || {};
  const safe = {
    description: data?.name ?? "",
    qty: Number(data?.qty ?? 1),
    unitPrice: Number(data?.unitPrice ?? 0),

    subtotal: Number(data?.total ?? 0), // 👈 NUEVO
    total: Number(data?.total ?? 0),

    discountType: data?.discountType ?? null,
    discountValue: data?.discountValue ?? null,
    discountReason: data?.discountReason ?? "",

    finish: opts.finish ?? cfg.finish?.[0]?.name ?? "",
    design: opts.design ?? cfg.design?.[0]?.name ?? "",
    sides: opts.sides ?? cfg.sides?.[0]?.name ?? "",
    corners: opts.corners ?? cfg.corners?.[0]?.name ?? "",
  };

  const [local, setLocal] = useState(safe);

  useEffect(() => {
    if (
      product?.templateType !== "large-format" ||
      data?.options?.pricingMode === "sqft"
    )
      return;

    onChange({
      options: {
        ...data.options,
        pricingMode: "sqft",
        widthIn: Number(widthIn) || 0,
        heightIn: Number(heightIn) || 0,
        materialId: materialId || "",
      },
    });
  }, [product]);

  const recalcSqftFromServer = async ({
    widthIn,
    heightIn,
    quantity,
    materialId,
  }) => {
    if (!widthIn || !heightIn || !materialId) return;

    try {
      const res = await fetch("/api/pricing/sqft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          printProductionProfileId: materialId,
          widthIn: Number(widthIn),
          heightIn: Number(heightIn),
          quantity: Number(quantity || 1),
        }),
      });

      const pricing = await res.json();

      if (!res.ok || pricing.error) return;

      // 🔥 ESTE ES EL PRECIO REAL
      onChange({
        unitPrice: pricing.unitPrice,
        total: pricing.subtotal,
        _expanded: true, // mantiene abierto mientras edita
      });
    } catch (err) {
      console.error("❌ Pricing error", err);
    }
  };
  useEffect(() => {
    if (
      product?.templateType !== "large-format" ||
      !widthIn ||
      !heightIn ||
      !materialId
    )
      return;

    recalcSqftFromServer({
      widthIn,
      heightIn,
      quantity: data.qty,
      materialId,
    });
  }, [widthIn, heightIn, materialId, data.qty]);

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
    if (data?._expanded !== true) return;
    setLocal(safe);
  }, [data?._expanded]);

  // -----------------------------------------------------
  // 🔥 FIX: AUTO-CALCULAR AL ABRIR CONFIGURABLE
  // -----------------------------------------------------
  // -----------------------------------------------------
  // 🔥 AUTO-RECALCULAR SOLO AL ABRIR, PERO RESPETANDO QTY EXISTENTE
  // -----------------------------------------------------
  useEffect(() => {
    if (!isManual && data._expanded === true) {
      const firstQty =
        cfg.rows?.length > 0 ? Number(cfg.rows[0].qty) : local.qty;

      const shouldForceFirstQty =
        data.qty === 1 || data.qty === 0 || data.qty === undefined;

      recalcConfigured({
        qty: shouldForceFirstQty ? firstQty : data.qty, // ⬅️ Solo cambia si es nuevo
        finish: local.finish,
        design: local.design,
        sides: local.sides,
        corners: local.corners,
      });
    }
  }, [data._expanded]);

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
  const recalcConfigured = (patch = {}) => {
    const updated = { ...local, ...patch };

    const qty = Number(updated.qty);

    const qtyObj = cfg.rows?.find((r) => Number(r.qty) === qty);
    const qtyPrice = Number(qtyObj?.price || 0);

    const finishPrice = Number(
      cfg.finish?.find((f) => f.name === updated.finish)?.price || 0,
    );
    const designPrice = Number(
      cfg.design?.find((d) => d.name === updated.design)?.price || 0,
    );
    const sidesPrice = Number(
      cfg.sides?.find((s) => s.name === updated.sides)?.price || 0,
    );
    const cornersPrice = Number(
      cfg.corners?.find((c) => c.name === updated.corners)?.price || 0,
    );

    const subtotal =
      qtyPrice + finishPrice + designPrice + sidesPrice + cornersPrice;

    const total = applyDiscount(subtotal, updated);

    const final = {
      ...updated,
      unitPrice: subtotal,
      subtotal,
      total,
    };

    setLocal(final);
    onChange(final);
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

  // ------------------------------------------
  // RENDER
  // ------------------------------------------
  return (
    <div className="mt-4 p-5 bg-white-50  rounded-xl shadow-sm">
      {/* ===================================================== */}
      {/* 🔥 MANUAL PRODUCTS */}
      {/* ===================================================== */}
      {isManual && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold">Description</label>
            <input
              type="text"
              className="border rounded-lg p-2 w-full mt-1"
              value={local.description}
              onChange={(e) => updateManual({ description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold">Quantity</label>
              <input
                type="number"
                className="border rounded-lg p-2 w-full mt-1"
                value={local.qty}
                onChange={(e) => updateManual({ qty: Number(e.target.value) })}
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
                  updateManual({ discountType: "percent", discountValue: "" })
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
                  updateManual({ discountType: "amount", discountValue: "" })
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
                  qty: local.qty,
                  name: local.description,
                  unitPrice: local.unitPrice,
                  total: local.total,

                  // SOLO SI APLICA
                  finish: local.finish,
                  design: local.design,
                  sides: local.sides,
                  corners: local.corners,

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
      {/* 🔥 CONFIGURABLE PRODUCTS (KANAKKU STYLE + FIX QTY) */}
      {/* ===================================================== */}
      {!isManual && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* QUANTITY */}
            {cfg.rows && (
              <div>
                <label className="text-xs font-semibold">Quantity</label>
                <select
                  className="border rounded-lg p-2 w-full mt-1"
                  value={Number(local.qty)} // 🔥 FIX REAL
                  onChange={(e) =>
                    recalcConfigured({ qty: Number(e.target.value) })
                  }
                >
                  {cfg.rows.map((r, i) => (
                    <option key={i} value={Number(r.qty)}>
                      {" "}
                      {/* 🔥 FIX */}
                      {r.qty}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {product?.templateType === "large-format" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                {/* WIDTH */}
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                    Width (in)
                  </label>
                  <input
                    inputMode="decimal"
                    className="mt-1 border rounded-lg px-3 py-2.5 w-full"
                    value={widthIn}
                    onChange={(e) => {
                      setWidthIn(e.target.value);
                      onChange({
                        options: {
                          ...data.options,
                          pricingMode: "sqft",
                          widthIn: Number(e.target.value),
                          heightIn: Number(heightIn),
                          materialId,
                        },
                      });
                    }}
                  />
                </div>

                {/* HEIGHT */}
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                    Height (in)
                  </label>
                  <input
                    inputMode="decimal"
                    className="mt-1 border rounded-lg px-3 py-2.5 w-full"
                    value={heightIn}
                    onChange={(e) => {
                      setHeightIn(e.target.value);
                      onChange({
                        options: {
                          ...data.options,
                          pricingMode: "sqft",
                          widthIn: Number(widthIn),
                          heightIn: Number(e.target.value),
                          materialId,
                        },
                      });
                    }}
                  />
                </div>

                {/* MATERIAL */}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500">
                    Material
                  </label>
                  <select
                    className="mt-1 border rounded-lg px-3 py-2.5 w-full"
                    value={materialId || ""}
                    onChange={(e) => {
                      const id = e.target.value; // 👈 STRING

                      setMaterialId(id);

                      onChange({
                        options: {
                          ...data.options,
                          pricingMode: "sqft",
                          widthIn: Number(widthIn),
                          heightIn: Number(heightIn),
                          materialId: id, // 👈 STRING
                        },
                      });
                    }}
                  >
                    <option value="">Select material</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* ================= FINISHES ================= */}
                <div className="col-span-full mt-6 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Finishes
                  </h4>

                  <div className="space-y-2">
                    {finishes.map((f) => {
                      const enabled = selectedFinishes[f.id]?.enabled || false;
                      const qty = selectedFinishes[f.id]?.qty || 1;

                      return (
                        <div
                          key={f.id}
                          className="flex items-center gap-3 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => {
                              setSelectedFinishes((prev) => ({
                                ...prev,
                                [f.id]: {
                                  enabled: e.target.checked,
                                  qty: f.unitType === "each" ? 1 : null,
                                  sellPrice: f.sellPrice,
                                  unitType: f.unitType,
                                  name: f.name,
                                },
                              }));
                            }}
                          />

                          <span className="flex-1">
                            {f.name} (${f.sellPrice} / {f.unitType})
                          </span>

                          {enabled && f.unitType === "each" && (
                            <input
                              type="number"
                              min="1"
                              className="w-20 border rounded px-2 py-1"
                              value={qty}
                              onChange={(e) =>
                                setSelectedFinishes((prev) => ({
                                  ...prev,
                                  [f.id]: {
                                    ...prev[f.id],
                                    qty: Number(e.target.value),
                                  },
                                }))
                              }
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {product?.templateType === "large-format" && (
                  <div className="mt-4 border rounded-xl bg-gray-50 p-4 col-span-full">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Estimated Pricing (Preview)
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">SQFT / Unit</p>
                        <p className="font-semibold">
                          {sqftPerUnit ? sqftPerUnit.toFixed(2) : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Total SQFT</p>
                        <p className="font-semibold">
                          {sqftPerUnit && data.qty
                            ? (sqftPerUnit * data.qty).toFixed(2)
                            : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Est. Unit Price</p>
                        <p className="font-semibold">
                          {estimatedUnitPrice
                            ? `$${estimatedUnitPrice.toFixed(2)}`
                            : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Est. Total</p>
                        <p className="font-bold text-gray-900">
                          {estimatedTotal
                            ? `$${estimatedTotal.toFixed(2)}`
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      * Final price is calculated when saved.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* FINISH */}
            {cfg.finish && (
              <div>
                <label className="text-xs font-semibold">Finish</label>
                <select
                  className="border rounded-lg p-2 w-full mt-1"
                  value={local.finish}
                  onChange={(e) => recalcConfigured({ finish: e.target.value })}
                >
                  {cfg.finish.map((f, i) => (
                    <option key={i} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* DESIGN */}
            {cfg.design && (
              <div>
                <label className="text-xs font-semibold">Design</label>
                <select
                  className="border rounded-lg p-2 w-full mt-1"
                  value={local.design}
                  onChange={(e) => recalcConfigured({ design: e.target.value })}
                >
                  {cfg.design.map((d, i) => (
                    <option key={i} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* SIDES */}
            {cfg.sides && (
              <div>
                <label className="text-xs font-semibold">Sides</label>
                <select
                  className="border rounded-lg p-2 w-full mt-1"
                  value={local.sides}
                  onChange={(e) => recalcConfigured({ sides: e.target.value })}
                >
                  {cfg.sides.map((s, i) => (
                    <option key={i} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* CORNERS */}
            {cfg.corners && (
              <div>
                <label className="text-xs font-semibold">Corners</label>
                <select
                  className="border rounded-lg p-2 w-full mt-1"
                  value={local.corners}
                  onChange={(e) =>
                    recalcConfigured({ corners: e.target.value })
                  }
                >
                  {cfg.corners.map((c, i) => (
                    <option key={i} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                  qty: local.qty,
                  unitPrice: local.unitPrice,
                  total: local.total,
                  finishes: selectedFinishes,
                  // SOLO SI APLICA
                  finish: local.finish,
                  design: local.design,
                  sides: local.sides,
                  corners: local.corners,

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
        </>
      )}
    </div>
  );
}
export default memo(InlineProductEditor);
