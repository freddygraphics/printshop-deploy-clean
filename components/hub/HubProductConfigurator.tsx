"use client";

import { useEffect, useMemo, useState } from "react";

/* =====================================================
   TYPES
===================================================== */

type PriceBreak = {
  quantity: number;
  price: number;
  discountCode?: string | null;
  uom?: string | null;
};

type Variant = {
  partId: string;
  description: string | null;
  colorName: string | null;
  standardColor: string | null;
  hex: string | null;
  inkColor: string | null;

  stock: number;
  stockMessage: string | null;
  stockUpdatedAt: string | null;

  netPricing: PriceBreak[];

  leadTime: number | null;
  material: string | null;
  countryOfOrigin: string | null;
};

type ChargePrice = {
  quantity: number;
  price: number;
  repeatPrice?: number | null;
  discountCode?: string | null;
  uom?: string | null;
};

type Charge = {
  id: number;
  name: string | null;
  description: string | null;
  type: string | null;
  prices: ChargePrice[];
};

type Decoration = {
  id: number;
  name: string | null;
  geometry: string | null;
  width: number | null;
  height: number | null;
  diameter?: number | null;
  uom: string | null;
  charges: Charge[];
};

type DecorationLocation = {
  locationId: number;
  name: string | null;
  defaultLocation: boolean;
  decorations: Decoration[];
};

