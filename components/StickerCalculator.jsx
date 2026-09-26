"use client";

import { useEffect, useMemo, useState } from "react";

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

  // ======================================================
  // LOAD MATERIALS
  // ======================================================

  useEffect(() => {
    async function loadMaterials() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/materials", {
          cache: "no-store",
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
        console.error("Error loading sticker materials:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load sticker materials.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadMaterials();
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
  // DEFAULT MATERIAL
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

  // ======================================================
  // SELECTED MATERIALS
  // ======================================================

  const selectedMaterial = useMemo(() => {
    return vinylMaterials.find((material) => material.id === materialId);
  }, [vinylMaterials, materialId]);

  const selectedLaminate = useMemo(() => {
    return laminateMaterials.find((material) => material.id === laminateId);
  }, [laminateMaterials, laminateId]);

  // ======================================================
  // CALCULATE
  // ======================================================

  useEffect(() => {
    if (!materialId) {
      setResult(null);
      return;
    }

    if (width <= 0 || height <= 0 || qty <= 0) {
      setResult(null);
      return;
    }

    if (laminated && laminateMaterials.length > 0 && !laminateId) {
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

        onChange?.({
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
        if (err?.name === "AbortError") {
          return;
        }

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
  ]);

  // ======================================================
  // UI
  // ======================================================
  function handleSizeChange(option) {
    setSizeOption(option);

    if (option === "1x1") {
      setWidth(1);
      setHeight(1);
    }

    if (option === "2x2") {
      setWidth(2);
      setHeight(2);
    }

    if (option === "3x3") {
      setWidth(3);
      setHeight(3);
    }

    if (option === "4x4") {
      setWidth(4);
      setHeight(4);
    }
  }
  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* MATERIAL */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Material
          </label>

          <select
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            disabled={loading}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
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

        {/* CUT TYPE */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Cut Type
          </label>

          <select
            value={cutType}
            onChange={(e) => setCutType(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          >
            <option value="die-cut">Die Cut</option>
            <option value="kiss-cut">Kiss Cut</option>
          </select>
        </div>

        {/* SIZE */}

        <div className="md:col-span-2">
          <label className="mb-3 block text-sm font-medium text-gray-700">
            Size
          </label>

          <div className="flex flex-wrap gap-3">
            {[
              ["1x1", '1" × 1"'],
              ["2x2", '2" × 2"'],
              ["3x3", '3" × 3"'],
              ["4x4", '4" × 4"'],
              ["custom", "Custom Size"],
            ].map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-3"
              >
                <input
                  type="radio"
                  name="sticker-size"
                  value={value}
                  checked={sizeOption === value}
                  onChange={() => handleSizeChange(value)}
                />

                <span className="text-sm font-medium text-gray-700">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* CUSTOM SIZE */}

        {sizeOption === "custom" && (
          <>
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
                className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
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
                className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </>
        )}

        {/* QUANTITY */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Quantity
          </label>

          <input
            type="number"
            min="1"
            step="1"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          />
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
              setLaminateId(e.target.value);
            }}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          >
            <option value="none">No Lamination</option>

            {laminateMaterials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RESULT */}

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        {calculating ? (
          <div className="py-6 text-center text-sm text-gray-500">
            Calculating price...
          </div>
        ) : result ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-gray-500">Estimated Price</p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {qty} stickers · {width}" × {height}"
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

            <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-4 text-sm md:grid-cols-4">
              <div>
                <p className="text-gray-500">Across</p>

                <p className="font-semibold text-gray-900">
                  {result.layout?.across || 0}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Rows</p>

                <p className="font-semibold text-gray-900">
                  {result.layout?.rows || 0}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Material Used</p>

                <p className="font-semibold text-gray-900">
                  {Number(result.layout?.linearFeetUsed || 0).toFixed(2)} ft
                </p>
              </div>

              <div>
                <p className="text-gray-500">Orientation</p>

                <p className="font-semibold text-gray-900">
                  {result.layout?.rotated ? "Rotated" : "Normal"}
                </p>
              </div>
            </div>

            {/* INTERNAL COST BREAKDOWN */}

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
