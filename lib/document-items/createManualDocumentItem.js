function createItemId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `manual-item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createManualDocumentItem({ description, quantity, unitPrice }) {
  const cleanDescription = String(description || "").trim();
  const cleanQuantity = Number(quantity || 0);
  const cleanUnitPrice = Number(unitPrice || 0);

  if (!cleanDescription) {
    throw new Error("Enter a description.");
  }

  if (!Number.isFinite(cleanQuantity) || cleanQuantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  if (!Number.isFinite(cleanUnitPrice) || cleanUnitPrice < 0) {
    throw new Error("Unit price cannot be negative.");
  }

  return {
    id: createItemId(),
    productId: null,
    product: null,
    customFields: null,

    name: cleanDescription,
    qty: cleanQuantity,
    unitPrice: cleanUnitPrice,
    total: cleanQuantity * cleanUnitPrice,

    options: {},
    _expanded: false,
  };
}
