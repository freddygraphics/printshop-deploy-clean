"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const PRESET_QUANTITIES = [
  50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000,
];

const SIZE_OPTIONS = [
  ["1x1", '1" × 1"'],
  ["2x2", '2" × 2"'],
  ["3x3", '3" × 3"'],
  ["4x4", '4" × 4"'],
  ["custom", "Custom Size"],
];

export default function StickerCalculator({ value = null, onChange }) {
  const savedOptions = value?.options || {};

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");

  const [materialId, setMaterialId] = useState(savedOptions.materialId || "");

  const [laminateId, setLaminateId] = useState(savedOptions.laminateId || "");

  const [width, setWidth] = useState(
    Number(savedOptions.width ?? savedOptions.stickerWidth ?? 2),
  );

  const [height, setHeight] = useState(
    Number(savedOptions.height ?? savedOptions.stickerHeight ?? 2),
  );

  const getInitialSizeOption = () => {
    const initialWidth = Number(
      savedOptions.width ?? savedOptions.stickerWidth ?? 2,
    );
    const initialHeight = Number(
      savedOptions.height ?? savedOptions.stickerHeight ?? 2,
    );

    if (initialWidth === 1 && initialHeight === 1) return "1x1";
    if (initialWidth === 2 && initialHeight === 2) return "2x2";
    if (initialWidth === 3 && initialHeight === 3) return "3x3";
    if (initialWidth === 4 && initialHeight === 4) return "4x4";

    return "custom";
  };

  const [sizeOption, setSizeOption] = useState(getInitialSizeOption);

  const [qty, setQty] = useState(
    Number(savedOptions.quantity ?? savedOptions.qty ?? 50),
  );

  const [laminated, setLaminated] = useState(savedOptions.laminated ?? true);

  const [cutType, setCutType] = useState(savedOptions.cutType || "die-cut");

  const [result, setResult] = useState(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  // ======================================================
  // LOAD MATERIALS
  // ======================================================

  useEffect(() => {
    const controller = new AbortController();

    async function loadMaterials() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/materials", {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Unable to load materials.");
        }

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.materials)
            ? data.materials
            : [];

        setMaterials(list);
      } catch (err) {
        if (err?.name === "AbortError") return;

        console.error("Error loading sticker materials:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load sticker materials.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadMaterials();

    return () => controller.abort();
  }, []);

  // ======================================================
  // MATERIAL GROUPS
  // ======================================================

  const vinylMaterials = useMemo(() => {
    return materials.filter((material) => {
      const category = String(material.category || "")
        .trim()
        .toLowerCase();

      const unitType = String(material.unitType || "")
        .trim()
        .toLowerCase();

      return (
        material.active !== false &&
        unitType === "roll" &&
        category === "printable vinyl"
      );
    });
  }, [materials]);

  const laminateMaterials = useMemo(() => {
    return materials.filter((material) => {
      const category = String(material.category || "")
        .trim()
        .toLowerCase();

      const unitType = String(material.unitType || "")
        .trim()
        .toLowerCase();

      return (
        material.active !== false &&
        unitType === "roll" &&
        category === "laminate"
      );
    });
  }, [materials]);

  // ======================================================
  // DEFAULT MATERIALS
  // ======================================================

  useEffect(() => {
    if (!materialId && vinylMaterials.length > 0) {
      setMaterialId(vinylMaterials[0].id);
    }
  }, [materialId, vinylMaterials]);

  useEffect(() => {
    if (laminated && !laminateId && laminateMaterials.length > 0) {
      setLaminateId(laminateMaterials[0].id);
    }
  }, [laminated, laminateId, laminateMaterials]);

  const selectedMaterial = useMemo(() => {
    return vinylMaterials.find((material) => material.id === materialId);
  }, [vinylMaterials, materialId]);

  const selectedLaminate = useMemo(() => {
    return laminateMaterials.find((material) => material.id === laminateId);
  }, [laminateMaterials, laminateId]);

  // ======================================================
  // CALCULATE - EXISTING API
  // ======================================================

  useEffect(() => {
    if (!materialId) {
      setResult(null);
      return;
    }

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      !Number.isFinite(qty) ||
      width <= 0 ||
      height <= 0 ||
      !Number.isInteger(qty) ||
      qty <= 0
    ) {
      setResult(null);
      return;
    }

    if (laminated && laminateMaterials.length > 0 && !laminateId) {
      setResult(null);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setCalculating(true);
        setError("");

        const res = await fetch("/api/sticker-calc", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            stickerWidth: width,
            stickerHeight: height,
            quantity: qty,
            materialId,
            laminateId: laminated && laminateId ? laminateId : null,
            laminated,
            cutType,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Unable to calculate sticker price.");
        }

        if (controller.signal.aborted) return;

        setResult(data);

        const finalPrice = Number(data.finalPrice || 0);

        const unitPrice =
          qty > 0 ? Number((data.unitPrice ?? finalPrice / qty).toFixed(4)) : 0;

        const materialName =
          data.material?.name || selectedMaterial?.name || "Sticker Material";

        const laminateName = laminated
          ? data.laminate?.name || selectedLaminate?.name || "Laminate"
          : null;

        let description = `${width}" x ${height}" ${materialName} Stickers`;

        if (laminated && laminateName) {
          description += ` + ${laminateName}`;
        }

        onChangeRef.current?.({
          description,
          qty,
          unitPrice,
          total: finalPrice,
          options: {
            productType: "stickers",
            width,
            stickerWidth: width,
            height,
            stickerHeight: height,
            quantity: qty,
            materialId,
            materialName,
            laminated,
            laminateId: laminated && laminateId ? laminateId : null,
            laminateName: laminated ? laminateName : null,
            cutType,
            orientation: data.layout?.rotated ? "rotated" : "normal",
            rotated: Boolean(data.layout?.rotated),
            stickersAcross: data.layout?.across || 0,
            rows: data.layout?.rows || 0,
            linearFeetUsed: data.layout?.linearFeetUsed || 0,
            productionAreaSqft: data.layout?.productionAreaSqft || 0,
            finishedStickerAreaSqft: data.layout?.finishedStickerAreaSqft || 0,
            wastePercent: data.layout?.wastePercent || 0,
            productionCost: data.totalCost || 0,
            profitMargin: data.pricing?.profitMargin || 0,
            finalPrice,
            pricingSnapshot: data,
          },
        });
      } catch (err) {
        if (err?.name === "AbortError") return;

        console.error("Sticker calculation error:", err);
        setResult(null);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to calculate sticker price.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setCalculating(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    materialId,
    laminateId,
    width,
    height,
    qty,
    laminated,
    cutType,
    laminateMaterials.length,
    selectedMaterial,
    selectedLaminate,
  ]);

  // ======================================================
  // SIZE SELECTION
  // ======================================================

  function handleSizeChange(option) {
    setSizeOption(option);

    const sizes = {
      "1x1": [1, 1],
      "2x2": [2, 2],
      "3x3": [3, 3],
      "4x4": [4, 4],
    };

    if (sizes[option]) {
      setWidth(sizes[option][0]);
      setHeight(sizes[option][1]);
    }
  }

  const inputClass =
    "h-11 w-full rounded-lg border border-gray-200 " +
    "bg-white px-3 text-sm outline-none transition " +
    "focus:border-blue-400 focus:ring-4 focus:ring-blue-50";

  // ======================================================
  // UI - TWO COLUMN LAYOUT
  // ======================================================

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* LEFT COLUMN */}
        <div className="space-y-5">
          {/* MATERIAL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Material
            </label>

            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              disabled={loading}
              className={inputClass}
            >
              {vinylMaterials.length === 0 ? (
                <option value="">No roll vinyl materials available</option>
              ) : (
                vinylMaterials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* LAMINATION */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Lamination
            </label>

            <select
              value={laminated ? laminateId || "yes" : "none"}
              onChange={(e) => {
                if (e.target.value === "none") {
                  setLaminated(false);
                  return;
                }

                setLaminated(true);
                setLaminateId(e.target.value === "yes" ? "" : e.target.value);
              }}
              className={inputClass}
            >
              <option value="none">No Lamination</option>

              {laminated && !laminateId && (
                <option value="yes">Select Lamination</option>
              )}

              {laminateMaterials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </div>

          {/* CUT TYPE */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Cut Type
            </label>

            <select
              value={cutType}
              onChange={(e) => setCutType(e.target.value)}
              className={inputClass}
            >
              <option value="die-cut">Die Cut</option>
              <option value="kiss-cut">Kiss Cut</option>
            </select>
          </div>

          {/* CUSTOM QUANTITY */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Quantity (Custom)
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className={inputClass}
            />

            <p className="mt-2 text-xs text-gray-500">
              Select a preset quantity or enter a custom quantity.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* SIZE - TWO COLUMNS */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Size
            </label>

            <div className="grid grid-cols-2 gap-3">
              {SIZE_OPTIONS.map(([option, label]) => (
                <label
                  key={option}
                  className={
                    "flex w-full cursor-pointer items-center " +
                    "gap-2 rounded-lg border px-3 py-3 transition " +
                    (sizeOption === option
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-300")
                  }
                >
                  <input
                    type="radio"
                    name="sticker-size"
                    value={option}
                    checked={sizeOption === option}
                    onChange={() => handleSizeChange(option)}
                    className="accent-blue-600"
                  />

                  <span className="text-sm font-medium text-gray-700">
                    {label}
                  </span>
                </label>
              ))}
            </div>

            {sizeOption === "custom" && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Width (in)
                  </label>

                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Height (in)
                  </label>

                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>

          {/* PRESET QUANTITIES */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Quantity
            </label>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {PRESET_QUANTITIES.map((quantity) => (
                <label
                  key={quantity}
                  className={
                    "flex cursor-pointer items-center gap-2 " +
                    "rounded-lg border px-3 py-3 transition " +
                    (qty === quantity
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-300")
                  }
                >
                  <input
                    type="radio"
                    name="sticker-quantity"
                    value={quantity}
                    checked={qty === quantity}
                    onChange={() => setQty(quantity)}
                    className="accent-blue-600"
                  />

                  <span className="text-sm font-medium text-gray-700">
                    {quantity.toLocaleString("en-US")}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RESULT */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        {result ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-500">Estimated Price</p>

                  {calculating && (
                    <span className="text-xs text-blue-600">
                      Updating price...
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {result.quantity} stickers · {result.stickerWidth}" ×{" "}
                  {result.stickerHeight}"
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {result.material?.name}
                  {result.laminate?.name ? ` + ${result.laminate.name}` : ""}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-500">Total</p>

                <p className="text-4xl font-bold tracking-tight text-gray-900">
                  ${Number(result.finalPrice || 0).toFixed(2)}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  ${Number(result.unitPrice || 0).toFixed(2)} each
                </p>
              </div>
            </div>

            <details className="border-t border-gray-200 pt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-600">
                Production details
              </summary>

              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
                <Cost label="Vinyl" value={result.costs?.material} />
                <Cost label="Laminate" value={result.costs?.laminate} />
                <Cost label="Ink" value={result.costs?.ink} />
                <Cost label="Cutting" value={result.costs?.cutting} />
                <Cost label="Machine" value={result.costs?.machine} />
                <Cost label="Labor" value={result.costs?.labor} />
                <Cost label="Setup" value={result.costs?.setup} />
                <Cost label="Production Cost" value={result.totalCost} strong />
              </div>
            </details>
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-gray-500">
            Select a material and enter the sticker size.
          </div>
        )}
      </div>
    </div>
  );
}

function Cost({ label, value, strong = false }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>

      <p
        className={
          strong ? "font-bold text-gray-900" : "font-medium text-gray-900"
        }
      >
        ${Number(value || 0).toFixed(2)}
      </p>
    </div>
  );
}
