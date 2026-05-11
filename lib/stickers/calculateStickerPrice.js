export function calculateStickerPrice({
  stickerWidth,
  stickerHeight,
  quantity,
  pricing,
  laminated,
}) {
  const sheetWidth = 11;
  const sheetHeight = 17;
  const margin = 0.25;
  const gap = 0.125;

  const usableWidth = sheetWidth - margin * 2;
  const usableHeight = sheetHeight - margin * 2;

  const perRow = Math.floor((usableWidth + gap) / (stickerWidth + gap));
  const perColumn = Math.floor((usableHeight + gap) / (stickerHeight + gap));

  const stickersPerSheet = perRow * perColumn;

  if (stickersPerSheet <= 0) {
    return { error: "Sticker muy grande para la hoja" };
  }

  const sheetsNeeded = Math.ceil(quantity / stickersPerSheet);

  const laminate = laminated ? pricing.laminateCost : 0;

  const baseSheetCost = pricing.costPerSheet + laminate + pricing.cutCost;

  const wasteMultiplier = 1 + pricing.wastePercent / 100;

  const rawTotal = sheetsNeeded * baseSheetCost * wasteMultiplier;

  // 🔥 DESCUENTOS POR VOLUMEN
  let discountPercent = 0;

  if (sheetsNeeded >= 200) {
    discountPercent = 80;
  } else if (sheetsNeeded >= 100) {
    discountPercent = 65;
  } else if (sheetsNeeded >= 50) {
    discountPercent = 10;
  } else if (sheetsNeeded >= 20) {
    discountPercent = 5;
  }

  const totalCost = rawTotal;

  // 🔥 precio con ganancia
  const basePrice = totalCost / (1 - pricing.profitMargin / 100);

  // 🔥 descuento al cliente
  const discountAmount = basePrice * (discountPercent / 100);

  const finalPrice = basePrice - discountAmount;
  const minimumPrice = 15;

  const safeFinalPrice = finalPrice < minimumPrice ? minimumPrice : finalPrice;

  return {
    pricing,
    perRow,
    perColumn,
    stickersPerSheet,
    sheetsNeeded,

    discountPercent,
    discountAmount,

    totalCost,
    finalPrice,
  };
}
