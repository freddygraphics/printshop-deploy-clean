export function calculateStickerPrice({
  stickerWidth,
  stickerHeight,
  quantity,
  pricing,
  laminated,
}) {
  const sheetWidth = Number(pricing?.sheetWidth || 11);
  const sheetHeight = Number(pricing?.sheetHeight || 17);

  const marginX = 1.25;
  const marginY = 0.25;
  const gap = 0.125;

  const usableWidth = sheetWidth - marginX * 2;
  const usableHeight = sheetHeight - marginY * 2;

  const perRow = Math.floor((usableWidth + gap) / (stickerWidth + gap));

  const perColumn = Math.floor((usableHeight + gap) / (stickerHeight + gap));

  const stickersPerSheet = perRow * perColumn;

  if (stickersPerSheet <= 0) {
    return {
      error: "Sticker muy grande para la hoja",
    };
  }

  const sheetsNeeded = Math.ceil(quantity / stickersPerSheet);

  const laminate = laminated ? Number(pricing.laminateCost || 0) : 0;

  const baseSheetCost =
    Number(pricing.costPerSheet || 0) + laminate + Number(pricing.cutCost || 0);

  const wasteMultiplier = 1 + Number(pricing.wastePercent || 0) / 100;

  const rawTotal = sheetsNeeded * baseSheetCost * wasteMultiplier;

  // DESCUENTOS POR VOLUMEN
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

  const profitMargin = Number(pricing.profitMargin || 0);

  const basePrice = totalCost / (1 - profitMargin / 100);

  const discountAmount = basePrice * (discountPercent / 100);

  const finalPrice = basePrice - discountAmount;

  const minimumPrice = 15;

  const safeFinalPrice = finalPrice < minimumPrice ? minimumPrice : finalPrice;

  return {
    pricing,

    sheetWidth,
    sheetHeight,

    perRow,
    perColumn,
    stickersPerSheet,
    sheetsNeeded,

    discountPercent,
    discountAmount,

    totalCost,

    finalPrice: safeFinalPrice,
  };
}
