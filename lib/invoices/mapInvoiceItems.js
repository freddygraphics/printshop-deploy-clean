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
      id: crypto.randomUUID(),

      productId: invoiceItem.productId ?? null,
      product: productData ?? null,

      name: invoiceItem.name || "",
      qty: Number(invoiceItem.qty || 1),
      unitPrice: Number(invoiceItem.unitPrice || 0),
      total: Number(invoiceItem.total || 0),

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
