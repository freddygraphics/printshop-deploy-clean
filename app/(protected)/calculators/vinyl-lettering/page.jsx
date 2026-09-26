"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  Ruler,
  Layers,
  Scissors,
  Hand,
  Wrench,
  Package,
  DollarSign,
} from "lucide-react";

export default function VinylLetteringCalculatorPage() {
  const [materials, setMaterials] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);

  const [materialId, setMaterialId] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [complexity, setComplexity] = useState("medium");

  const [transferTape, setTransferTape] = useState(true);
  const [installation, setInstallation] = useState(false);

  /* ======================================================
     LOAD DATA
  ====================================================== */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [materialsResponse, pricingResponse] = await Promise.all([
          fetch("/api/materials?active=true", {
            cache: "no-store",
          }),
          fetch("/api/settings/vinyl-lettering", {
            cache: "no-store",
          }),
        ]);

        const materialsData = await materialsResponse.json();
        const pricingData = await pricingResponse.json();

        if (!materialsResponse.ok) {
          throw new Error(materialsData.error || "Unable to load materials.");
        }

        if (!pricingResponse.ok) {
          throw new Error(pricingData.error || "Unable to load pricing.");
        }

        const vinylMaterials = (materialsData.materials || []).filter(
          (material) => {
            const category = String(material.category || "").toLowerCase();

            return (
              material.active &&
              material.unitType === "roll" &&
              category.includes("vinyl")
            );
          },
        );

        setMaterials(vinylMaterials);
        setPricing(pricingData.settings || null);

        if (vinylMaterials.length) {
          setMaterialId(vinylMaterials[0].id);
        }
      } catch (error) {
        console.error("Vinyl lettering calculator error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  /* ======================================================
     SELECTED MATERIAL
  ====================================================== */

  const material = useMemo(
    () => materials.find((item) => item.id === materialId) || null,
    [materials, materialId],
  );

  /* ======================================================
     CALCULATION
  ====================================================== */

  const calculation = useMemo(() => {
    if (!material || !pricing) {
      return null;
    }

    const designWidth = Number(width) || 0;
    const designHeight = Number(height) || 0;
    const qty = Math.max(1, Number(quantity) || 1);

    if (designWidth <= 0 || designHeight <= 0) {
      return null;
    }

    const rollWidth = Number(material.rollWidthIn) || 0;
    const costPerSqft = Number(material.costPerSqft) || 0;

    /*
      Finished design area.
    */

    const singleFinishedSqft = (designWidth * designHeight) / 144;

    const totalFinishedSqft = singleFinishedSqft * qty;

    /*
      MATERIAL LAYOUT

      We test both orientations.

      Orientation A:
      designHeight goes across the roll.
      designWidth becomes linear consumption.

      Orientation B:
      designWidth goes across the roll.
      designHeight becomes linear consumption.

      The calculator chooses whichever consumes
      less roll length.
    */

    function calculateOrientation(acrossRoll, alongRoll) {
      if (
        rollWidth <= 0 ||
        acrossRoll <= 0 ||
        alongRoll <= 0 ||
        acrossRoll > rollWidth
      ) {
        return null;
      }

      const piecesPerRow = Math.floor(rollWidth / acrossRoll);

      if (piecesPerRow < 1) {
        return null;
      }

      const rows = Math.ceil(qty / piecesPerRow);

      const linearInches = rows * alongRoll;

      const consumedSqft = (rollWidth * linearInches) / 144;

      return {
        piecesPerRow,
        rows,
        linearInches,
        consumedSqft,
      };
    }

    const orientationA = calculateOrientation(designHeight, designWidth);

    const orientationB = calculateOrientation(designWidth, designHeight);

    let layout = null;

    if (orientationA && orientationB) {
      layout =
        orientationA.linearInches <= orientationB.linearInches
          ? orientationA
          : orientationB;
    } else {
      layout = orientationA || orientationB;
    }

    /*
      If neither orientation fits the roll,
      mark the job as invalid.
    */

    if (!layout) {
      return {
        doesNotFit: true,
        rollWidth,
        designWidth,
        designHeight,
      };
    }

    const wastePercent =
      Number(material.wastePercent ?? pricing.defaultWastePercent ?? 0) || 0;

    /*
      Actual roll area consumed + production waste.
    */

    const baseConsumedSqft = layout.consumedSqft;

    const wasteSqft = baseConsumedSqft * (wastePercent / 100);

    const materialSqft = baseConsumedSqft + wasteSqft;

    const materialCost = materialSqft * costPerSqft;

    /*
      CUTTING
    */

    const cuttingCost =
      Number(pricing.cuttingBaseFee || 0) +
      totalFinishedSqft * Number(pricing.cuttingPerSqft || 0);

    /*
      WEEDING
    */

    let weedingRate = 0;

    if (complexity === "easy") {
      weedingRate = Number(pricing.easyWeedingPerSqft || 0);
    }

    if (complexity === "medium") {
      weedingRate = Number(pricing.mediumWeedingPerSqft || 0);
    }

    if (complexity === "complex") {
      weedingRate = Number(pricing.complexWeedingPerSqft || 0);
    }

    const weedingCost = totalFinishedSqft * weedingRate;

    /*
      TRANSFER TAPE
    */

    const transferTapeBaseCost = transferTape
      ? totalFinishedSqft * Number(pricing.transferTapeCostPerSqft || 0)
      : 0;

    const transferTapeMarkupAmount =
      transferTapeBaseCost * (Number(pricing.transferTapeMarkup || 0) / 100);

    const transferTapeCost = transferTapeBaseCost + transferTapeMarkupAmount;

    /*
      SETUP
    */

    const setupFee = Number(pricing.setupFee || 0);

    /*
      PRODUCTION COST
    */

    const productionCost =
      materialCost + cuttingCost + weedingCost + transferTapeCost + setupFee;

    /*
      PROFIT

      We are treating "Profit Margin" as markup:
      50% => production cost × 1.50
    */

    const markupPercent = Number(pricing.profitMargin || 0);

    const markupAmount = productionCost * (markupPercent / 100);

    const priceBeforeMinimum = productionCost + markupAmount;

    const minimumOrder = Number(pricing.minimumOrderPrice || 0);

    const productPrice = Math.max(priceBeforeMinimum, minimumOrder);

    /*
      INSTALLATION

      Installation is added after product pricing
      and is not affected by the product minimum.
    */

    let installationPrice = 0;

    if (installation) {
      const calculatedInstallation =
        totalFinishedSqft * Number(pricing.installationPerSqft || 0);

      installationPrice = Math.max(
        calculatedInstallation,
        Number(pricing.installationMinimum || 0),
      );
    }

    const finalPrice = productPrice + installationPrice;

    const priceEach = finalPrice / qty;

    return {
      doesNotFit: false,

      singleFinishedSqft,
      totalFinishedSqft,

      piecesPerRow: layout.piecesPerRow,
      rows: layout.rows,

      linearInches: layout.linearInches,
      linearFeet: layout.linearInches / 12,

      baseConsumedSqft,
      wastePercent,
      wasteSqft,
      materialSqft,

      materialCost,
      cuttingCost,
      weedingRate,
      weedingCost,

      transferTapeBaseCost,
      transferTapeMarkupAmount,
      transferTapeCost,

      setupFee,

      productionCost,
      markupPercent,
      markupAmount,

      priceBeforeMinimum,
      minimumOrder,
      minimumApplied: priceBeforeMinimum < minimumOrder,

      productPrice,
      installationPrice,
      finalPrice,
      priceEach,
    };
  }, [
    material,
    pricing,
    width,
    height,
    quantity,
    complexity,
    transferTape,
    installation,
  ]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-8">
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
          Loading vinyl lettering calculator...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* HEADER */}

      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <Calculator className="h-6 w-6 text-blue-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Vinyl Lettering Calculator
          </h1>
        </div>

        <p className="text-gray-500">
          Calculate cut vinyl lettering using your material and production
          costs.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        {/* LEFT */}

        <div className="space-y-6">
          {/* JOB */}

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <SectionHeader
              icon={Ruler}
              title="Job Details"
              description="Enter the finished size and quantity."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Material">
                <select
                  value={materialId}
                  onChange={(event) => setMaterialId(event.target.value)}
                  className="input"
                >
                  {materials.length === 0 && (
                    <option value="">No vinyl materials available</option>
                  )}

                  {materials.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.color ? ` - ${item.color}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Quantity">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Width (inches)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={width}
                  onChange={(event) => setWidth(event.target.value)}
                  className="input"
                  placeholder="48"
                />
              </Field>

              <Field label="Height (inches)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={height}
                  onChange={(event) => setHeight(event.target.value)}
                  className="input"
                  placeholder="9"
                />
              </Field>
            </div>

            {material && (
              <div className="mt-5 grid gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-3">
                <MiniStat
                  label="Roll Width"
                  value={`${material.rollWidthIn}"`}
                />

                <MiniStat
                  label="Material Cost"
                  value={`${money(material.costPerSqft)} / sq ft`}
                />

                <MiniStat
                  label="Waste"
                  value={`${Number(
                    material.wastePercent ?? pricing?.defaultWastePercent ?? 0,
                  )}%`}
                />
              </div>
            )}
          </section>

          {/* PRODUCTION OPTIONS */}

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <SectionHeader
              icon={Scissors}
              title="Production"
              description="Choose the complexity and finishing options."
            />

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Weeding Complexity
                </label>

                <div className="grid gap-3 md:grid-cols-3">
                  <ComplexityButton
                    active={complexity === "easy"}
                    title="Easy"
                    description="Large simple lettering"
                    onClick={() => setComplexity("easy")}
                  />

                  <ComplexityButton
                    active={complexity === "medium"}
                    title="Medium"
                    description="Normal lettering"
                    onClick={() => setComplexity("medium")}
                  />

                  <ComplexityButton
                    active={complexity === "complex"}
                    title="Complex"
                    description="Small detailed lettering"
                    onClick={() => setComplexity("complex")}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <OptionCard
                  icon={Layers}
                  title="Transfer Tape"
                  description="Include application tape"
                  checked={transferTape}
                  onChange={setTransferTape}
                />

                <OptionCard
                  icon={Wrench}
                  title="Installation"
                  description="Include installation"
                  checked={installation}
                  onChange={setInstallation}
                />
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT PRICE PANEL */}

        <div>
          <div className="sticky top-6">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />

                  <h2 className="font-semibold text-gray-900">Price Summary</h2>
                </div>
              </div>

              {!calculation ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  Enter width and height to calculate pricing.
                </div>
              ) : calculation.doesNotFit ? (
                <div className="p-6">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    This design does not fit the selected{" "}
                    {calculation.rollWidth}" roll in either orientation.
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3 p-6">
                    <PriceRow
                      label="Material"
                      value={money(calculation.materialCost)}
                    />

                    <PriceRow
                      label="Cutting"
                      value={money(calculation.cuttingCost)}
                    />

                    <PriceRow
                      label="Weeding"
                      value={money(calculation.weedingCost)}
                    />

                    {transferTape && (
                      <PriceRow
                        label="Transfer Tape"
                        value={money(calculation.transferTapeCost)}
                      />
                    )}

                    <PriceRow
                      label="Setup"
                      value={money(calculation.setupFee)}
                    />

                    <div className="my-4 border-t border-gray-100" />

                    <PriceRow
                      label="Production Cost"
                      value={money(calculation.productionCost)}
                      strong
                    />

                    <PriceRow
                      label={`Markup (${calculation.markupPercent}%)`}
                      value={money(calculation.markupAmount)}
                    />

                    {calculation.minimumApplied && (
                      <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                        Minimum order of {money(calculation.minimumOrder)}{" "}
                        applied.
                      </div>
                    )}

                    {installation && (
                      <>
                        <div className="my-4 border-t border-gray-100" />

                        <PriceRow
                          label="Installation"
                          value={money(calculation.installationPrice)}
                        />
                      </>
                    )}
                  </div>

                  <div className="border-t border-blue-100 bg-blue-50/70 p-6">
                    <div className="text-sm font-medium text-gray-500">
                      SELLING PRICE
                    </div>

                    <div className="mt-1 text-4xl font-bold tracking-tight text-gray-900">
                      {money(calculation.finalPrice)}
                    </div>

                    {Number(quantity) > 1 && (
                      <div className="mt-2 text-sm text-gray-500">
                        {money(calculation.priceEach)} each × {quantity}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid rgb(229 231 235);
          border-radius: 0.5rem;
          background: white;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(17 24 39);
          outline: none;
          transition: 150ms;
        }

        .input:focus {
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 2px rgb(219 234 254);
        }
      `}</style>
    </div>
  );
}

/* ======================================================
   COMPONENTS
====================================================== */

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>

      <div>
        <h2 className="font-semibold text-gray-900">{title}</h2>

        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>

      {children}
    </label>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold text-gray-800">{value}</div>
    </div>
  );
}

function ComplexityButton({ active, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition ${
        active
          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div
        className={`font-semibold ${
          active ? "text-blue-700" : "text-gray-900"
        }`}
      >
        {title}
      </div>

      <div className="mt-1 text-xs text-gray-500">{description}</div>
    </button>
  );
}

function OptionCard({ icon: Icon, title, description, checked, onChange }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition ${
        checked ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>

      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-900">{title}</div>

        <div className="mt-0.5 text-xs text-gray-500">{description}</div>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-gray-300"
      />
    </label>
  );
}

function BreakdownRow({ label, detail, strong = false }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0">
      <span
        className={
          strong
            ? "text-sm font-semibold text-gray-900"
            : "text-sm text-gray-600"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-sm font-bold text-gray-900"
            : "text-sm font-medium text-gray-800"
        }
      >
        {detail}
      </span>
    </div>
  );
}

function PriceRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? "text-sm font-semibold text-gray-900"
            : "text-sm text-gray-500"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-sm font-bold text-gray-900"
            : "text-sm font-semibold text-gray-800"
        }
      >
        {value}
      </span>
    </div>
  );
}

function money(value) {
  const number = Number(value) || 0;

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function capitalize(value) {
  if (!value) return "";

  return value.charAt(0).toUpperCase() + value.slice(1);
}
