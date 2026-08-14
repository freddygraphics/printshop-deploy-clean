"use client";

import { useEffect, useMemo, useState } from "react";

export default function YardSignProductConfigurator({
  product,
  onChange,
  initialData = null,
}) {
  const configuration = product?.configuration || product?.defaultOptions || {};
  const yardSign = configuration?.yardSign || {};

  const sizes = yardSign.sizes || [];
  const defaultSize = sizes.find((item) => item?.default === true);
  const materials = yardSign.materials || [];
  const printSides = yardSign.printSides || [];
  const stakes = yardSign.stakes || [];

  // NUEVO: bloques dinámicos creados desde Settings Product
  const customAddonGroups = yardSign.customAddonGroups || [];
  // ======================================================
  // DEFAULT OPTIONS FROM SETTINGS
  // ======================================================

  const defaultMaterial = materials.find((item) => item?.default === true);

  const defaultPrinting = printSides.find((item) => item?.default === true);

  const defaultStake = stakes.find((item) => item?.default === true);
  // ======================================================
  // STATES
  // ======================================================

  const [qty, setQty] = useState(Number(initialData?.qty || 1));

  const [size, setSize] = useState(
    initialData?.options?.size || defaultSize?.name || sizes[0]?.name || "",
  );

  const [material, setMaterial] = useState(
    initialData?.options?.material ||
      defaultMaterial?.name ||
      yardSign.selectedMaterial ||
      materials[0]?.name ||
      "",
  );

  const [printSide, setPrintSide] = useState(
    initialData?.options?.printSide ||
      defaultPrinting?.name ||
      yardSign.selectedPrintSide ||
      printSides[0]?.name ||
      "",
  );

  const [stake, setStake] = useState(
    initialData?.options?.stake ||
      defaultStake?.name ||
      yardSign.selectedStake ||
      "",
  );

  // ======================================================
  // CUSTOM ADD-ON SELECTIONS
  // ======================================================
  const [customSelections, setCustomSelections] = useState(() => {
    const saved = initialData?.options?.customAddonGroups || {};

    const initial = {};

    customAddonGroups.forEach((group, groupIndex) => {
      const savedSelection = saved?.[group.name]?.selected;

      const defaultOption = (group.options || []).find(
        (option) => option?.default === true,
      );

      initial[groupIndex] = savedSelection || defaultOption?.name || "";
    });

    return initial;
  });

  // ======================================================
  // SELECTED SIZE
  // ======================================================

  const selectedSize = useMemo(() => {
    return sizes.find((item) => item.name === size);
  }, [sizes, size]);

  // ======================================================
  // PRICING SEGÚN SIZE + QUANTITY
  // ======================================================

  const selectedPricing = useMemo(() => {
    const pricing = selectedSize?.pricing || [];

    return pricing.find((row) => {
      const min = Number(row.minQty || 0);

      const max =
        row.maxQty === "" || row.maxQty === null || row.maxQty === undefined
          ? Infinity
          : Number(row.maxQty);

      return qty >= min && qty <= max;
    });
  }, [selectedSize, qty]);

  // ======================================================
  // BASE PRICE
  // ======================================================

  const baseUnitPrice = Number(selectedPricing?.unitPrice || 0);

  const materialPrice = Number(yardSign.materialPrices?.[material] || 0);

  const printingPrice = Number(yardSign.printingPrices?.[printSide] || 0);

  const stakePrice = Number(yardSign.stakePrices?.[stake] || 0);

  // ======================================================
  // CUSTOM ADD-ONS PRICE
  // ======================================================

  const customAddonTotalPerUnit = useMemo(() => {
    return customAddonGroups.reduce((total, group, groupIndex) => {
      const selectedName = customSelections[groupIndex];

      if (!selectedName) {
        return total;
      }

      const selectedOption = (group.options || []).find(
        (option) => option.name === selectedName,
      );

      return total + Number(selectedOption?.price || 0);
    }, 0);
  }, [customAddonGroups, customSelections]);

  // ======================================================
  // UNIT PRICE / TOTAL
  // ======================================================

  const unitPrice =
    baseUnitPrice +
    materialPrice +
    printingPrice +
    stakePrice +
    customAddonTotalPerUnit;

  const total = qty * unitPrice;

  // ======================================================
  // CUSTOM OPTIONS DATA
  // ======================================================

  const customAddonData = useMemo(() => {
    return customAddonGroups.reduce((result, group, groupIndex) => {
      const selectedName = customSelections[groupIndex] || "";

      const selectedOption = (group.options || []).find(
        (option) => option.name === selectedName,
      );

      result[group.name || `Option ${groupIndex + 1}`] = {
        selected: selectedName,
        price: Number(selectedOption?.price || 0),
      };

      return result;
    }, {});
  }, [customAddonGroups, customSelections]);

  // ======================================================
  // SEND CONFIGURATION
  // ======================================================

  useEffect(() => {
    onChange?.({
      productId: product?.id,

      product,

      name: product?.name || "Yard Sign",

      description: product?.name || "Yard Sign",

      qty,

      unitPrice,

      total,

      options: {
        productType: "yard-sign",

        size,
        material,
        printSide,
        stake,

        pricingMinQty: selectedPricing?.minQty ?? null,
        pricingMaxQty: selectedPricing?.maxQty ?? null,
        baseUnitPrice,

        materialPrice,

        printingPrice,

        stakePrice,

        customAddonTotalPerUnit,

        customAddonGroups: customAddonData,

        dynamicOptions: {
          size,
          material,
          printSide,
          stake,

          ...Object.fromEntries(
            Object.entries(customAddonData).map(([groupName, data]) => [
              groupName,
              data.selected,
            ]),
          ),
        },
      },
    });
  }, [
    product,
    qty,
    size,
    material,
    printSide,
    stake,
    selectedPricing,
    baseUnitPrice,
    materialPrice,
    printingPrice,
    stakePrice,
    customAddonTotalPerUnit,
    customAddonData,
    unitPrice,
    total,
    onChange,
  ]);

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* IMAGE */}
        <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
          {product?.image ? (
            <img
              src={product.image}
              alt={product?.name || "Yard Sign"}
              className="max-h-[300px] max-w-full object-contain"
            />
          ) : (
            <span className="text-sm text-gray-400">No Image</span>
          )}
        </div>

        {/* CONFIGURATOR */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {product?.name || "Yard Sign"}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Choose the yard sign options to calculate the final price.
          </p>

          <div className="my-5 border-t" />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* QUANTITY */}
            <div>
              <label className="mb-2 block text-sm font-medium">Quantity</label>

              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) =>
                  setQty(Math.max(1, Number(e.target.value) || 1))
                }
                className="h-11 w-full rounded-lg border border-gray-200 px-3"
              />
            </div>

            {/* SIZE */}
            <div>
              <label className="mb-2 block text-sm font-medium">Size</label>

              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 px-3"
              >
                {sizes.map((item, index) => (
                  <option key={index} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* MATERIAL */}
            <div>
              <label className="mb-2 block text-sm font-medium">Material</label>

              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 px-3"
              >
                {materials.map((item, index) => (
                  <option key={index} value={item.name}>
                    {item.name}

                    {Number(yardSign.materialPrices?.[item.name] || 0) !== 0
                      ? ` (+$${Number(
                          yardSign.materialPrices?.[item.name] || 0,
                        ).toFixed(2)})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* PRINTING */}
            <div>
              <label className="mb-2 block text-sm font-medium">Printing</label>

              <select
                value={printSide}
                onChange={(e) => setPrintSide(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 px-3"
              >
                {printSides.map((item, index) => (
                  <option key={index} value={item.name}>
                    {item.name}

                    {Number(yardSign.printingPrices?.[item.name] || 0) !== 0
                      ? ` (+$${Number(
                          yardSign.printingPrices?.[item.name] || 0,
                        ).toFixed(2)})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* H-STAKE */}
            <div>
              <label className="mb-2 block text-sm font-medium">H-Stake</label>

              <select
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 px-3"
              >
                <option value="">No H-Stake</option>

                {stakes
                  .filter((item) => item.name)
                  .map((item, index) => (
                    <option key={index} value={item.name}>
                      {item.name}

                      {Number(yardSign.stakePrices?.[item.name] || 0) !== 0
                        ? ` (+$${Number(
                            yardSign.stakePrices?.[item.name] || 0,
                          ).toFixed(2)})`
                        : ""}
                    </option>
                  ))}
              </select>
            </div>

            {/* ==================================================
                DYNAMIC CUSTOM ADD-ON GROUPS
            ================================================== */}

            {customAddonGroups
              .filter(
                (group) =>
                  group?.name &&
                  Array.isArray(group?.options) &&
                  group.options.length > 0,
              )
              .map((group, groupIndex) => (
                <div key={`${group.name}-${groupIndex}`}>
                  <label className="mb-2 block text-sm font-medium">
                    {group.name}
                  </label>

                  <select
                    value={customSelections[groupIndex] || ""}
                    onChange={(e) =>
                      setCustomSelections((prev) => ({
                        ...prev,

                        [groupIndex]: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-gray-200 px-3"
                  >
                    <option value="">Select {group.name}</option>

                    {(group.options || [])
                      .filter((option) => option?.name)
                      .map((option, optionIndex) => {
                        const price = Number(option.price || 0);

                        return (
                          <option key={optionIndex} value={option.name}>
                            {option.name}

                            {price !== 0 ? ` (+$${price.toFixed(2)})` : ""}
                          </option>
                        );
                      })}
                  </select>
                </div>
              ))}
          </div>

          <div className="my-6 border-t" />

          {/* ==================================================
    PRICE
================================================== */}

          <div className="flex justify-end">
            <div className="text-right">
              {/* FINAL PRICE */}
              <p className="text-xs font-semibold uppercase text-gray-400">
                Final Price
              </p>

              <p className="text-3xl font-bold text-blue-600">
                ${total.toFixed(2)}
              </p>

              {/* UNIT PRICE */}
              <p className="mt-1 text-sm font-semibold text-gray-700">
                Unit Price: ${unitPrice.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
