"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import InlineProductEditor from "@/components/InlineProductEditor";

/**
 * DocumentItemsEditor
 *
 * Componente compartido para:
 * - Invoices
 * - Quotes
 *
 * Este componente NO guarda directamente en la base de datos.
 * InvoiceEditor o QuoteEditor deciden cómo guardar los items.
 */
export default function DocumentItemsEditor({
  items = [],
  onItemsChange,

  // Se ejecuta cuando el usuario termina de configurar,
  // agrega o elimina un producto.
  onCommitItems,

  // Botón opcional de Create Job
  showCreateJob = false,
  createJobDisabled = false,
  createJobLabel = "+ Create Job",
  onCreateJob,

  // Opciones disponibles
  allowProducts = true,
  allowApparel = true,
  allowCalculators = true,

  // Texto personalizado
  title = "Products",
  addButtonLabel = "+ Add New Item",

  // Se utiliza en /products cuando necesitas cálculo automático
  autoCalculateOnMount = false,
}) {
  // =====================================================
  // UI
  // =====================================================
  const [showAddCard, setShowAddCard] = useState(false);

  // =====================================================
  // PRODUCT SEARCH
  // =====================================================
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [productCatalog, setProductCatalog] = useState("products");
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  // =====================================================
  // MANUAL ITEM
  // =====================================================
  const [manualDesc, setManualDesc] = useState("");

  const [manualQtyInput, setManualQtyInput] = useState("1");
  const [manualQty, setManualQty] = useState(1);

  const [manualUnitInput, setManualUnitInput] = useState("0");
  const [manualUnit, setManualUnit] = useState(0);

  const manualTotal = useMemo(() => {
    return Number(manualQty || 0) * Number(manualUnit || 0);
  }, [manualQty, manualUnit]);

  // =====================================================
  // HELPERS
  // =====================================================
  const normalizeOptions = useCallback((options) => {
    if (!options || Array.isArray(options)) return {};
    return options;
  }, []);

  const replaceItems = useCallback(
    (nextItems, commit = false) => {
      if (typeof onItemsChange === "function") {
        onItemsChange(nextItems);
      }

      if (commit && typeof onCommitItems === "function") {
        onCommitItems(nextItems);
      }
    },
    [onItemsChange, onCommitItems],
  );

  const closeAllItems = useCallback((currentItems) => {
    return currentItems.map((item) => ({
      ...item,
      _expanded: false,
    }));
  }, []);

  const resetSearch = useCallback(() => {
    setProductSearch("");
    setProductResults([]);
    setShowAddCard(false);
  }, []);

  const resetManualFields = useCallback(() => {
    setManualDesc("");
    setManualQty(1);
    setManualQtyInput("1");
    setManualUnit(0);
    setManualUnitInput("0");
  }, []);

  // =====================================================
  // PRODUCT SEARCH
  // =====================================================
  useEffect(() => {
    const controller = new AbortController();

    const delay = setTimeout(async () => {
      const query = productSearch.trim();

      if (query.length < 2) {
        setProductResults([]);
        setIsSearchingProducts(false);
        return;
      }

      try {
        setIsSearchingProducts(true);

        const endpoint =
          productCatalog === "apparel"
            ? `/api/apparel/search?q=${encodeURIComponent(query)}&limit=20`
            : `/api/products/search?q=${encodeURIComponent(query)}`;

        const response = await fetch(endpoint, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Product search failed");
        }

        const data = await response.json();

        let results = [];

        // -----------------------------------------
        // SANMAR
        // -----------------------------------------
        if (productCatalog === "apparel") {
          results = Array.isArray(data?.products)
            ? data.products.map((product) => ({
                ...product,
                productType: "apparel",
              }))
            : [];
        } else {
          // -----------------------------------------
          // NORMAL PRODUCTS
          // -----------------------------------------
          results = Array.isArray(data)
            ? data.map((product) => ({
                ...product,
                productType: product.productType || "product",
              }))
            : [];

          if (allowCalculators) {
            const normalizedQuery = query.toLowerCase();

            // Sticker Calculator
            if (
              normalizedQuery.includes("sticker") ||
              normalizedQuery.includes("label") ||
              normalizedQuery.includes("calcomania")
            ) {
              results.unshift({
                id: "sticker-calculator",
                name: "Sticker Calculator",
                description: "Custom sticker pricing calculator",
                category: "stickers",
                basePrice: 0,
                productType: "calculator",
                isVirtual: true,
              });
            }

            // Raffle Ticket Calculator
            if (
              normalizedQuery.includes("raffle") ||
              normalizedQuery.includes("ticket") ||
              normalizedQuery.includes("boleto")
            ) {
              results.unshift({
                id: "raffle-tickets-calculator",
                name: "Raffle Tickets",
                description: "Custom numbered raffle tickets",
                category: "raffle-tickets",
                templateType: "raffle-tickets",
                basePrice: 0,
                productType: "calculator",
                isVirtual: true,
              });
            }
          }
        }

        setProductResults(results);
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error("Error searching products:", error);
          setProductResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingProducts(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(delay);
      controller.abort();
    };
  }, [productSearch, productCatalog, allowCalculators]);

  // =====================================================
  // SELECT PRODUCT
  // =====================================================
  const handleSelectProduct = useCallback(
    async (productResult) => {
      // -----------------------------------------
      // STICKER CALCULATOR
      // -----------------------------------------
      if (productResult.id === "sticker-calculator") {
        const newItem = {
          id: crypto.randomUUID(),
          productId: null,

          product: {
            id: "sticker-calculator",
            name: "Sticker Calculator",
            description: "Custom sticker pricing calculator",
            category: "stickers",
            productType: "calculator",
            isVirtual: true,
          },

          name: "Sticker Calculator",
          qty: 1,
          unitPrice: 0,
          total: 0,
          customFields: null,
          options: {},
          _expanded: true,
        };

        const nextItems = [...closeAllItems(items), newItem];

        replaceItems(nextItems);
        resetSearch();
        return;
      }

      // -----------------------------------------
      // RAFFLE TICKET CALCULATOR
      // -----------------------------------------
      if (productResult.id === "raffle-tickets-calculator") {
        const newItem = {
          id: crypto.randomUUID(),
          productId: null,

          product: {
            id: "raffle-tickets-calculator",
            name: "Raffle Tickets",
            description: "Custom numbered raffle tickets",
            category: "raffle-tickets",
            templateType: "raffle-tickets",
            productType: "calculator",
            isVirtual: true,
          },

          name: "Raffle Tickets",
          description: "",
          qty: 1,
          unitPrice: 0,
          total: 0,
          customFields: null,
          options: {},
          _expanded: true,
        };

        const nextItems = [...closeAllItems(items), newItem];

        replaceItems(nextItems);
        resetSearch();
        return;
      }

      // -----------------------------------------
      // SANMAR APPAREL
      // -----------------------------------------
      if (productResult.productType === "apparel") {
        try {
          const response = await fetch(`/api/apparel/${productResult.id}`, {
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error("Could not load SanMar product.");
          }

          const data = await response.json();
          const apparelProduct = data.product;

          if (!apparelProduct) {
            throw new Error("Invalid SanMar product response.");
          }

          const newItem = {
            id: crypto.randomUUID(),

            // SanMar no pertenece a la tabla Product normal
            productId: null,

            product: {
              ...apparelProduct,
              productType: "apparel",
              colors: Array.isArray(data.colors) ? data.colors : [],
            },

            name: `${
              apparelProduct.brand || "SanMar"
            } ${apparelProduct.supplierStyle || ""} - ${
              apparelProduct.name || "Apparel"
            }`,

            qty: 1,
            unitPrice: 0,
            total: 0,
            customFields: null,

            options: {
              productType: "apparel",
              apparelProductId: apparelProduct.id,
              supplier: apparelProduct.supplier,
              supplierStyle: apparelProduct.supplierStyle,
              brand: apparelProduct.brand,
              color: null,
              sizes: [],
              printLocations: [],
              dtf: null,
            },

            _expanded: true,
          };

          const nextItems = [...closeAllItems(items), newItem];

          replaceItems(nextItems);
          resetSearch();
        } catch (error) {
          console.error("Error selecting SanMar product:", error);
          alert("Could not load the SanMar product.");
        }

        return;
      }

      // -----------------------------------------
      // NORMAL PRODUCT
      // -----------------------------------------
      try {
        const response = await fetch(`/api/products/${productResult.id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load product.");
        }

        const fullProduct = await response.json();

        const newItem = {
          id: crypto.randomUUID(),
          productId: fullProduct.id,
          product: fullProduct,

          name: fullProduct.name,
          qty: 1,
          unitPrice: 0,
          total: 0,

          customFields:
            fullProduct.customFields || fullProduct.template?.fields || null,

          options: normalizeOptions(
            fullProduct.defaultOptions ?? fullProduct.template?.options ?? {},
          ),

          _expanded: true,
        };

        const nextItems = [...closeAllItems(items), newItem];

        replaceItems(nextItems);
        resetSearch();
      } catch (error) {
        console.error("Error selecting product:", error);
        alert("Could not load the product.");
      }
    },
    [items, closeAllItems, normalizeOptions, replaceItems, resetSearch],
  );

  // =====================================================
  // MANUAL ITEM
  // =====================================================
  const addManualItem = useCallback(() => {
    if (!manualDesc.trim()) {
      alert("Enter a description.");
      return;
    }

    if (manualQty <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    const newItem = {
      id: crypto.randomUUID(),
      productId: null,
      product: null,
      customFields: null,

      name: manualDesc.trim(),
      qty: Number(manualQty),
      unitPrice: Number(manualUnit),
      total: Number(manualTotal),

      options: {},
      _expanded: false,
    };

    const nextItems = [...items, newItem];

    replaceItems(nextItems, true);
    resetManualFields();
    setShowAddCard(false);
  }, [
    items,
    manualDesc,
    manualQty,
    manualUnit,
    manualTotal,
    replaceItems,
    resetManualFields,
  ]);

  // =====================================================
  // UPDATE ITEM
  // =====================================================
  const handleItemChange = useCallback(
    (index, fields = {}) => {
      const nextItems = items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const nextOptions = {
          ...(item.options || {}),
          ...(fields.options || {}),
        };

        const updatedItem = {
          ...item,
          ...fields,

          options: nextOptions,

          _expanded:
            fields.__commit === true
              ? false
              : fields._expanded !== undefined
                ? fields._expanded
                : item._expanded,
        };

        // Para productos manuales recalculamos el total
        // cuando InlineProductEditor no envía un total.
        if (!updatedItem.product && fields.total === undefined) {
          updatedItem.total =
            Number(updatedItem.qty || 0) * Number(updatedItem.unitPrice || 0);
        }

        return updatedItem;
      });

      const shouldCommit = fields.__commit === true;

      replaceItems(nextItems, shouldCommit);
    },
    [items, replaceItems],
  );

  const openItem = useCallback(
    (index) => {
      const nextItems = items.map((item, itemIndex) => ({
        ...item,
        _expanded: itemIndex === index,
      }));

      replaceItems(nextItems);
    },
    [items, replaceItems],
  );

  // =====================================================
  // REMOVE ITEM
  // =====================================================
  const removeItem = useCallback(
    (index) => {
      const nextItems = items.filter((_, itemIndex) => itemIndex !== index);

      replaceItems(nextItems, true);
    },
    [items, replaceItems],
  );

  // =====================================================
  // OPTION SUMMARY
  // =====================================================
  const buildOptionSummary = useCallback((item) => {
    const options = item?.options || {};
    const fields = [];

    if (item?.qty) {
      fields.push(`Qty: ${item.qty}`);
    }

    if (options.width) {
      fields.push(`Width: ${options.width}`);
    }

    if (options.height) {
      fields.push(`Height: ${options.height}`);
    }

    if (options.unit) {
      fields.push(`Unit: ${options.unit}`);
    }

    if (options.color) {
      fields.push(`Color: ${options.color}`);
    }

    if (Array.isArray(options.sizes) && options.sizes.length > 0) {
      const sizeSummary = options.sizes
        .filter((size) => Number(size.qty || 0) > 0)
        .map((size) => `${size.size}: ${size.qty}`)
        .join(", ");

      if (sizeSummary) {
        fields.push(`Sizes: ${sizeSummary}`);
      }
    }

    if (options.dynamicOptions) {
      Object.entries(options.dynamicOptions).forEach(([key, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          value !== "" &&
          value !== false
        ) {
          fields.push(`${key}: ${value}`);
        }
      });
    }

    return fields.join(" • ");
  }, []);

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <section>
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-xl font-bold">{title}</h2>

        <div className="flex items-center gap-3">
          {showCreateJob && (
            <button
              type="button"
              disabled={createJobDisabled}
              onClick={onCreateJob}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                createJobDisabled
                  ? "cursor-not-allowed bg-gray-200 text-gray-400"
                  : "border border-blue-600 bg-white text-blue-600 hover:bg-blue-50"
              }`}
            >
              {createJobLabel}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddCard((current) => !current)}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            {addButtonLabel}
          </button>
        </div>
      </div>

      {/* PRODUCTS CARD */}
      <div className="mx-auto mt-2 max-w-[1240px] rounded-xl bg-white px-5 py-2 shadow-md">
        <div className="space-y-10 py-6">
          {/* ADD ITEM */}
          {showAddCard && (
            <div className="relative rounded-xl border bg-gray-50 p-5 shadow-sm">
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  className="text-xl font-bold text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* CATALOG TABS */}
                {allowProducts && allowApparel && (
                  <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProductCatalog("products");
                        setProductSearch("");
                        setProductResults([]);
                      }}
                      className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                        productCatalog === "products"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Products
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProductCatalog("apparel");
                        setProductSearch("");
                        setProductResults([]);
                      }}
                      className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                        productCatalog === "apparel"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      SanMar Apparel
                    </button>
                  </div>
                )}

                {/* ADD ITEM ROW */}
                <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-12">
                  {/* SEARCH */}
                  <div className="relative lg:col-span-3">
                    <label className="text-xs font-semibold text-gray-500">
                      Search
                    </label>

                    <div className="relative mt-1">
                      <Search
                        className="absolute left-3 top-3 text-gray-400"
                        size={16}
                      />

                      <input
                        type="text"
                        className="w-full rounded-lg border px-3 py-2.5 pl-9"
                        placeholder={
                          productCatalog === "apparel"
                            ? "Search brand, style or garment..."
                            : "Search products..."
                        }
                        value={productSearch}
                        onChange={(event) =>
                          setProductSearch(event.target.value)
                        }
                      />
                    </div>

                    {isSearchingProducts && (
                      <p className="mt-2 text-xs text-gray-500">Searching...</p>
                    )}

                    {productResults.length > 0 && (
                      <div className="absolute left-0 top-[calc(100%+8px)] z-50 max-h-[320px] w-full min-w-[340px] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
                        {productResults.map((product) => (
                          <button
                            key={`${product.productType}-${product.id}`}
                            type="button"
                            onClick={() => handleSelectProduct(product)}
                            className="w-full border-b border-gray-100 px-4 py-3 text-left transition last:border-0 hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              {product.productType === "apparel" && (
                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                                  {product.imageUrl ? (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.name}
                                      className="h-full w-full object-contain"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                      No image
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="truncate font-medium text-gray-900">
                                  {product.name}
                                </p>

                                {product.description && (
                                  <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                                    {product.description}
                                  </p>
                                )}

                                {product.productType === "apparel" && (
                                  <>
                                    <p className="mt-0.5 text-xs font-medium text-blue-600">
                                      {product.brand || "SanMar"} · Style{" "}
                                      {product.supplierStyle}
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                      {product.category || "Apparel"} ·{" "}
                                      {product._count?.variants || 0} variants
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* DESCRIPTION */}
                  <div className="lg:col-span-3">
                    <label className="text-xs font-semibold text-gray-500">
                      Description
                    </label>

                    <input
                      type="text"
                      className="mt-1 w-full rounded-lg border px-3 py-2.5"
                      placeholder="Description"
                      value={manualDesc}
                      onChange={(event) => setManualDesc(event.target.value)}
                    />
                  </div>

                  {/* QTY */}
                  <div className="lg:col-span-1">
                    <label className="text-xs font-semibold text-gray-500">
                      Qty
                    </label>

                    <input
                      inputMode="numeric"
                      className="mt-1 w-full rounded-lg border px-3 py-2.5 text-right"
                      value={manualQtyInput}
                      onChange={(event) => {
                        const value = event.target.value;

                        if (!/^\d*$/.test(value)) return;

                        setManualQtyInput(value);
                        setManualQty(Number(value || 0));
                      }}
                    />
                  </div>

                  {/* UNIT PRICE */}
                  <div className="lg:col-span-2">
                    <label className="text-xs font-semibold text-gray-500">
                      Unit Price
                    </label>

                    <input
                      inputMode="decimal"
                      className="mt-1 w-full rounded-lg border px-3 py-2.5 text-right"
                      value={manualUnitInput}
                      onChange={(event) => {
                        const value = event.target.value;

                        if (!/^\d*\.?\d*$/.test(value)) return;

                        setManualUnitInput(value);
                        setManualUnit(Number(value || 0));
                      }}
                    />
                  </div>

                  {/* TOTAL */}
                  <div className="lg:col-span-2">
                    <label className="text-xs font-semibold text-gray-500">
                      Total
                    </label>

                    <input
                      readOnly
                      className="mt-1 w-full rounded-lg border bg-gray-100 px-3 py-2.5 text-right font-semibold"
                      value={manualTotal === 0 ? "0" : manualTotal.toFixed(2)}
                    />
                  </div>

                  {/* ADD */}
                  <div className="flex justify-center lg:col-span-1">
                    <button
                      type="button"
                      onClick={addManualItem}
                      className="flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-green-600 text-white shadow hover:bg-emerald-700"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ITEMS LIST */}
          <div>
            {items.length === 0 ? (
              <p className="text-gray-500">No products added yet.</p>
            ) : (
              items.map((item, index) => {
                const isManual = !item.product;
                const displayQty = item.qty || 1;
                const summary = buildOptionSummary(item);

                return (
                  <div
                    key={item.id || `${item.productId}-${index}`}
                    className={`mb-1 p-5 shadow-sm ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute right-4 top-2 z-10 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {!item._expanded ? (
                      <div
                        className="cursor-pointer"
                        onClick={() => openItem(index)}
                      >
                        <div className="grid grid-cols-1 gap-4 rounded-lg p-4 md:grid-cols-[30%_1fr_120px_160px_150px]">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {item.name}
                            </p>

                            {summary && (
                              <p className="mt-1 text-sm text-gray-600">
                                {summary}
                              </p>
                            )}
                          </div>

                          <div />

                          <div>
                            <p className="text-sm text-gray-500">Qty</p>

                            <p className="font-bold">{displayQty}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Unit Price</p>

                            <p className="font-semibold">
                              ${Number(item.unitPrice || 0).toLocaleString()}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Total</p>

                            <p className="font-bold">
                              ${Number(item.total || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <InlineProductEditor
                        product={item.product || null}
                        data={item}
                        autoCalculateOnMount={autoCalculateOnMount}
                        onChange={(fields) => handleItemChange(index, fields)}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