type HubProduct = {
  supplier: string;
  productId: string;
  name: string | null;
  description: string | null;
  image: string | null;

  category: string | null;
  subCategory: string | null;

  leadTime: number | null;
  material: string | null;

  publishedPricing: PriceBreak[];
  netPricing: PriceBreak[];

  decorationLocations: DecorationLocation[];

  variants: Variant[];

  fob: {
    id: number | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;
};

type DecorationOptionData = {
  key: string;
  type: "standard" | "ppc";
  title: string;
  subtitle: string;
  location: DecorationLocation | null;
  decoration: Decoration | null;
};

/* =====================================================
   HELPERS
===================================================== */

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function moneyUnit(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

function getPriceForQuantity(prices: PriceBreak[], quantity: number) {
  const sorted = [...prices].sort((a, b) => a.quantity - b.quantity);

  let selected: PriceBreak | null = null;

  for (const price of sorted) {
    if (quantity >= price.quantity) {
      selected = price;
    }
  }

  return selected;
}

function getChargePriceForQuantity(prices: ChargePrice[], quantity: number) {
  const sorted = [...prices].sort((a, b) => a.quantity - b.quantity);

  let selected: ChargePrice | null = null;

  for (const price of sorted) {
    if (quantity >= price.quantity) {
      selected = price;
    }
  }

  return selected;
}

function getVariantColorKey(variant: Variant) {
  return (
    variant.hex || variant.standardColor || variant.colorName || variant.partId
  );
}

function cleanDecorationName(name: string | null, productId: string) {
  if (!name) {
    return "Decoration";
  }

  let result = name;

  result = result.replace(new RegExp(`^${productId}\\s*`, "i"), "");

  result = result.replace(/^DIA\s*/i, "");

  return result.trim() || "Decoration";
}

function cleanLocationName(name: string | null, productId: string) {
  if (!name) {
    return "Decoration Location";
  }

  let result = name;

  result = result.replace(new RegExp(`^${productId}\\s*`, "i"), "");

  result = result.replace(/^Full Color\s+Full Color/i, "Full Color").trim();

  return result || "Decoration Location";
}

function getStandardDecorationText(product: HubProduct) {
  const description = product.description || "";

  const match = description.match(
    /Standard Decoration Includes:\s*([\s\S]*?)(?:All Available Decoration Options:|Tip Type:|Mechanism:|Standard Packaging:|Tags:|$)/i,
  );

  if (match?.[1]) {
    const cleaned = match[1].replace(/\s+/g, " ").trim();

    if (cleaned) {
      return cleaned;
    }
  }

  return "Standard decoration included";
}

function getColorDisplayHex(variant: Variant) {
  const raw = variant.hex?.replace("#", "") || "";

  if (/^[0-9a-fA-F]{6}$/.test(raw) || /^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw}`;
  }

  const name = variant.standardColor?.toLowerCase() || "";

  const fallback: Record<string, string> = {
    black: "#111111",
    blue: "#2563eb",
    clear: "#e5e7eb",
    green: "#15803d",
    red: "#dc2626",
    yellow: "#facc15",
    pink: "#ec4899",
    orange: "#f97316",
    purple: "#9333ea",
    white: "#ffffff",
    gray: "#9ca3af",
    grey: "#9ca3af",
    brown: "#92400e",
  };

  return fallback[name] || "#ffffff";
}

function getEstimatedShipping(quantity: number) {
  if (quantity >= 5000) return 140;
  if (quantity >= 2500) return 100;
  if (quantity >= 1000) return 60;
  if (quantity >= 500) return 35;
  if (quantity >= 250) return 25;

  return 0;
}

/* =====================================================
   COMPONENT
===================================================== */

export default function HubProductConfigurator({
  productId = "328",
}: {
  productId?: string;
}) {
  const [product, setProduct] = useState<HubProduct | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState<number>(250);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const [selectedInk, setSelectedInk] = useState<string>("");

  const [selectedDecorationKey, setSelectedDecorationKey] =
    useState<string>("standard");

  const [markupPercent, setMarkupPercent] = useState<number>(0);

  const [supplierShipping, setSupplierShipping] = useState<number>(0);
  const [shippingAuto, setShippingAuto] = useState(true);

  const [markupLoading, setMarkupLoading] = useState(true);

  /* =====================================================
     LOAD PRODUCT
  ===================================================== */

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/hub/product/${productId}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "Unable to load Hub product");
        }

        setProduct(data.product);

        const firstQuantity = data.product?.netPricing?.[0]?.quantity;

        if (firstQuantity) {
          setQuantity(Number(firstQuantity));
        }

        const firstVariant = data.product?.variants?.[0];

        if (firstVariant) {
          setSelectedColor(getVariantColorKey(firstVariant));

          setSelectedInk(firstVariant.inkColor || "");
        }

        setSelectedDecorationKey("standard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load product");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  /* =====================================================
   LOAD SUPPLIER MARKUP
===================================================== */

  useEffect(() => {
    async function loadMarkup() {
      try {
        setMarkupLoading(true);

        const response = await fetch(
          `/api/settings/supplier-pricing?supplier=Hub`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (
          response.ok &&
          data?.success &&
          Number.isFinite(Number(data?.settings?.markup))
        ) {
          setMarkupPercent(Number(data.settings.markup));
        } else {
          setMarkupPercent(50);
        }
      } catch (error) {
        console.error("Unable to load Hub markup:", error);

        setMarkupPercent(50);
      } finally {
        setMarkupLoading(false);
      }
    }

    loadMarkup();
  }, []);

  useEffect(() => {
    if (shippingAuto) {
      setSupplierShipping(getEstimatedShipping(quantity));
    }
  }, [quantity, shippingAuto]);
  /* =====================================================
     COLORS
  ===================================================== */

  const colors = useMemo(() => {
    if (!product) {
      return [];
    }

    const map = new Map<
      string,
      {
        key: string;
        name: string;
        hex: string;
      }
    >();

    product.variants.forEach((variant) => {
      const colorKey = getVariantColorKey(variant);

      if (!map.has(colorKey)) {
        const cleanName =
          variant.colorName
            ?.replace(/\s+with\s+(Black|Blue)\s+Ink.*$/i, "")
            .trim() ||
          variant.standardColor ||
          colorKey;

        map.set(colorKey, {
          key: colorKey,
          name: cleanName,
          hex: getColorDisplayHex(variant),
        });
      }
    });

    return Array.from(map.values());
  }, [product]);

  /* =====================================================
     AVAILABLE INKS
  ===================================================== */

  const availableInks = useMemo(() => {
    if (!product || !selectedColor) {
      return [];
    }

    return Array.from(
      new Set(
        product.variants
          .filter((variant) => getVariantColorKey(variant) === selectedColor)
          .map((variant) => variant.inkColor)
          .filter((ink): ink is string => Boolean(ink)),
      ),
    );
  }, [product, selectedColor]);

  useEffect(() => {
    if (availableInks.length > 0 && !availableInks.includes(selectedInk)) {
      setSelectedInk(availableInks[0]);
    }
  }, [availableInks, selectedInk]);

  /* =====================================================
     SELECTED VARIANT
  ===================================================== */

  const selectedVariant = useMemo(() => {
    if (!product) {
      return null;
    }

    return (
      product.variants.find(
        (variant) =>
          getVariantColorKey(variant) === selectedColor &&
          variant.inkColor === selectedInk,
      ) || null
    );
  }, [product, selectedColor, selectedInk]);

  /* =====================================================
     BASE NET PRICE
  ===================================================== */

  const netBreak = useMemo(() => {
    if (!product) {
      return null;
    }

    const prices = selectedVariant?.netPricing?.length
      ? selectedVariant.netPricing
      : product.netPricing;

    return getPriceForQuantity(prices, quantity);
  }, [product, selectedVariant, quantity]);

  const unitCost = netBreak?.price ?? 0;

  const productCost = unitCost * quantity;

  /* =====================================================
     DECORATION OPTIONS
  ===================================================== */

  const decorationOptions = useMemo<DecorationOptionData[]>(() => {
    if (!product) {
      return [];
    }

    const options: DecorationOptionData[] = [
      {
        key: "standard",
        type: "standard",
        title: "Standard Decoration",
        subtitle: getStandardDecorationText(product),
        location: null,
        decoration: null,
      },
    ];

    product.decorationLocations.forEach((location) => {
      location.decorations.forEach((decoration) => {
        if (!decoration.charges?.length) {
          return;
        }

        const decorationName = cleanDecorationName(
          decoration.name,
          product.productId,
        );

        const locationName = cleanLocationName(
          location.name,
          product.productId,
        );

        let subtitle = locationName;

        if (decoration.width && decoration.height) {
          subtitle += ` • ${decoration.width}" × ${decoration.height}"`;
        }

        options.push({
          key: `${location.locationId}:${decoration.id}`,
          type: "ppc",
          title: decorationName,
          subtitle,
          location,
          decoration,
        });
      });
    });

    return options;
  }, [product]);

  /* =====================================================
     GROUP PPC DECORATIONS BY LOCATION
  ===================================================== */

  const groupedDecorationOptions = useMemo(() => {
    const groups = new Map<
      number,
      {
        locationId: number;
        name: string;
        options: DecorationOptionData[];
      }
    >();

    decorationOptions
      .filter((option) => option.type === "ppc" && option.location)
      .forEach((option) => {
        const location = option.location!;

        const existing = groups.get(location.locationId);

        if (existing) {
          existing.options.push(option);
          return;
        }

        groups.set(location.locationId, {
          locationId: location.locationId,
          name: cleanLocationName(location.name, product?.productId || ""),
          options: [option],
        });
      });

    return Array.from(groups.values());
  }, [decorationOptions, product]);

  /* =====================================================
     KEEP DECORATION VALID
  ===================================================== */

  useEffect(() => {
    if (decorationOptions.length === 0) {
      return;
    }

    const exists = decorationOptions.some(
      (option) => option.key === selectedDecorationKey,
    );

    if (!exists) {
      setSelectedDecorationKey(decorationOptions[0].key);
    }
  }, [decorationOptions, selectedDecorationKey]);

  /* =====================================================
     SELECTED DECORATION
  ===================================================== */

  const selectedDecoration = useMemo(() => {
    return (
      decorationOptions.find(
        (option) => option.key === selectedDecorationKey,
      ) ||
      decorationOptions[0] ||
      null
    );
  }, [decorationOptions, selectedDecorationKey]);

  /* =====================================================
     STANDARD SETUP FALLBACK
  ===================================================== */

  const standardSetup = useMemo(() => {
    if (!product) {
      return 0;
    }

    const setupPrices = product.decorationLocations
      .flatMap((location) => location.decorations)
      .flatMap((decoration) => decoration.charges)
      .filter((charge) => charge.type?.toLowerCase() === "setup")
      .flatMap((charge) => charge.prices)
      .map((price) => Number(price.price))
      .filter((price) => Number.isFinite(price) && price > 0);

    if (setupPrices.length === 0) {
      return 0;
    }

    return Math.min(...setupPrices);
  }, [product]);

  /* =====================================================
     DECORATION COST
  ===================================================== */

  const decorationCost = useMemo(() => {
    if (!product || !selectedDecoration) {
      return {
        setup: 0,
        runPerUnit: 0,
        runTotal: 0,
        total: 0,
      };
    }

    if (selectedDecoration.type === "standard") {
      return {
        setup: standardSetup,
        runPerUnit: 0,
        runTotal: 0,
        total: standardSetup,
      };
    }

    const decoration = selectedDecoration.decoration;

    if (!decoration) {
      return {
        setup: 0,
        runPerUnit: 0,
        runTotal: 0,
        total: 0,
      };
    }

    const setupCharge = decoration.charges.find(
      (charge) => charge.type?.toLowerCase() === "setup",
    );

    const runCharge = decoration.charges.find(
      (charge) => charge.type?.toLowerCase() === "run",
    );

    const setupBreak = getChargePriceForQuantity(
      setupCharge?.prices || [],
      quantity,
    );

    const setupPrice =
      setupBreak?.price ?? setupCharge?.prices?.[0]?.price ?? 0;

    const runBreak = getChargePriceForQuantity(
      runCharge?.prices || [],
      quantity,
    );

    const runPerUnit = runBreak?.price ?? 0;

    const runTotal = runPerUnit * quantity;

    return {
      setup: setupPrice,
      runPerUnit,
      runTotal,
      total: setupPrice + runTotal,
    };
  }, [product, selectedDecoration, quantity, standardSetup]);

  /* =====================================================
     TOTALS
  ===================================================== */

  const totalSupplierCost =
    productCost + decorationCost.total + supplierShipping;

  const salePrice = totalSupplierCost * (1 + markupPercent / 100);

  const customerUnitPrice = quantity > 0 ? salePrice / quantity : 0;

  const grossProfit = salePrice - totalSupplierCost;

  const marginPercent = salePrice > 0 ? (grossProfit / salePrice) * 100 : 0;

  /* =====================================================
     UI STATES
  ===================================================== */

  if (loading) {
    return (
      <div className="rounded-xl border border-[#ededed] bg-white p-8">
        Loading Hub product...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        {error}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-xl border border-[#ededed] bg-white p-8">
        Product not found.
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* PRODUCT */}

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="rounded-xl border border-[#ededed] bg-white p-6">
          <div className="flex min-h-[380px] items-center justify-center">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name || "Hub product"}
                className="max-h-[360px] max-w-full object-contain"
              />
            ) : (
              <div className="text-sm text-gray-400">No image</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#ededed] bg-white p-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {product.supplier} • #{product.productId}
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">
            {product.name}
          </h1>

          <div className="mt-2 text-sm text-gray-500">
            {product.category}

            {product.subCategory ? ` / ${product.subCategory}` : ""}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <InfoBox
              label="Lead Time"
              value={`${product.leadTime ?? "-"} days`}
            />

            <InfoBox label="Material" value={product.material || "-"} />

            <InfoBox
              label="Stock"
              value={
                selectedVariant ? selectedVariant.stock.toLocaleString() : "-"
              }
            />

            <InfoBox
              label="FOB"
              value={
                product.fob ? `${product.fob.city}, ${product.fob.state}` : "-"
              }
            />
          </div>
          {/* QUANTITY */}

          <div className="mt-8">
            <div className="mb-3 text-sm font-semibold text-gray-800">
              Quantity
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              {/* PRICE BREAK BUTTONS */}
              <div className="flex flex-wrap gap-2">
                {product.netPricing.map((price) => {
                  const active = netBreak?.quantity === price.quantity;

                  return (
                    <button
                      key={price.quantity}
                      type="button"
                      onClick={() => setQuantity(price.quantity)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-[#dedede] bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {price.quantity.toLocaleString()}
                    </button>
                  );
                })}
              </div>

              {/* CUSTOM QUANTITY */}
              <div className="w-full xl:ml-auto xl:w-[180px]">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Custom Quantity
                </label>

                <input
                  type="number"
                  min={
                    product.netPricing.length
                      ? Math.min(
                          ...product.netPricing.map((price) => price.quantity),
                        )
                      : 1
                  }
                  step="1"
                  value={quantity}
                  onChange={(e) => {
                    const value = Number(e.target.value);

                    setQuantity(
                      Number.isFinite(value)
                        ? Math.max(0, Math.floor(value))
                        : 0,
                    );
                  }}
                  className="w-full rounded-lg border border-[#dedede] bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-500"
                />
              </div>
            </div>

            {/* APPLIED PRICE BREAK */}
            {netBreak && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>
                  Applied price break:{" "}
                  <strong className="font-semibold text-gray-700">
                    {netBreak.quantity.toLocaleString()}
                  </strong>
                </span>

                <span>
                  NET:{" "}
                  <strong className="font-semibold text-gray-700">
                    {moneyUnit(netBreak.price)} / ea.
                  </strong>
                </span>
              </div>
            )}

            {/* MINIMUM QUANTITY WARNING */}
            {product.netPricing.length > 0 &&
              quantity <
                Math.min(
                  ...product.netPricing.map((price) => price.quantity),
                ) && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Minimum quantity for this product is{" "}
                  <strong>
                    {Math.min(
                      ...product.netPricing.map((price) => price.quantity),
                    ).toLocaleString()}
                  </strong>
                  .
                </div>
              )}
          </div>

          {/* COLORS */}

          <div className="mt-7">
            <div className="mb-3 text-sm font-semibold text-gray-800">
              Product Color
            </div>

            <div className="flex flex-wrap gap-3">
              {colors.map((color) => {
                const active = selectedColor === color.key;

                return (
                  <button
                    key={color.key}
                    type="button"
                    onClick={() => setSelectedColor(color.key)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      active
                        ? "border-gray-900 ring-1 ring-gray-900"
                        : "border-[#dedede]"
                    }`}
                  >
                    <span
                      className="h-5 w-5 rounded-full border border-black/10"
                      style={{
                        backgroundColor: color.hex,
                      }}
                    />

                    {color.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* INK */}

          {availableInks.length > 0 && (
            <div className="mt-7">
              <div className="mb-3 text-sm font-semibold text-gray-800">
                Ink Color
              </div>

              <div className="flex flex-wrap gap-2">
                {availableInks.map((ink) => (
                  <button
                    key={ink}
                    type="button"
                    onClick={() => setSelectedInk(ink)}
                    className={`rounded-lg border px-4 py-2 text-sm ${
                      selectedInk === ink
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-[#dedede] bg-white text-gray-700"
                    }`}
                  >
                    {ink}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STOCK */}

          {selectedVariant && (
            <div className="mt-6 rounded-lg bg-[#f6f7f9] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {selectedVariant.description}
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    {selectedVariant.partId}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-lg font-semibold ${
                      selectedVariant.stock > 0
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    {selectedVariant.stock.toLocaleString()}
                  </div>

                  <div className="text-xs text-gray-500">available</div>
                </div>
              </div>

              {selectedVariant.stockMessage && (
                <div className="mt-3 text-sm font-medium text-orange-600">
                  {selectedVariant.stockMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =================================================
          DECORATION + PRICE
      ================================================= */}

      <div className="grid gap-6 lg:grid-cols-[1fr_430px]">
        {/* DECORATION */}

        <div className="rounded-xl border border-[#ededed] bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Decoration</h2>

          {/* STANDARD */}

          <div className="mt-5">
            <DecorationOption
              title="Standard Decoration"
              subtitle={getStandardDecorationText(product)}
              checked={selectedDecorationKey === "standard"}
              onClick={() => setSelectedDecorationKey("standard")}
            />
          </div>

          {/* PPC GROUPS */}

          {groupedDecorationOptions.map((group) => (
            <div
              key={group.locationId}
              className="mt-6 rounded-xl border border-[#ededed] p-4"
            >
              <div className="mb-3">
                <div className="text-sm font-semibold text-gray-900">
                  {group.name}
                </div>

                <div className="mt-1 text-xs text-gray-500">
                  Available decoration options
                </div>
              </div>

              <div className="space-y-2">
                {group.options.map((option) => (
                  <DecorationOption
                    key={option.key}
                    title={option.title}
                    subtitle={
                      option.decoration?.width && option.decoration?.height
                        ? `${option.decoration.width}" × ${option.decoration.height}"`
                        : option.subtitle
                    }
                    checked={selectedDecorationKey === option.key}
                    onClick={() => setSelectedDecorationKey(option.key)}
                    compact
                  />
                ))}
              </div>
            </div>
          ))}

          {/* SELECTED DECORATION */}

          {selectedDecoration && (
            <div className="mt-6 rounded-lg bg-[#f6f7f9] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Selected Decoration
              </div>

              <div className="mt-1 text-sm font-semibold text-gray-900">
                {selectedDecoration.title}
              </div>

              {selectedDecoration.location && (
                <div className="mt-1 text-xs text-gray-500">
                  {cleanLocationName(
                    selectedDecoration.location.name,
                    product.productId,
                  )}
                </div>
              )}

              {selectedDecoration.decoration && (
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
                  {selectedDecoration.decoration.width &&
                    selectedDecoration.decoration.height && (
                      <span>
                        Imprint: {selectedDecoration.decoration.width}" ×{" "}
                        {selectedDecoration.decoration.height}"
                      </span>
                    )}

                  {selectedDecoration.decoration.geometry && (
                    <span>
                      Geometry: {selectedDecoration.decoration.geometry}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MARKUP */}

          <div className="mt-8">
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              Markup %
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={markupPercent}
              disabled={markupLoading}
              onChange={(e) => setMarkupPercent(Number(e.target.value))}
              className="w-40 rounded-lg border border-[#dedede] px-3 py-2 outline-none focus:border-gray-500 disabled:bg-gray-100 disabled:text-gray-400"
            />
          </div>
        </div>

        {/* PRICE SUMMARY */}

        <div className="rounded-xl border border-[#ededed] bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Price Summary</h2>

          <div className="mt-6 space-y-3 text-sm">
            <PriceRow
              label={`${quantity.toLocaleString()} × ${moneyUnit(unitCost)}`}
              value={productCost}
            />

            <PriceRow label="Setup" value={decorationCost.setup} />

            {decorationCost.runPerUnit > 0 && (
              <PriceRow
                label={`Run charge (${money(decorationCost.runPerUnit)} ea.)`}
                value={decorationCost.runTotal}
              />
            )}
            <div className="rounded-lg border border-[#ededed] bg-[#fafafa] p-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Estimated Supplier Shipping
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    {shippingAuto
                      ? "Estimated automatically by quantity"
                      : "Manual shipping amount"}
                  </div>
                </div>

                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    $
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={supplierShipping}
                    onChange={(e) => {
                      setShippingAuto(false);

                      setSupplierShipping(
                        Math.max(0, Number(e.target.value) || 0),
                      );
                    }}
                    className="w-full rounded-lg border border-[#dedede] bg-white py-2 pl-7 pr-3 text-right text-sm outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              {!shippingAuto && (
                <button
                  type="button"
                  onClick={() => {
                    setShippingAuto(true);
                    setSupplierShipping(getEstimatedShipping(quantity));
                  }}
                  className="mt-3 text-xs font-medium text-gray-600 underline hover:text-gray-900"
                >
                  Restore automatic estimate
                </button>
              )}
            </div>
            <div className="border-t border-[#ededed] pt-3">
              <PriceRow
                label="Supplier Cost"
                value={totalSupplierCost}
                strong
              />
            </div>

            <PriceRow
              label={`Markup (${markupPercent}%)`}
              value={salePrice - totalSupplierCost}
            />

            <div className="mt-4 rounded-xl bg-[#f6f7f9] p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Customer Price
              </div>

              <div className="mt-1 text-3xl font-bold text-gray-900">
                {money(salePrice)}
              </div>

              <div className="mt-1 text-sm text-gray-500">
                {money(customerUnitPrice)} each
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <InfoBox label="Gross Profit" value={money(grossProfit)} />

              <InfoBox label="Margin" value={`${marginPercent.toFixed(1)}%`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   INFO BOX
===================================================== */

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f6f7f9] px-3 py-3">
      <div className="text-xs text-gray-500">{label}</div>

      <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

/* =====================================================
   PRICE ROW
===================================================== */

function PriceRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={strong ? "font-semibold text-gray-900" : "text-gray-600"}
      >
        {label}
      </span>

      <span
        className={strong ? "font-semibold text-gray-900" : "text-gray-800"}
      >
        {money(value)}
      </span>
    </div>
  );
}

/* =====================================================
   DECORATION OPTION
===================================================== */

function DecorationOption({
  title,
  subtitle,
  checked,
  onClick,
  compact = false,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-xl border text-left transition ${
        compact ? "p-3" : "p-4"
      } ${
        checked
          ? "border-gray-900 bg-gray-50"
          : "border-[#ededed] hover:bg-gray-50"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          checked ? "border-gray-900" : "border-gray-300"
        }`}
      >
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-gray-900" />}
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900">
          {title}
        </span>

        <span className="mt-0.5 block text-xs text-gray-500">{subtitle}</span>
      </span>
    </button>
  );
}
