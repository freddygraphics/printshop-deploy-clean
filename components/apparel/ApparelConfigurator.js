"use client";

import { useEffect, useMemo, useState } from "react";
const PRINT_LOCATIONS = [
  { key: "front", label: "Front" },
  { key: "back", label: "Back" },
  { key: "leftSleeve", label: "Left Sleeve" },
  { key: "rightSleeve", label: "Right Sleeve" },
  { key: "longLeftSleeve", label: "Long Left Sleeve" },
  { key: "longRightSleeve", label: "Long Right Sleeve" },
];

const DEFAULT_GANG_SHEETS = [
  { feet: 2, inches: 24, price: 19.99 },
  { feet: 5, inches: 60, price: 49.99 },
  { feet: 7, inches: 84, price: 69.99 },
  { feet: 10, inches: 120, price: 89.99 },
  { feet: 15, inches: 180, price: 109.99 },
  { feet: 20, inches: 240, price: 129.99 },
  { feet: 30, inches: 360, price: 179.99 },
];

const DEFAULT_SETTINGS = {
  active: true,
  dtfPricingMethod: "GANG_SHEET",
  dtfCostPerSqft: 4,
  dtfRollWidth: 22,
  dtfGap: 0.25,
  gangSheets: DEFAULT_GANG_SHEETS,
  defaultPrintLocations: [],
  laborPerLocation: 2.5,
  setupFeePerLocation: 10,
  minimumSetupFee: 15,
  supplierShippingFlat: 0,
  dtfShippingFlat: 0,
  shippingPercent: 0,
  wastePercent: 8,
  pricingMode: "MARGIN",
  defaultProfitMargin: 55,
  quantityMargins: [],
  minimumUnitPrice: 15,
  minimumOrderPrice: 40,
};

const SIZE_ORDER = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
];

function sortSizes(variants = []) {
  return [...variants].sort((a, b) => {
    const sizeA = String(a.size || "")
      .trim()
      .toUpperCase();
    const sizeB = String(b.size || "")
      .trim()
      .toUpperCase();

    const indexA = SIZE_ORDER.indexOf(sizeA);
    const indexB = SIZE_ORDER.indexOf(sizeB);

    if (indexA === -1 && indexB === -1) {
      return sizeA.localeCompare(sizeB, undefined, { numeric: true });
    }

    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });
}
function roundUpMoney(value) {
  return Math.ceil(Number(value || 0));
}

