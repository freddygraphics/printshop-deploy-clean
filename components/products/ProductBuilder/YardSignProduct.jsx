"use client";

import { useState } from "react";

export default function YardSignProduct({ product, update }) {
  const [showRanges, setShowRanges] = useState(false);

  const yardSign = product.yardSign || {
    sizes: [],
    materials: [],
    printSides: [],
    stakes: [],
    packages: [],
    materialPrices: {},
    printingPrices: {},
    stakePrices: {},

    customAddonGroups: [],
  };

  function updateYardSign(values) {
    update({
      yardSign: {
        ...yardSign,
        ...values,
      },
    });
  }
  function addSizePricing(sizeIndex) {
    const updatedSizes = [...(yardSign.sizes || [])];

    const currentPricing = updatedSizes[sizeIndex]?.pricing || [];

    updatedSizes[sizeIndex] = {
      ...updatedSizes[sizeIndex],

      pricing: [
        ...currentPricing,
        {
          minQty: "",
          maxQty: "",
          unitPrice: "",
        },
      ],
    };

    updateYardSign({
      sizes: updatedSizes,
    });
  }

  function updateSizePricing(sizeIndex, priceIndex, key, value) {
    const updatedSizes = [...(yardSign.sizes || [])];

    const pricing = [...(updatedSizes[sizeIndex]?.pricing || [])];

    pricing[priceIndex] = {
      ...pricing[priceIndex],
      [key]: value === "" ? "" : Number(value),
    };

    updatedSizes[sizeIndex] = {
      ...updatedSizes[sizeIndex],
      pricing,
    };

    updateYardSign({
      sizes: updatedSizes,
    });
  }

  function removeSizePricing(sizeIndex, priceIndex) {
    const updatedSizes = [...(yardSign.sizes || [])];

    updatedSizes[sizeIndex] = {
      ...updatedSizes[sizeIndex],
      pricing: (updatedSizes[sizeIndex]?.pricing || []).filter(
        (_, index) => index !== priceIndex,
      ),
    };

    updateYardSign({
      sizes: updatedSizes,
    });
  }
  // ======================================================
  // PRICE ADJUSTMENTS
  // ======================================================

  function updatePriceMap(group, name, value) {
    updateYardSign({
      [group]: {
        ...(yardSign[group] || {}),
        [name]: value === "" ? "" : Number(value),
      },
    });
  }
  function addAddonOption(group, priceGroup) {
    const currentOptions = yardSign[group] || [];

    updateYardSign({
      [group]: [
        ...currentOptions,
        {
          name: "",
          default: currentOptions.length === 0,
        },
      ],

      [priceGroup]: {
        ...(yardSign[priceGroup] || {}),
      },
    });
  }

  function updateAddonOption(group, priceGroup, index, value) {
    const updatedOptions = [...(yardSign[group] || [])];

    const oldName = updatedOptions[index]?.name || "";

    updatedOptions[index] = {
      ...updatedOptions[index],
      name: value,
    };

    const updatedPrices = {
      ...(yardSign[priceGroup] || {}),
    };

    if (
      oldName &&
      oldName !== value &&
      Object.prototype.hasOwnProperty.call(updatedPrices, oldName)
    ) {
      updatedPrices[value] = updatedPrices[oldName];
      delete updatedPrices[oldName];
    }

    updateYardSign({
      [group]: updatedOptions,
      [priceGroup]: updatedPrices,
    });
  }

  function removeAddonOption(group, priceGroup, index) {
    const option = yardSign[group]?.[index];

    const updatedOptions = (yardSign[group] || []).filter(
      (_, i) => i !== index,
    );

    const updatedPrices = {
      ...(yardSign[priceGroup] || {}),
    };

    if (option?.name) {
      delete updatedPrices[option.name];
    }

    updateYardSign({
      [group]: updatedOptions,
      [priceGroup]: updatedPrices,
    });
  }

  // ======================================================
  // CUSTOM ADD-ON GROUPS
  // ======================================================

  function addAddonGroup() {
    updateYardSign({
      customAddonGroups: [
        ...(yardSign.customAddonGroups || []),
        {
          name: "",
          options: [],
        },
      ],
    });
  }

  function updateAddonGroup(groupIndex, value) {
    const groups = [...(yardSign.customAddonGroups || [])];

    groups[groupIndex] = {
      ...groups[groupIndex],
      name: value,
    };

    updateYardSign({
      customAddonGroups: groups,
    });
  }

  function removeAddonGroup(groupIndex) {
    updateYardSign({
      customAddonGroups: (yardSign.customAddonGroups || []).filter(
        (_, index) => index !== groupIndex,
      ),
    });
  }
  function addCustomAddonOption(groupIndex) {
    const groups = [...(yardSign.customAddonGroups || [])];

    const currentOptions = groups[groupIndex]?.options || [];

    groups[groupIndex] = {
      ...groups[groupIndex],

      options: [
        ...currentOptions,
        {
          name: "",
          price: "",
          default: currentOptions.length === 0,
        },
      ],
    };

    updateYardSign({
      customAddonGroups: groups,
    });
  }

  function updateCustomAddonOption(groupIndex, optionIndex, key, value) {
    const groups = [...(yardSign.customAddonGroups || [])];

    const options = [...(groups[groupIndex]?.options || [])];

    options[optionIndex] = {
      ...options[optionIndex],

      [key]: key === "price" ? (value === "" ? "" : Number(value)) : value,
    };

    groups[groupIndex] = {
      ...groups[groupIndex],
      options,
    };

    updateYardSign({
      customAddonGroups: groups,
    });
  }

  function setCustomAddonDefault(groupIndex, optionIndex) {
    const groups = [...(yardSign.customAddonGroups || [])];

    const options = (groups[groupIndex]?.options || []).map(
      (option, index) => ({
        ...option,
        default: index === optionIndex,
      }),
    );

    groups[groupIndex] = {
      ...groups[groupIndex],
      options,
    };

    updateYardSign({
      customAddonGroups: groups,
    });
  }

  function removeCustomAddonOption(groupIndex, optionIndex) {
    const groups = [...(yardSign.customAddonGroups || [])];

    groups[groupIndex] = {
      ...groups[groupIndex],

      options: (groups[groupIndex]?.options || []).filter(
        (_, index) => index !== optionIndex,
      ),
    };

    updateYardSign({
      customAddonGroups: groups,
    });
  }
  // ======================================================
  // SIZES
  // ======================================================
  function setDefaultSize(sizeIndex) {
    const updatedSizes = (yardSign.sizes || []).map((size, index) => ({
      ...size,
      default: index === sizeIndex,
    }));

    updateYardSign({
      sizes: updatedSizes,
    });
  }
  function addSize() {
    updateYardSign({
      sizes: [
        ...(yardSign.sizes || []),
        {
          name: "",
          default: (yardSign.sizes || []).length === 0,

          pricing: [
            {
              minQty: 1,
              maxQty: 1,
              unitPrice: 0,
            },
          ],
        },
      ],
    });
  }

  function updateSize(index, key, value) {
    const updatedSizes = [...(yardSign.sizes || [])];

    const oldSize = updatedSizes[index];
    const oldName = oldSize?.name || "";

    const nextValue =
      key === "name" ? value : value === "" ? "" : Number(value);

    updatedSizes[index] = {
      ...oldSize,
      [key]: nextValue,
    };

    // Si cambia el nombre de la medida,
    // migrar también los precios existentes.
    if (key === "name" && oldName && oldName !== value) {
      const updatedPackages = (yardSign.packages || []).map((pkg) => {
        const prices = { ...(pkg.prices || {}) };

        if (Object.prototype.hasOwnProperty.call(prices, oldName)) {
          prices[value] = prices[oldName];
          delete prices[oldName];
        }

        return {
          ...pkg,
          prices,
        };
      });

      updateYardSign({
        sizes: updatedSizes,
        packages: updatedPackages,

        selectedSize:
          yardSign.selectedSize === oldName ? value : yardSign.selectedSize,
      });

      return;
    }

    updateYardSign({
      sizes: updatedSizes,
    });
  }

  function removeSize(index) {
    const sizeToRemove = yardSign.sizes?.[index];

    const updatedSizes = (yardSign.sizes || []).filter((_, i) => i !== index);

    const updatedPackages = (yardSign.packages || []).map((pkg) => {
      const prices = { ...(pkg.prices || {}) };

      if (sizeToRemove?.name) {
        delete prices[sizeToRemove.name];
      }

      return {
        ...pkg,
        prices,
      };
    });

    updateYardSign({
      sizes: updatedSizes,
      packages: updatedPackages,

      selectedSize:
        yardSign.selectedSize === sizeToRemove?.name
          ? updatedSizes[0]?.name || ""
          : yardSign.selectedSize,
    });
  }

  // ======================================================
  // PACKAGES / QUANTITY RANGES
  // ======================================================

  function addPackage() {
    updateYardSign({
      packages: [
        ...(yardSign.packages || []),
        {
          name: "",
          minQty: "",
          maxQty: "",
          prices: {},
        },
      ],
    });
  }

  function updatePackage(index, key, value) {
    const updated = [...(yardSign.packages || [])];

    updated[index] = {
      ...updated[index],

      [key]: key === "name" ? value : value === "" ? "" : Number(value),
    };

    updateYardSign({
      packages: updated,
    });
  }

  function removePackage(index) {
    updateYardSign({
      packages: (yardSign.packages || []).filter((_, i) => i !== index),
    });
  }

  // ======================================================
  // PRICE PER SIZE / PACKAGE
  // ======================================================

  function updatePackageSizePrice(packageIndex, sizeName, value) {
    const updated = [...(yardSign.packages || [])];

    updated[packageIndex] = {
      ...updated[packageIndex],

      prices: {
        ...(updated[packageIndex].prices || {}),

        [sizeName]: value === "" ? "" : Number(value),
      },
    };

    updateYardSign({
      packages: updated,
    });
  }
  function setAddonDefault(group, index) {
    const updated = (yardSign[group] || []).map((item, itemIndex) => ({
      ...item,
      default: itemIndex === index,
    }));

    updateYardSign({
      [group]: updated,
    });
  }
  return (
    <div className="space-y-8">
      {/* ==================================================
    SIZES & PRICING
================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {/* HEADER */}
        <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Sizes & Pricing
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Set the available sizes and unit prices by quantity.
            </p>
          </div>

          <button
            type="button"
            onClick={addSize}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
          >
            + Add Size
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-6">
          {(yardSign.sizes || []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <p className="font-medium text-gray-700">No sizes configured</p>

              <p className="mt-1 text-sm text-gray-400">
                Click Add Size to create the first one.
              </p>
            </div>
          ) : (
            /*
             * 1 column on smaller screens.
             * 2 columns when enough room is available.
             */
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {(yardSign.sizes || []).map((size, sizeIndex) => (
                <div
                  key={sizeIndex}
                  className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
                >
                  {/* ==========================================
                SIZE HEADER
            ========================================== */}

                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex min-w-0 flex-1 items-end gap-3">
                      {/* DEFAULT SIZE */}
                      <div className="flex h-10 items-center">
                        <input
                          type="radio"
                          name="default-yard-sign-size"
                          checked={size.default === true}
                          onChange={() => setDefaultSize(sizeIndex)}
                          title="Default Size"
                          className="h-4 w-4 cursor-pointer accent-blue-600"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          Size
                        </label>

                        <input
                          type="text"
                          className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3"
                          placeholder="24x18"
                          value={size.name || ""}
                          onChange={(e) =>
                            updateSize(sizeIndex, "name", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => addSizePricing(sizeIndex)}
                        className="h-10 flex-1 whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-medium text-blue-600 hover:bg-blue-100 sm:flex-none"
                      >
                        + Add Qty
                      </button>

                      <button
                        type="button"
                        onClick={() => removeSize(sizeIndex)}
                        className="h-10 flex-1 whitespace-nowrap rounded-lg border border-red-200 bg-white px-3 text-sm text-red-600 hover:bg-red-50 sm:flex-none"
                      >
                        Delete Size
                      </button>
                    </div>
                  </div>

                  {/* ==========================================
                NO PRICING
            ========================================== */}

                  {(size.pricing || []).length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-400">
                      No quantity pricing configured for this size.
                    </div>
                  ) : (
                    <div className="min-w-0">
                      {/* ======================================
                    DESKTOP HEADER
                ====================================== */}

                      <div className="hidden border-b border-gray-200 pb-2 md:grid md:grid-cols-[minmax(70px,1fr)_minmax(70px,1fr)_minmax(90px,1.15fr)_74px] md:gap-2">
                        <div className="text-xs font-semibold text-gray-700 lg:text-sm">
                          Min Qty
                        </div>

                        <div className="text-xs font-semibold text-gray-700 lg:text-sm">
                          Max Qty
                        </div>

                        <div className="text-xs font-semibold text-gray-700 lg:text-sm">
                          Unit Price
                        </div>

                        <div />
                      </div>

                      {/* ======================================
                    PRICE ROWS
                ====================================== */}

                      <div className="divide-y divide-gray-100">
                        {(size.pricing || []).map((row, priceIndex) => (
                          <div
                            key={priceIndex}
                            className="
                          grid
                        grid-cols-1
                          gap-x-2
                          gap-y-3
                          py-3

                        md:grid-cols-[minmax(70px,1fr)_minmax(70px,1fr)_minmax(90px,1.15fr)_74px]
                          md:items-end
                          md:gap-2
                        "
                          >
                            {/* ==============================
                            MOBILE FIELD WRAPPER
                        ============================== */}

                            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 md:contents">
                              {/* MIN QTY */}
                              <div className="min-w-0">
                                <label className="mb-1 block text-xs font-medium text-gray-500 md:hidden">
                                  Min Qty
                                </label>

                                <input
                                  type="number"
                                  min="1"
                                  className="h-10 w-full min-w-0 rounded-lg border border-gray-200 px-2 sm:px-3"
                                  value={row.minQty ?? ""}
                                  onChange={(e) =>
                                    updateSizePricing(
                                      sizeIndex,
                                      priceIndex,
                                      "minQty",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>

                              {/* MAX QTY */}
                              <div className="min-w-0">
                                <label className="mb-1 block text-xs font-medium text-gray-500 md:hidden">
                                  Max Qty
                                </label>

                                <input
                                  type="number"
                                  min="1"
                                  className="h-10 w-full min-w-0 rounded-lg border border-gray-200 px-2 sm:px-3"
                                  value={row.maxQty ?? ""}
                                  onChange={(e) =>
                                    updateSizePricing(
                                      sizeIndex,
                                      priceIndex,
                                      "maxQty",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>

                              {/* UNIT PRICE */}
                              <div className="min-w-0">
                                <label className="mb-1 block text-xs font-medium text-gray-500 md:hidden">
                                  Unit Price
                                </label>

                                <div className="relative min-w-0">
                                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    $
                                  </span>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="h-10 w-full min-w-0 rounded-lg border border-gray-200 py-2 pl-7 pr-2 font-medium"
                                    value={row.unitPrice ?? ""}
                                    onChange={(e) =>
                                      updateSizePricing(
                                        sizeIndex,
                                        priceIndex,
                                        "unitPrice",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>

                            {/* ==============================
                            DELETE PRICE
                        ============================== */}

                            <button
                              type="button"
                              onClick={() =>
                                removeSizePricing(sizeIndex, priceIndex)
                              }
                              className="
  h-10
  rounded-lg
  border
  border-red-200
  px-2
  text-sm
  text-red-600
  hover:bg-red-50
"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================
    ADD-ONS
================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Add-ons & Adjustments
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add optional features and additional per-unit charges.
            </p>
          </div>

          <button
            type="button"
            onClick={addAddonGroup}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Block
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-3">
          {/* ==================================================
        MATERIALS
    ================================================== */}

          <div className="rounded-xl border border-gray-200 p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">Materials</h3>

                <p className="mt-1 text-xs text-gray-500">
                  Additional price per unit.
                </p>
              </div>

              <button
                type="button"
                onClick={() => addAddonOption("materials", "materialPrices")}
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
              >
                + Add
              </button>
            </div>

            <div className="space-y-3">
              {(yardSign.materials || []).length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-5 text-center text-sm text-gray-400">
                  No materials configured.
                </div>
              ) : (
                (yardSign.materials || []).map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="block text-xs font-medium text-gray-500">
                            Material Name
                          </label>

                          <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                            <input
                              type="radio"
                              name="material-default"
                              checked={item.default === true}
                              onChange={() =>
                                setAddonDefault("materials", index)
                              }
                              className="h-4 w-4 accent-blue-600"
                            />
                            Default
                          </label>
                        </div>

                        <input
                          className="h-10 w-full rounded-lg border border-gray-200 px-3"
                          placeholder="4mm Coroplast"
                          value={item.name || ""}
                          onChange={(e) =>
                            updateAddonOption(
                              "materials",
                              "materialPrices",
                              index,
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-500">
                            Price Adjustment
                          </label>

                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                              +$
                            </span>

                            <input
                              type="number"
                              step="0.01"
                              className="h-10 w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3"
                              value={yardSign.materialPrices?.[item.name] ?? ""}
                              onChange={(e) =>
                                updatePriceMap(
                                  "materialPrices",
                                  item.name,
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeAddonOption(
                              "materials",
                              "materialPrices",
                              index,
                            )
                          }
                          className="self-end rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ==================================================
        PRINTING
    ================================================== */}

          <div className="rounded-xl border border-gray-200 p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">Printing</h3>

                <p className="mt-1 text-xs text-gray-500">
                  Additional price per unit.
                </p>
              </div>

              <button
                type="button"
                onClick={() => addAddonOption("printSides", "printingPrices")}
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
              >
                + Add
              </button>
            </div>

            <div className="space-y-3">
              {(yardSign.printSides || []).length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-5 text-center text-sm text-gray-400">
                  No printing options configured.
                </div>
              ) : (
                (yardSign.printSides || []).map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="block text-xs font-medium text-gray-500">
                            Printing Option
                          </label>

                          <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                            <input
                              type="radio"
                              name="printing-default"
                              checked={item.default === true}
                              onChange={() =>
                                setAddonDefault("printSides", index)
                              }
                              className="h-4 w-4 accent-blue-600"
                            />
                            Default
                          </label>
                        </div>

                        <input
                          className="h-10 w-full rounded-lg border border-gray-200 px-3"
                          placeholder="Double Side"
                          value={item.name || ""}
                          onChange={(e) =>
                            updateAddonOption(
                              "printSides",
                              "printingPrices",
                              index,
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-500">
                            Price Adjustment
                          </label>

                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                              +$
                            </span>

                            <input
                              type="number"
                              step="0.01"
                              className="h-10 w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3"
                              value={yardSign.printingPrices?.[item.name] ?? ""}
                              onChange={(e) =>
                                updatePriceMap(
                                  "printingPrices",
                                  item.name,
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeAddonOption(
                              "printSides",
                              "printingPrices",
                              index,
                            )
                          }
                          className="self-end rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ==================================================
        H-STAKES
    ================================================== */}

          <div className="rounded-xl border border-gray-200 p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">H-Stakes</h3>

                <p className="mt-1 text-xs text-gray-500">
                  Additional price per unit.
                </p>
              </div>

              <button
                type="button"
                onClick={() => addAddonOption("stakes", "stakePrices")}
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
              >
                + Add
              </button>
            </div>

            <div className="space-y-3">
              {(yardSign.stakes || []).length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-5 text-center text-sm text-gray-400">
                  No H-Stake options configured.
                </div>
              ) : (
                (yardSign.stakes || []).map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="block text-xs font-medium text-gray-500">
                            H-Stake Name
                          </label>

                          <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                            <input
                              type="radio"
                              name="stake-default"
                              checked={item.default === true}
                              onChange={() => setAddonDefault("stakes", index)}
                              className="h-4 w-4 accent-blue-600"
                            />
                            Default
                          </label>
                        </div>

                        <input
                          className="h-10 w-full rounded-lg border border-gray-200 px-3"
                          placeholder="Standard H-Stake"
                          value={item.name || ""}
                          onChange={(e) =>
                            updateAddonOption(
                              "stakes",
                              "stakePrices",
                              index,
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-500">
                            Price Adjustment
                          </label>

                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                              +$
                            </span>

                            <input
                              type="number"
                              step="0.01"
                              className="h-10 w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3"
                              value={yardSign.stakePrices?.[item.name] ?? ""}
                              onChange={(e) =>
                                updatePriceMap(
                                  "stakePrices",
                                  item.name,
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeAddonOption("stakes", "stakePrices", index)
                          }
                          className="self-end rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        {/* ==================================================
    CUSTOM ADD-ON GROUPS
================================================== */}

        {(yardSign.customAddonGroups || []).length > 0 && (
          <div className="border-t border-gray-200 p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {(yardSign.customAddonGroups || []).map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="rounded-xl border border-gray-200 p-5"
                >
                  {/* GROUP HEADER */}
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Block Name
                      </label>

                      <input
                        className="h-10 w-full rounded-lg border border-gray-200 px-3 font-semibold"
                        placeholder="Finishing"
                        value={group.name || ""}
                        onChange={(e) =>
                          updateAddonGroup(groupIndex, e.target.value)
                        }
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeAddonGroup(groupIndex)}
                      className="mt-5 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete Block
                    </button>
                  </div>

                  {/* OPTIONS */}
                  <div className="space-y-3">
                    {(group.options || []).length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 p-5 text-center text-sm text-gray-400">
                        No options yet.
                      </div>
                    ) : (
                      (group.options || []).map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className="rounded-lg border border-gray-200 p-3"
                        >
                          <div className="space-y-3">
                            <div>
                              <div className="mb-1 flex items-center justify-between gap-3">
                                <label className="block text-xs font-medium text-gray-500">
                                  Option Name
                                </label>

                                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600">
                                  <input
                                    type="radio"
                                    name={`custom-addon-default-${groupIndex}`}
                                    checked={option.default === true}
                                    onChange={() =>
                                      setCustomAddonDefault(
                                        groupIndex,
                                        optionIndex,
                                      )
                                    }
                                    className="h-4 w-4 cursor-pointer accent-blue-600"
                                  />
                                  Default
                                </label>
                              </div>

                              <input
                                className="h-10 w-full rounded-lg border border-gray-200 px-3"
                                placeholder="Rounded Corners"
                                value={option.name || ""}
                                onChange={(e) =>
                                  updateCustomAddonOption(
                                    groupIndex,
                                    optionIndex,
                                    "name",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="grid grid-cols-[1fr_auto] gap-2">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">
                                  Price Adjustment
                                </label>

                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    +$
                                  </span>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="h-10 w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3"
                                    value={option.price ?? ""}
                                    onChange={(e) =>
                                      updateCustomAddonOption(
                                        groupIndex,
                                        optionIndex,
                                        "price",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeCustomAddonOption(
                                    groupIndex,
                                    optionIndex,
                                  )
                                }
                                className="self-end rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* ADD OPTION */}
                  <button
                    type="button"
                    onClick={() => addCustomAddonOption(groupIndex)}
                    className="mt-4 w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                  >
                    + Add Option
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
