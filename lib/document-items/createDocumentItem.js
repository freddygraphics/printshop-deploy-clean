function normalizeOptions(options) {
  if (!options || Array.isArray(options)) {
    return {};
  }

  return options;
}

function createItemId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function createDocumentItem(productResult) {
  if (!productResult?.id) {
    throw new Error("Invalid product");
  }

  // =====================================================
  // STICKER CALCULATOR
  // =====================================================
  if (productResult.id === "sticker-calculator") {
    return {
      id: createItemId(),
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
  }

  // =====================================================
  // RAFFLE TICKETS
  // =====================================================
  if (productResult.id === "raffle-tickets-calculator") {
    return {
      id: createItemId(),
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
  }

  // =====================================================
  // SANMAR APPAREL
  // =====================================================
  if (productResult.productType === "apparel") {
    const response = await fetch(`/api/apparel/${productResult.id}`, {
      cache: "no-store",
    });

    const apparelData = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        apparelData?.error ||
          apparelData?.details ||
          "Could not load SanMar product",
      );
    }

    const apparelProduct = apparelData?.product;

    if (!apparelProduct) {
      throw new Error("SanMar product data is missing");
    }

    const colors = Array.isArray(apparelData.colors) ? apparelData.colors : [];

    const variants = Array.isArray(apparelData.variants)
      ? apparelData.variants
      : [];

    const sizes = Array.isArray(apparelData.sizes) ? apparelData.sizes : [];

    const inventory = Array.isArray(apparelData.inventory)
      ? apparelData.inventory
      : [];

    return {
      id: createItemId(),
      productId: null,

      product: {
        ...apparelProduct,

        productType: "apparel",

        colors,
        variants,
        sizes,
        inventory,
      },

      name: `${apparelProduct.brand || "SanMar"} ${
        apparelProduct.supplierStyle || ""
      } - ${apparelProduct.name || "Apparel"}`,

      description: apparelProduct.description || apparelProduct.name || "",

      qty: 1,
      unitPrice: 0,
      total: 0,

      customFields: null,

      options: {
        productType: "apparel",

        apparelProductId: apparelProduct.id,
        supplier: apparelProduct.supplier || "SanMar",
        supplierStyle: apparelProduct.supplierStyle,
        brand: apparelProduct.brand,

        availableColors: colors,
        availableVariants: variants,

        color: null,
        sizes: [],
        printLocations: [],
        dtf: null,
      },

      _expanded: true,
    };
  }
  // =====================================================
  // NORMAL PRODUCT
  // =====================================================

  const response = await fetch(`/api/products/${productResult.id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not load product");
  }

  const fullProduct = await response.json();

  return {
    id: createItemId(),

    productId: fullProduct.id,

    product: fullProduct,

    name: fullProduct.name,

    qty: 1,

    unitPrice: 0,

    total: 0,

    customFields: fullProduct.customFields || null,

    options: normalizeOptions(fullProduct.defaultOptions ?? {}),

    _expanded: true,
  };
}
