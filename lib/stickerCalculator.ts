export function stickerCalculator({
  sheetWidth,
  sheetHeight,
  stickerWidth,
  stickerHeight,
  spacing = 0.125,
  quantity,
  settings,
}: {
  sheetWidth: number;
  sheetHeight: number;
  stickerWidth: number;
  stickerHeight: number;
  spacing?: number;
  quantity: number;
  settings: any;
}) {
  /* SETTINGS */

  const vinylRollPrice = Number(settings?.vinylRollPrice ?? 0);
  const vinylRollWidth = Number(settings?.vinylRollWidth ?? 0);
  const vinylRollLength = Number(settings?.vinylRollLength ?? 0);

  const laminateRollPrice = Number(settings?.laminateRollPrice ?? 0);
  const laminateRollWidth = Number(settings?.laminateRollWidth ?? 0);
  const laminateRollLength = Number(settings?.laminateRollLength ?? 0);

  const inkCostPerSqft = Number(settings?.inkCostPerSqft ?? 0);

  const machineCostPerHour = Number(settings?.machineCostPerHour ?? 0);
  const laborPerHour = Number(settings?.laborPerHour ?? 0);

  const cuttingCostPerSheet = Number(settings?.cuttingCostPerSheet ?? 0);

  const wastePercent = Number(settings?.wastePercent ?? settings?.waste ?? 0);

  const setupFee = Number(settings?.setupFee ?? 0);

  const minimumOrderPrice = Number(
    settings?.minimumOrderPrice ??
      settings?.minimumStickerPrice ??
      settings?.minimumPrice ??
      0,
  );

  const profitMargin = Number(settings?.profitMargin ?? settings?.profit ?? 0);

  /* VALIDATION */

  const safeQuantity = Math.max(Number(quantity || 0), 1);

  /* STICKERS PER SHEET */

  const realWidth = stickerWidth + spacing;
  const realHeight = stickerHeight + spacing;

  const perRow = Math.max(Math.floor(sheetWidth / realWidth), 0);
  const perColumn = Math.max(Math.floor(sheetHeight / realHeight), 0);

  const stickersPerSheet = Math.max(perRow * perColumn, 1);

  const sheetsNeeded = Math.ceil(safeQuantity / stickersPerSheet);

  /* AREA */

  const sheetArea = sheetWidth * sheetHeight;
  const sheetSqFt = sheetArea / 144;

  /* VINYL */

  const vinylArea = vinylRollWidth * vinylRollLength;

  const vinylCostSqIn = vinylArea > 0 ? vinylRollPrice / vinylArea : 0;

  const vinylCost = sheetArea * vinylCostSqIn;

  /* LAMINATE */

  const laminateArea = laminateRollWidth * laminateRollLength;

  const laminateCostSqIn =
    laminateArea > 0 ? laminateRollPrice / laminateArea : 0;

  const laminateCost = sheetArea * laminateCostSqIn;

  /* INK */

  const inkCost = sheetSqFt * inkCostPerSqft;

  /* MACHINE */

  const machineMinutes = 4;

  const machineCost = (machineCostPerHour / 60) * machineMinutes;

  /* LABOR */

  const laborMinutes = 3;

  const laborCost = (laborPerHour / 60) * laborMinutes;

  /* CUTTING */

  const cuttingCost = cuttingCostPerSheet;

  /* BASE COST PER SHEET */

  let sheetBaseCost =
    vinylCost + laminateCost + inkCost + machineCost + laborCost + cuttingCost;

  /* WASTE */

  const wasteCost = sheetBaseCost * (wastePercent / 100);

  sheetBaseCost += wasteCost;

  /* PRODUCTION COST */

  const productionCost = sheetBaseCost * sheetsNeeded + setupFee;

  /* PROFIT */

  const profitAmount = productionCost * (profitMargin / 100);

  let totalCost = productionCost + profitAmount;

  /* MINIMUM ORDER PROTECTION */

  if (totalCost < minimumOrderPrice) {
    totalCost = minimumOrderPrice;
  }

  /* PRICE PER STICKER */

  const pricePerSticker = totalCost / safeQuantity;

  return {
    perRow,
    perColumn,
    stickersPerSheet,
    sheetsNeeded,

    vinylCost,
    laminateCost,
    inkCost,
    machineCost,
    laborCost,
    cuttingCost,
    wasteCost,
    setupFee,
    profitAmount,

    sheetCost: sheetBaseCost,
    productionCost,
    totalCost,
    pricePerSticker,
  };
}
