function normalizeOptions(options) {
  if (!options || Array.isArray(options)) {
    return {};
  }

  return options;
}

export function mapInvoiceItems(invoiceItems = []) {
  if (!Array.isArray(invoiceItems)) {
    return [];
  }

  return invoiceItems.map((invoiceItem) => {
    const productData = invoiceItem.product;

    return {
      // ID real de Prisma
      id: invoiceItem.id,

      // ID temporal solo para uso visual si hiciera falta
      clientId: `invoice-item-${invoiceItem.id}`,

      productId: invoiceItem.productId ?? null,
      product: productData ?? null,

      printProductionProfileId: invoiceItem.printProductionProfileId ?? null,

      name: invoiceItem.name || "",
      qty: Number(invoiceItem.qty || 1),
      unitPrice: Number(invoiceItem.unitPrice || 0),
      total: Number(invoiceItem.total || 0),

      // Costo histórico registrado en Profit Report
      totalCost:
        invoiceItem.totalCost === null || invoiceItem.totalCost === undefined
          ? null
          : Number(invoiceItem.totalCost),

      pricingMode: invoiceItem.pricingMode || "manual",

      widthIn:
        invoiceItem.widthIn === null || invoiceItem.widthIn === undefined
          ? null
          : Number(invoiceItem.widthIn),

      heightIn:
        invoiceItem.heightIn === null || invoiceItem.heightIn === undefined
          ? null
          : Number(invoiceItem.heightIn),

      sqft:
        invoiceItem.sqft === null || invoiceItem.sqft === undefined
          ? null
          : Number(invoiceItem.sqft),

      priceSnapshot: invoiceItem.priceSnapshot ?? null,

      notes: invoiceItem.notes ?? "",

      customFields:
        productData?.customFields ?? productData?.template?.fields ?? null,

      options: normalizeOptions(
        invoiceItem.options ??
          productData?.defaultOptions ??
          productData?.template?.options,
      ),

      _expanded: false,
    };
  });
}
