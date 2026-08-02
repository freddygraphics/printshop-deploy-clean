"use client";

import { useCallback, useEffect, useState } from "react";

export default function useDocumentItems({ items, setItems, onSave }) {
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [productCatalog, setProductCatalog] = useState("products");
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  const [showAddCard, setShowAddCard] = useState(false);

  const [manualDesc, setManualDesc] = useState("");
  const [manualQtyInput, setManualQtyInput] = useState("1");
  const [manualQty, setManualQty] = useState(1);

  const [manualUnitInput, setManualUnitInput] = useState("0");
  const [manualUnit, setManualUnit] = useState(0);

  const manualTotal = manualQty * manualUnit;

  const normalizeOptions = useCallback((options) => {
    if (!options || Array.isArray(options)) return {};
    return options;
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

        if (productCatalog === "apparel") {
          results = Array.isArray(data?.products)
            ? data.products.map((product) => ({
                ...product,
                productType: "apparel",
              }))
            : [];
        } else {
          results = Array.isArray(data)
            ? data.map((product) => ({
                ...product,
                productType: product.productType || "product",
              }))
            : [];

          const normalizedQuery = query.toLowerCase();

          if (
            normalizedQuery.includes("sticker") ||
            normalizedQuery.includes("label") ||
            normalizedQuery.includes("calcomania")
          ) {
            results.unshift({
              id: "sticker-calculator",
              name: "Sticker Calculator",
              category: "stickers",
              basePrice: 0,
              productType: "calculator",
              isVirtual: true,
            });
          }

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
  }, [productSearch, productCatalog]);

  // =====================================================
  // RESET SEARCH
  // =====================================================
  const resetProductSearch = useCallback(() => {
    setProductSearch("");
    setProductResults([]);
    setShowAddCard(false);
  }, []);

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

        setItems((previousItems) => [
          ...previousItems.map((item) => ({
            ...item,
            _expanded: false,
          })),
          newItem,
        ]);

        resetProductSearch();
        return;
      }

      // -----------------------------------------
      // RAFFLE TICKETS
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

        setItems((previousItems) => [
          ...previousItems.map((item) => ({
            ...item,
            _expanded: false,
          })),
          newItem,
        ]);

        resetProductSearch();
        return;
      }

      // -----------------------------------------
      // SANMAR
      // -----------------------------------------
      if (productResult.productType === "apparel") {
        try {
          const response = await fetch(`/api/apparel/${productResult.id}`, {
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error("Could not load SanMar product");
          }

          const data = await response.json();
          const apparelProduct = data.product;

          const newItem = {
            id: crypto.randomUUID(),
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

          setItems((previousItems) => [
            ...previousItems.map((item) => ({
              ...item,
              _expanded: false,
            })),
            newItem,
          ]);

          resetProductSearch();
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
          throw new Error("Could not load product");
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

        setItems((previousItems) => [
          ...previousItems.map((item) => ({
            ...item,
            _expanded: false,
          })),
          newItem,
        ]);

        resetProductSearch();
      } catch (error) {
        console.error("Error selecting product:", error);
        alert("Could not load the product.");
      }
    },
    [normalizeOptions, resetProductSearch, setItems],
  );

  // =====================================================
  // ADD MANUAL ITEM
  // =====================================================
  const addManualItem = useCallback(async () => {
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
      total: Number(manualQty) * Number(manualUnit),
      options: {},
      _expanded: false,
    };

    const nextItems = [...items, newItem];

    setItems(nextItems);
    setShowAddCard(false);

    if (typeof onSave === "function") {
      await onSave(nextItems);
    }

    setManualDesc("");
    setManualQty(1);
    setManualQtyInput("1");
    setManualUnit(0);
    setManualUnitInput("0");
  }, [items, manualDesc, manualQty, manualUnit, onSave, setItems]);

  // =====================================================
  // UPDATE ITEM
  // =====================================================
  const updateItem = useCallback(
    async (index, fields) => {
      const nextItems = items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        return {
          ...item,
          ...fields,

          options: {
            ...(item.options || {}),
            ...(fields.options || {}),

            finish:
              fields.finish ??
              fields.options?.finish ??
              item.options?.finish ??
              null,

            design:
              fields.design ??
              fields.options?.design ??
              item.options?.design ??
              null,

            sides:
              fields.sides ??
              fields.options?.sides ??
              item.options?.sides ??
              null,

            corners:
              fields.corners ??
              fields.options?.corners ??
              item.options?.corners ??
              null,
          },

          _expanded: fields.__commit ? false : item._expanded,
        };
      });

      setItems(nextItems);

      if (fields.__commit && typeof onSave === "function") {
        await onSave(nextItems);
      }

      return nextItems;
    },
    [items, onSave, setItems],
  );

  // =====================================================
  // REMOVE ITEM
  // =====================================================
  const removeItem = useCallback(
    async (index) => {
      const nextItems = items.filter((_, itemIndex) => itemIndex !== index);

      setItems(nextItems);

      if (typeof onSave === "function") {
        await onSave(nextItems);
      }
    },
    [items, onSave, setItems],
  );

  // =====================================================
  // OPEN ITEM
  // =====================================================
  const openItem = useCallback(
    (index) => {
      setItems((previousItems) =>
        previousItems.map((item, itemIndex) => ({
          ...item,
          _expanded: itemIndex === index,
        })),
      );
    },
    [setItems],
  );

  // =====================================================
  // SUMMARY
  // =====================================================
  const buildOptionSummary = useCallback((item) => {
    if (!item?.options) return "";

    const fields = [];

    if (item.qty) {
      fields.push(`Qty: ${item.qty}`);
    }

    if (item.options.width) {
      fields.push(`Width: ${item.options.width}`);
    }

    if (item.options.height) {
      fields.push(`Height: ${item.options.height}`);
    }

    if (item.options.unit) {
      fields.push(`Unit: ${item.options.unit}`);
    }

    if (item.options.color) {
      fields.push(`Color: ${item.options.color}`);
    }

    if (Array.isArray(item.options.sizes) && item.options.sizes.length > 0) {
      const sizes = item.options.sizes
        .filter((size) => Number(size.qty || 0) > 0)
        .map((size) => `${size.size}: ${size.qty}`)
        .join(", ");

      if (sizes) {
        fields.push(`Sizes: ${sizes}`);
      }
    }

    if (item.options.dynamicOptions) {
      Object.entries(item.options.dynamicOptions).forEach(([key, value]) => {
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

  return {
    productSearch,
    setProductSearch,

    productResults,
    setProductResults,

    productCatalog,
    setProductCatalog,

    isSearchingProducts,

    showAddCard,
    setShowAddCard,

    manualDesc,
    setManualDesc,

    manualQtyInput,
    setManualQtyInput,

    manualQty,
    setManualQty,

    manualUnitInput,
    setManualUnitInput,

    manualUnit,
    setManualUnit,

    manualTotal,

    handleSelectProduct,
    addManualItem,
    updateItem,
    removeItem,
    openItem,
    buildOptionSummary,
  };
}
