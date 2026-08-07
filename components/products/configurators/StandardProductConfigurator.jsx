"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import ConfigurableTemplateEditor from "@/components/invoice/ConfigurableTemplateEditor";
import { calculateOptionPricing } from "@/lib/product-builder/pricing";
import { normalizeOptionGroups } from "@/lib/product-builder/normalizeOptionGroups";

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

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function createTemporaryId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `product-${Date.now()}`;
}

export default function StandardProductConfigurator({
  product,
  onChange,
  initialData = null,
}) {
  const configuration = useMemo(() => {
    const value = product?.defaultOptions;

    if (!value || Array.isArray(value) || typeof value !== "object") {
      return {};
    }

    return value;
  }, [product]);

  const optionGroups = useMemo(() => {
    return normalizeOptionGroups(configuration.productOptions || []);
  }, [configuration.productOptions]);

  const pricingRows = useMemo(() => {
    return Array.isArray(configuration.pricing) ? configuration.pricing : [];
  }, [configuration.pricing]);

  const measurements = configuration.measurements ?? {};

  const initialDynamicOptions = useMemo(() => {
    if (
      initialData?.options?.dynamicOptions &&
      Object.keys(initialData.options.dynamicOptions).length > 0
    ) {
      return initialData.options.dynamicOptions;
    }

    return optionGroups.reduce((result, group) => {
      if (!group.key) return result;

      if (group.type === "checkbox") {
        result[group.key] = false;
        return result;
      }

      const defaultValue =
        group.values?.find((value) => value.default)?.key ??
        group.values?.[0]?.key ??
        "";

      result[group.key] = defaultValue;

      return result;
    }, {});
  }, [initialData, optionGroups]);

  const firstQuantity = useMemo(() => {
    if (initialData?.qty) {
      return Number(initialData.qty);
    }

    const firstRow = pricingRows[0];

    return Number(firstRow?.minQty ?? firstRow?.qty ?? 1);
  }, [initialData, pricingRows]);

  const [qty, setQty] = useState(firstQuantity);
  const [dynamicOptions, setDynamicOptions] = useState(initialDynamicOptions);

  const [width, setWidth] = useState(initialData?.options?.width ?? "");

  const [height, setHeight] = useState(initialData?.options?.height ?? "");

  const [unit, setUnit] = useState(initialData?.options?.unit ?? "in");

  const [calculatedItem, setCalculatedItem] = useState(null);

  const temporaryId = useRef(createTemporaryId());

  useEffect(() => {
    setQty(firstQuantity);
    setDynamicOptions(initialDynamicOptions);
    setWidth(initialData?.options?.width ?? "");
    setHeight(initialData?.options?.height ?? "");
    setUnit(initialData?.options?.unit ?? "in");
  }, [product?.id, firstQuantity, initialDynamicOptions, initialData]);

  const calculation = useMemo(() => {
    const numericQty = Number(qty || 0);

    const matchingPricingRow = pricingRows.find((row) => {
      const minimum = Number(row.minQty ?? row.qty ?? 0);

      const maximum =
        row.maxQty === null || row.maxQty === undefined || row.maxQty === ""
          ? null
          : Number(row.maxQty);

      const minimumMatches = numericQty >= minimum;
      const maximumMatches = maximum === null || numericQty <= maximum;

      return minimumMatches && maximumMatches;
    });

    const basePrice = Number(
      matchingPricingRow?.unitPrice ??
        matchingPricingRow?.price ??
        matchingPricingRow?.total ??
        0,
    );

    const optionPrice = calculateOptionPricing({
      optionGroups,
      dynamicOptions,
      qty: numericQty,
      qtyPrice: basePrice,
      width: Number(width || 0),
      height: Number(height || 0),
      unit,
    });

    /*
      Conservamos la misma lógica que actualmente utiliza
      InlineProductEditor:

      precio configurado = precio de la cantidad + opciones

      En tu estructura actual, pricingRows.unitPrice parece representar
      el precio correspondiente al rango/cantidad, no necesariamente
      un precio unitario multiplicado nuevamente por qty.
    */
    const finalPrice = Number(
      (basePrice + Number(optionPrice || 0)).toFixed(2),
    );

    return {
      matchingPricingRow,
      basePrice,
      optionPrice: Number(optionPrice || 0),
      finalPrice,
    };
  }, [qty, pricingRows, optionGroups, dynamicOptions, width, height, unit]);

  useEffect(() => {
    if (!product) return;

    const configuredItem = {
      id: temporaryId.current,

      productId: product.id,
      product,

      name: product.name,
      description: product.description || product.name,

      qty: Number(qty || 0),

      /*
        Se mantiene compatible con QuoteItem e InvoiceItem.
        En la lógica actual del sistema, unitPrice almacena el precio
        calculado para la configuración elegida.
      */
      unitPrice: calculation.finalPrice,
      subtotal: calculation.finalPrice,
      total: calculation.finalPrice,

      options: {
        ...configuration,

        width: Number(width || 0),
        height: Number(height || 0),
        unit,

        dynamicOptions,
      },

      discountType: null,
      discountValue: null,
      discountReason: "",

      _expanded: false,
    };

    setCalculatedItem(configuredItem);
    onChange?.(configuredItem);
  }, [
    product,
    qty,
    width,
    height,
    unit,
    dynamicOptions,
    calculation.finalPrice,
    configuration,
    onChange,
  ]);

  if (!product) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Product information is unavailable.
      </div>
    );
  }

  const hasConfiguredPrice =
    pricingRows.length === 0 || Boolean(calculation.matchingPricingRow);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 gap-8 p-5 lg:grid-cols-[300px_1fr] lg:p-7">
        {/* PRODUCT INFORMATION */}
        <aside>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            {product.image || product.imageUrl ? (
              <img
                src={product.image || product.imageUrl}
                alt={product.name}
                className="aspect-[4/5] h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center text-sm text-gray-400">
                No Image
              </div>
            )}
          </div>

          {product.description && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Product description
              </p>

              <p className="whitespace-pre-line text-sm leading-6 text-gray-700">
                {product.description}
              </p>
            </div>
          )}
        </aside>

        {/* CONFIGURATION */}
        <section>
          <div className="mb-6 border-b border-gray-200 pb-5">
            <h2 className="text-2xl font-semibold text-gray-900">
              {product.name}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Choose the product options to calculate the final price.
            </p>
          </div>

          <div className="space-y-5">
            {/* QUANTITY */}
            {pricingRows.length > 0 && (
              <div className="max-w-sm">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Quantity
                </label>

                <select
                  value={Number(qty)}
                  onChange={(event) => setQty(Number(event.target.value))}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {pricingRows.map((row, index) => {
                    const quantity = Number(row.minQty ?? row.qty ?? 1);

                    return (
                      <option key={`${quantity}-${index}`} value={quantity}>
                        {quantity}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* MEASUREMENTS */}
            {measurements.enabled && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Unit
                  </label>

                  <select
                    value={unit}
                    onChange={(event) => setUnit(event.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="in">Inches</option>
                    <option value="ft">Feet</option>
                    <option value="cm">Centimeters</option>
                    <option value="mm">Millimeters</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {measurements.width?.label || "Width"} ({unitLabel(unit)})
                  </label>

                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={width}
                    onChange={(event) => setWidth(event.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {measurements.height?.label || "Height"} ({unitLabel(unit)})
                  </label>

                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={height}
                    onChange={(event) => setHeight(event.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            )}

            {/* PRODUCT OPTIONS */}
            {optionGroups.length > 0 && (
              <ConfigurableTemplateEditor
                optionGroups={optionGroups}
                value={dynamicOptions}
                onChange={setDynamicOptions}
              />
            )}

            {/* PRICE SUMMARY */}
            <div className="mt-6 border-t border-gray-200 pt-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Final price
                  </p>

                  <p className="mt-1 text-3xl font-bold text-blue-600">
                    {formatCurrency(calculation.finalPrice)}
                  </p>
                </div>

                {!hasConfiguredPrice && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                    No price is configured for this quantity.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Useful only for debugging. Remove when everything works. */}
      {process.env.NODE_ENV === "development" && calculatedItem && (
        <div className="hidden">{JSON.stringify(calculatedItem)}</div>
      )}
    </div>
  );
}
