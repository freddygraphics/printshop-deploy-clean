"use client";

import { useEffect, useState } from "react";
import { memo } from "react";

function InlineProductEditor({ product, data, onChange }) {
  if (!product) {
    return (
      <div className="p-4 text-gray-500">Select a product to configure.</div>
    );
  }

  const cfg = product.customFields || {};
  const isManual = Object.keys(cfg).length === 0;

  // ------------------------------------------
  // SAFE INITIAL VALUES
  // ------------------------------------------
  const safe = {
    description: data?.name ?? "",
    qty: Number(data?.qty ?? 1),
    unitPrice: Number(data?.unitPrice ?? 0),
    total: Number(data?.total ?? 0),

    finish: data?.finish ?? cfg.finish?.[0]?.name ?? "",
    design: data?.design ?? cfg.design?.[0]?.name ?? "",
    sides: data?.sides ?? cfg.sides?.[0]?.name ?? "",
    corners: data?.corners ?? cfg.corners?.[0]?.name ?? "",
  };

  const [local, setLocal] = useState(safe);

  // Reset when data changes
  // -----------------------------------------------------
  // RESET LOCAL STATE AL CAMBIAR DATA
  // -----------------------------------------------------
  useEffect(() => {
    setLocal(safe);
  }, [data]);

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
    updated.total = Number(updated.qty) * Number(updated.unitPrice);

    setLocal(updated);
    onChange(updated);
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
      cfg.finish?.find((f) => f.name === updated.finish)?.price || 0
    );
    const designPrice = Number(
      cfg.design?.find((d) => d.name === updated.design)?.price || 0
    );
    const sidesPrice = Number(
      cfg.sides?.find((s) => s.name === updated.sides)?.price || 0
    );
    const cornersPrice = Number(
      cfg.corners?.find((c) => c.name === updated.corners)?.price || 0
    );

    const total =
      qtyPrice + finishPrice + designPrice + sidesPrice + cornersPrice;

    const final = { ...updated, unitPrice: total, total };
    setLocal(final);
    onChange(final);
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

            <div>
              <label className="text-sm font-semibold">Total</label>
              <input
                type="number"
                readOnly
                className="border rounded-lg p-2 w-full mt-1 bg-gray-100"
                value={local.total}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleManualDone}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
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

          <div className="flex justify-between items-center mt-6">
            <p className="font-bold text-blue-600 text-lg">
              Total: ${Number(local.total).toLocaleString()}
            </p>
            <button
              onClick={() => onChange({ ...local, _expanded: false })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
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