function money(value) {
  return roundUpMoney(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function calculateLocationLength(width, height, quantity, rollWidth, gap) {
  const w = Number(width);
  const h = Number(height);
  const qty = Number(quantity);

  if (w <= 0 || h <= 0 || qty <= 0) return 0;

  const normalPerRow = Math.floor((rollWidth + gap) / (w + gap));
  const rotatedPerRow = Math.floor((rollWidth + gap) / (h + gap));

  const normalLength =
    normalPerRow > 0 ? Math.ceil(qty / normalPerRow) * (h + gap) : Infinity;

  const rotatedLength =
    rotatedPerRow > 0 ? Math.ceil(qty / rotatedPerRow) * (w + gap) : Infinity;

  return Math.min(normalLength, rotatedLength);
}

function selectGangSheets(requiredInches, gangSheets) {
  if (!requiredInches || requiredInches <= 0) {
    return {
      sheets: [],
      totalLength: 0,
      totalCost: 0,
    };
  }

  const target = Math.ceil(requiredInches);
  const largestSheet = Math.max(
    1,
    ...gangSheets.map((sheet) => Number(sheet.inches || sheet.feet * 12)),
  );
  const maximum = target + largestSheet;
  const dp = Array(maximum + 1).fill(null);

  dp[0] = {
    cost: 0,
    sheets: [],
  };

  for (let length = 0; length <= maximum; length += 1) {
    if (!dp[length]) continue;

    for (const sheet of gangSheets) {
      const sheetInches = Math.round(
        Number(sheet.inches || Number(sheet.feet) * 12),
      );
      const nextLength = Math.min(maximum, length + sheetInches);
      const nextCost = dp[length].cost + Number(sheet.price || 0);

      if (!dp[nextLength] || nextCost < dp[nextLength].cost) {
        dp[nextLength] = {
          cost: nextCost,
          sheets: [...dp[length].sheets, sheet],
        };
      }
    }
  }

  let best = null;

  for (let length = target; length <= maximum; length += 1) {
    if (!dp[length]) continue;

    if (
      !best ||
      dp[length].cost < best.totalCost ||
      (dp[length].cost === best.totalCost && length < best.totalLength)
    ) {
      best = {
        sheets: dp[length].sheets,
        totalLength: length,
        totalCost: dp[length].cost,
      };
    }
  }

  return (
    best || {
      sheets: [],
      totalLength: 0,
      totalCost: 0,
    }
  );
}

function getQuantityPercent(settings, quantity) {
  const match = (settings.quantityMargins || []).find((range) => {
    const min = Number(range.minQuantity || 1);
    const max =
      range.maxQuantity === null ||
      range.maxQuantity === undefined ||
      range.maxQuantity === ""
        ? Infinity
        : Number(range.maxQuantity);

    return quantity >= min && quantity <= max;
  });

  return Number(match?.percent ?? settings.defaultProfitMargin ?? 0);
}

export default function ApparelConfigurator({
  product,
  initialData,
  onAdd,
  onChange,
  mode = "document",
  actionLabel = "Add to Invoice",
}) {
  const isProductMode = mode === "product";
  const colors = Array.isArray(product?.colors) ? product.colors : [];

  const [showMoreSizes, setShowMoreSizes] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");

  const [selectedColorName, setSelectedColorName] = useState(
    initialData?.options?.color || colors[0]?.name || "",
  );

  const [sizeQuantities, setSizeQuantities] = useState(() => {
    const existing = initialData?.options?.sizes || [];

    return existing.reduce((result, item) => {
      result[item.variantId] = Number(item.quantity || 0);
      return result;
    }, {});
  });

  const [prints, setPrints] = useState(() => {
    const existing = initialData?.options?.printLocations || [];

    return PRINT_LOCATIONS.reduce((result, location) => {
      const saved = existing.find((item) => item.key === location.key);

      result[location.key] = {
        enabled: Boolean(saved?.enabled),
        width: saved?.width || "",
        height: saved?.height || "",
      };

      return result;
    }, {});
  });

  useEffect(() => {
    let active = true;

    async function loadPricingSettings() {
      try {
        setSettingsLoading(true);
        setSettingsError("");

        const response = await fetch("/api/settings/apparel-pricing", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load apparel pricing.");
        }

        if (active) {
          const configuredLocations =
            Array.isArray(data.defaultPrintLocations) &&
            data.defaultPrintLocations.length > 0
              ? data.defaultPrintLocations
              : [];

          setSettings({
            ...DEFAULT_SETTINGS,
            ...data,

            gangSheets: Array.isArray(data.gangSheets)
              ? data.gangSheets
              : DEFAULT_GANG_SHEETS,

            defaultPrintLocations: configuredLocations,

            quantityMargins: Array.isArray(data.quantityMargins)
              ? data.quantityMargins
              : [],
          });

          const existingLocations = initialData?.options?.printLocations || [];

          setPrints(
            PRINT_LOCATIONS.reduce((result, location) => {
              const configured = configuredLocations.find(
                (item) => item.key === location.key,
              );

              const saved = existingLocations.find(
                (item) => item.key === location.key,
              );

              result[location.key] = {
                enabled: saved
                  ? saved.enabled === true
                  : configured?.enabled === true,

                width: saved?.width ?? configured?.width ?? "",

                height: saved?.height ?? configured?.height ?? "",
              };

              return result;
            }, {}),
          );
        }
      } catch (error) {
        if (active) {
          setSettingsError(error.message);
        }
      } finally {
        if (active) {
          setSettingsLoading(false);
        }
      }
    }

    loadPricingSettings();

    return () => {
      active = false;
    };
  }, []);

  const selectedColor = useMemo(
    () => colors.find((color) => color.name === selectedColorName),
    [colors, selectedColorName],
  );

  const selectedSizes = useMemo(() => {
    if (!selectedColor?.variants) return [];

    return sortSizes(selectedColor.variants)
      .map((variant) => ({
        variantId: variant.id,
        supplierSku: variant.supplierSku,
        size: variant.size,
        supplierPrice: Number(variant.supplierPrice || 0),
        inventory: Number(variant.inventory || 0),
        quantity: Number(sizeQuantities[variant.id] || 0),
      }))
      .filter((variant) => variant.quantity > 0);
  }, [selectedColor, sizeQuantities]);

  const calculation = useMemo(() => {
    const rollWidth = Math.max(1, Number(settings.dtfRollWidth || 22));
    const gap = Math.max(0, Number(settings.dtfGap || 0));

    const quantity = selectedSizes.reduce(
      (total, variant) => total + variant.quantity,
      0,
    );

    const apparelCost = selectedSizes.reduce(
      (total, variant) => total + variant.supplierPrice * variant.quantity,
      0,
    );

    const printLocations = PRINT_LOCATIONS.map((location) => {
      const values = prints[location.key];

      const requiredLength = values.enabled
        ? calculateLocationLength(
            values.width,
            values.height,
            quantity,
            rollWidth,
            gap,
          )
        : 0;

      return {
        key: location.key,
        label: location.label,
        enabled: values.enabled,
        width: Number(values.width || 0),
        height: Number(values.height || 0),
        quantity: values.enabled ? quantity : 0,
        requiredLength,
      };
    });

    const requiredLength = printLocations.reduce(
      (total, location) => total + location.requiredLength,
      0,
    );

    const activeGangSheets = (settings.gangSheets || [])
      .filter((sheet) => sheet.active !== false)
      .map((sheet) => ({
        ...sheet,
        feet: Number(sheet.feet || 0),
        inches: Number(sheet.feet || 0) * 12,
        price: Number(sheet.price || 0),
      }))
      .filter((sheet) => sheet.inches > 0);

    const gangSheet = selectGangSheets(requiredLength, activeGangSheets);

    const designSquareFeet = printLocations.reduce(
      (total, location) =>
        total + (location.width * location.height * location.quantity) / 144,
      0,
    );

    const dtfCost =
      settings.dtfPricingMethod === "SQUARE_FEET"
        ? designSquareFeet * Number(settings.dtfCostPerSqft || 0)
        : gangSheet.totalCost;

    const activeLocationCount = printLocations.filter(
      (location) => location.enabled,
    ).length;

    const laborCost =
      quantity * activeLocationCount * Number(settings.laborPerLocation || 0);

    const setupCost =
      activeLocationCount > 0
        ? Math.max(
            Number(settings.minimumSetupFee || 0),
            activeLocationCount * Number(settings.setupFeePerLocation || 0),
          )
        : 0;

    const wasteCost =
      (apparelCost + dtfCost) * (Number(settings.wastePercent || 0) / 100);

    const baseShipping =
      Number(settings.supplierShippingFlat || 0) +
      (activeLocationCount > 0 ? Number(settings.dtfShippingFlat || 0) : 0);

    const shippingCost =
      baseShipping * (1 + Number(settings.shippingPercent || 0) / 100);

    const productionCost =
      apparelCost + dtfCost + laborCost + setupCost + wasteCost + shippingCost;

    const appliedPercent = getQuantityPercent(settings, quantity);
    const calculatedSaleTotal =
      settings.pricingMode === "MARGIN"
        ? productionCost / Math.max(0.01, 1 - appliedPercent / 100)
        : productionCost * (1 + appliedPercent / 100);

    const minimumByUnit = Number(settings.minimumUnitPrice || 0) * quantity;
    const saleTotal =
      quantity > 0
        ? Math.max(
            calculatedSaleTotal,
            minimumByUnit,
            Number(settings.minimumOrderPrice || 0),
          )
        : 0;

    const unitPrice = quantity > 0 ? Math.ceil(saleTotal / quantity) : 0;

    const customerTotal = quantity > 0 ? unitPrice * quantity : 0;

    return {
      quantity,
      apparelCost,
      printLocations,
      requiredLength,
      designSquareFeet,
      gangSheet,
      dtfCost,
      activeLocationCount,
      laborCost,
      setupCost,
      wasteCost,
      shippingCost,
      productionCost,
      appliedPercent,
      saleTotal: customerTotal,
      unitPrice,
    };
  }, [selectedSizes, prints, settings]);

  function changeColor(colorName) {
    setSelectedColorName(colorName);
    setSizeQuantities({});
    setShowMoreSizes(false);
  }

  function updatePrint(key, patch) {
    setPrints((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...patch,
      },
    }));
  }

  function handleAdd() {
    if (settingsLoading) {
      alert("Apparel pricing is still loading.");
      return;
    }

    if (settingsError) {
      alert("Unable to load the current apparel pricing settings.");
      return;
    }

    if (settings.active === false) {
      alert("Apparel pricing is currently disabled in Settings.");
      return;
    }

    if (!selectedColor) {
      alert("Select a garment color.");
      return;
    }

    if (calculation.quantity <= 0) {
      alert("Enter a quantity for at least one size.");
      return;
    }

    const incompleteLocation = calculation.printLocations.find(
      (location) =>
        location.enabled && (location.width <= 0 || location.height <= 0),
    );

    if (incompleteLocation) {
      alert(`Enter the width and height for ${incompleteLocation.label}.`);
      return;
    }

    if (!Number.isFinite(calculation.requiredLength)) {
      alert(
        `One of the designs is wider than the ${settings.dtfRollWidth}-inch DTF roll.`,
      );
      return;
    }

    if (
      settings.pricingMode === "MARGIN" &&
      calculation.appliedPercent >= 100
    ) {
      alert("Profit margin must be less than 100%.");
      return;
    }

    const sizeDescription = selectedSizes
      .map((variant) => `${variant.quantity} ${variant.size}`)
      .join(" / ");

    const printDescription = calculation.printLocations
      .filter((location) => location.enabled)
      .map(
        (location) => `${location.label} ${location.width}x${location.height}"`,
      )
      .join(" + ");

    const description = [
      `${product.brand || "SanMar"} ${product.supplierStyle} - ${product.name}`,
      `Color: ${selectedColor.name}`,
      `Sizes: ${sizeDescription}`,
      printDescription ? `DTF: ${printDescription}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const configuredItem = {
      name: description,
      description,

      qty: calculation.quantity,
      unitPrice: calculation.unitPrice,
      subtotal: calculation.saleTotal,
      total: calculation.saleTotal,

      options: {
        ...(initialData?.options || {}),

        productType: "apparel",
        apparelProductId: product.id,
        supplier: product.supplier,
        supplierStyle: product.supplierStyle,
        brand: product.brand,

        color: selectedColor.name,
        colorCode: selectedColor.colorCode || null,
        sizes: selectedSizes,

        printLocations: calculation.printLocations,
        pricingMode: settings.pricingMode,
        appliedPercent: calculation.appliedPercent,

        dtf: {
          pricingMethod: settings.dtfPricingMethod,
          rollWidth: Number(settings.dtfRollWidth),
          gap: Number(settings.dtfGap),

          requiredLengthInches: Number(calculation.requiredLength.toFixed(2)),

          requiredLengthFeet: Number(
            (calculation.requiredLength / 12).toFixed(2),
          ),

          designSquareFeet: Number(calculation.designSquareFeet.toFixed(2)),

          sheets: calculation.gangSheet.sheets.map((sheet) => ({
            feet: sheet.feet,
            price: sheet.price,
          })),

          totalCost: Number(calculation.dtfCost.toFixed(2)),
        },

        costs: {
          apparel: Number(calculation.apparelCost.toFixed(2)),
          dtf: Number(calculation.dtfCost.toFixed(2)),
          labor: Number(calculation.laborCost.toFixed(2)),
          setup: Number(calculation.setupCost.toFixed(2)),
          waste: Number(calculation.wasteCost.toFixed(2)),
          shipping: Number(calculation.shippingCost.toFixed(2)),
          production: Number(calculation.productionCost.toFixed(2)),
        },
      },
    };

    onAdd?.(configuredItem);
  }

  useEffect(() => {
    if (!isProductMode) return;
    if (settingsLoading || settingsError) return;
    if (settings.active === false) return;
    if (!selectedColor) return;
    if (calculation.quantity <= 0) return;

    const incompleteLocation = calculation.printLocations.some(
      (location) =>
        location.enabled && (location.width <= 0 || location.height <= 0),
    );

    if (incompleteLocation) return;
    if (!Number.isFinite(calculation.requiredLength)) return;

    const sizeDescription = selectedSizes
      .map((variant) => `${variant.quantity} ${variant.size}`)
      .join(" / ");

    const printDescription = calculation.printLocations
      .filter((location) => location.enabled)
      .map(
        (location) => `${location.label} ${location.width}x${location.height}"`,
      )
      .join(" + ");

    const description = [
      `${product.brand || "SanMar"} ${product.supplierStyle || ""} - ${
        product.name
      }`,
      `Color: ${selectedColor.name}`,
      `Sizes: ${sizeDescription}`,
      printDescription ? `DTF: ${printDescription}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    onChange?.({
      name: description,
      description,

      qty: calculation.quantity,
      unitPrice: calculation.unitPrice,
      subtotal: calculation.saleTotal,
      total: calculation.saleTotal,

      options: {
        ...(initialData?.options || {}),

        productType: "apparel",
        apparelProductId: product.id,
        supplier: product.supplier,
        supplierStyle: product.supplierStyle,
        brand: product.brand,

        color: selectedColor.name,
        colorCode: selectedColor.colorCode || null,
        sizes: selectedSizes,

        printLocations: calculation.printLocations,
        pricingMode: settings.pricingMode,
        appliedPercent: calculation.appliedPercent,

        dtf: {
          pricingMethod: settings.dtfPricingMethod,
          rollWidth: Number(settings.dtfRollWidth),
          gap: Number(settings.dtfGap),

          requiredLengthInches: Number(calculation.requiredLength.toFixed(2)),

          requiredLengthFeet: Number(
            (calculation.requiredLength / 12).toFixed(2),
          ),

          designSquareFeet: Number(calculation.designSquareFeet.toFixed(2)),

          sheets: calculation.gangSheet.sheets.map((sheet) => ({
            feet: sheet.feet,
            price: sheet.price,
          })),

          totalCost: Number(calculation.dtfCost.toFixed(2)),
        },

        costs: {
          apparel: Number(calculation.apparelCost.toFixed(2)),
          dtf: Number(calculation.dtfCost.toFixed(2)),
          labor: Number(calculation.laborCost.toFixed(2)),
          setup: Number(calculation.setupCost.toFixed(2)),
          waste: Number(calculation.wasteCost.toFixed(2)),
          shipping: Number(calculation.shippingCost.toFixed(2)),
          production: Number(calculation.productionCost.toFixed(2)),
        },
      },
    });
  }, [
    isProductMode,
    settingsLoading,
    settingsError,
    settings.active,
    settings.pricingMode,
    settings.dtfPricingMethod,
    settings.dtfRollWidth,
    settings.dtfGap,
    selectedColor,
    selectedSizes,
    calculation,
    product,
    initialData,
    onChange,
  ]);
  const sortedVariants = sortSizes(selectedColor?.variants || []);

  const regularVariants = sortedVariants.filter((variant) => {
    const size = String(variant.size || "")
      .trim()
      .toUpperCase();

    return ["XS", "S", "M", "L"].includes(size);
  });

  const extendedVariants = sortedVariants.filter((variant) => {
    const size = String(variant.size || "")
      .trim()
      .toUpperCase();

    return !["XS", "S", "M", "L"].includes(size);
  });

  const visibleVariants = showMoreSizes
    ? [...regularVariants, ...extendedVariants]
    : regularVariants;
  return (
    <div className="space-y-6">
      {settingsLoading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Loading current apparel pricing settings...
        </div>
      )}

      {settingsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {settingsError}
        </div>
      )}

      <div>
        <label className="text-sm font-semibold text-gray-700">
          Garment color
        </label>

        <select
          value={selectedColorName}
          onChange={(event) => changeColor(event.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5"
        >
          <option value="">Select color</option>

          {colors.map((color) => (
            <option key={color.name} value={color.name}>
              {color.name}
            </option>
          ))}
        </select>
      </div>

      {selectedColor && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Sizes and quantities
          </h3>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {visibleVariants.map((variant) => (
              <div
                key={variant.id}
                className="rounded-lg border border-gray-200 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{variant.size}</span>

                  <span className="text-xs text-gray-500">
                    {money(variant.supplierPrice)}
                  </span>
                </div>

                <p className="mt-1 text-xs text-gray-400">
                  Stock: {variant.inventory || 0}
                </p>

                <input
                  type="number"
                  min="0"
                  max={variant.inventory || undefined}
                  value={sizeQuantities[variant.id] || ""}
                  onChange={(event) =>
                    setSizeQuantities((current) => ({
                      ...current,
                      [variant.id]: Math.max(
                        0,
                        Number(event.target.value || 0),
                      ),
                    }))
                  }
                  placeholder="Qty"
                  className="mt-2 w-full rounded-md border border-gray-200 px-2 py-2"
                />
              </div>
            ))}
          </div>
          {extendedVariants.length > 0 && (
            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={showMoreSizes}
                onChange={(event) => setShowMoreSizes(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              More sizes
              <span className="font-normal text-gray-500">
                (XL, 2XL, 3XL, 4XL, 5XL)
              </span>
            </label>
          )}
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          DTF print locations
        </h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {PRINT_LOCATIONS.map((location) => {
            const values = prints[location.key];

            return (
              <div
                key={location.key}
                className="rounded-lg border border-gray-200 p-4"
              >
                <label className="flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={values.enabled}
                    onChange={(event) =>
                      updatePrint(location.key, {
                        enabled: event.target.checked,
                      })
                    }
                  />

                  {location.label}
                </label>

                {values.enabled && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">
                        Width (in)
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        value={values.width}
                        onChange={(event) =>
                          updatePrint(location.key, {
                            width: event.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-md border px-2 py-2"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">
                        Height (in)
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        value={values.height}
                        onChange={(event) =>
                          updatePrint(location.key, {
                            height: event.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-md border px-2 py-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700">
          Pricing applied automatically
        </label>

        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="font-semibold text-gray-900">
            {calculation.appliedPercent}%{" "}
            {settings.pricingMode === "MARGIN" ? "profit margin" : "markup"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Selected from Quantity Pricing for {calculation.quantity || 0}{" "}
            garments.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">Garments</p>
            <p className="font-semibold">{money(calculation.apparelCost)}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">DTF required</p>
            <p className="font-semibold">
              {(calculation.requiredLength / 12).toFixed(2)} ft
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">DTF cost</p>
            <p className="font-semibold">{money(calculation.dtfCost)}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Labor</p>
            <p className="font-semibold">{money(calculation.laborCost)}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Setup</p>
            <p className="font-semibold">{money(calculation.setupCost)}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Waste allowance</p>
            <p className="font-semibold">{money(calculation.wasteCost)}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Shipping</p>
            <p className="font-semibold">{money(calculation.shippingCost)}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Total cost</p>
            <p className="font-semibold">{money(calculation.productionCost)}</p>
          </div>
        </div>

        {settings.dtfPricingMethod === "GANG_SHEET" &&
          calculation.gangSheet.sheets.length > 0 && (
            <p className="mt-4 text-sm text-gray-600">
              Gang Sheets:{" "}
              {calculation.gangSheet.sheets
                .map((sheet) => `${sheet.feet} ft`)
                .join(" + ")}
            </p>
          )}

        <div className="mt-5 flex items-end justify-between border-t border-blue-200 pt-4">
          <div>
            <p className="text-xs uppercase text-gray-500">Unit price</p>

            <p className="text-xl font-semibold text-blue-700">
              {money(calculation.unitPrice)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase text-gray-500">Customer total</p>

            <p className="text-2xl font-semibold text-blue-700">
              {money(calculation.saleTotal)}
            </p>
          </div>
        </div>
      </div>

      {!isProductMode && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAdd}
            className="h-11 rounded-xl bg-blue-600 px-6 font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
