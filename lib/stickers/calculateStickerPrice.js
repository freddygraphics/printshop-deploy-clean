export function calculateStickerPrice({
  stickerWidth,
  stickerHeight,
  quantity,
  material,
  laminate = null,
  laminated = false,
  cutType = "die-cut",
  settings,
}) {
  const width = Number(stickerWidth);
  const height = Number(stickerHeight);
  const qty = Math.ceil(Number(quantity));

  const rollWidth = Number(material?.rollWidthIn || 0);
  const materialCostPerLinearFt = Number(material?.costPerLinearFt || 0);
  const mediaWidthIn = Number(settings?.mediaWidthIn || 20);

  const productionMediaWidth = Math.min(rollWidth, mediaWidthIn);

  const effectiveMaterialCostPerLinearFt =
    rollWidth > 0
      ? materialCostPerLinearFt * (productionMediaWidth / rollWidth)
      : 0;
  const gap = Number(settings?.gapIn || 0);
  const sideMargin = Number(settings?.sideMarginIn || 0);
  const wastePercent = Number(settings?.wastePercent || 0);
  const usablePrintWidthIn = Number(settings?.usablePrintWidthIn || 18.9);
  const inkCostPerSqft = Number(settings?.inkCostPerSqft || 0);
  const machineCostPerHour = Number(settings?.machineCostPerHour || 0);
  const laborPerHour = Number(settings?.laborPerHour || 0);
  const printSpeedSqftPerHour = Number(settings?.printSpeedSqftPerHour || 0);

  const laborMinutesPerOrder = Number(settings?.laborMinutesPerOrder || 0);

  const cutSpeedInPerMinute = Number(settings?.cutSpeedInPerMinute || 0);
  const cuttingBaseFee = Number(settings?.cuttingBaseFee || 0);
  const cuttingPerMinute = Number(settings?.cuttingPerMinute || 0);

  const setupFee = Number(settings?.setupFee || 0);
  const profitMargin = Number(settings?.profitMargin || 0);
  const minimumOrderPrice = Number(settings?.minimumOrderPrice || 0);

  // ======================================================
  // VALIDATION
  // ======================================================

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(qty) ||
    width <= 0 ||
    height <= 0 ||
    qty <= 0
  ) {
    return {
      error: "Invalid sticker dimensions or quantity.",
    };
  }

  if (rollWidth <= 0 || materialCostPerLinearFt <= 0) {
    return {
      error: "The selected material does not have valid roll pricing.",
    };
  }

  // ======================================================
  // AVAILABLE PRINT WIDTH
  // ======================================================

  const materialUsableWidth = Math.max(0, rollWidth - sideMargin * 2);

  const usableWidth = Math.min(materialUsableWidth, usablePrintWidthIn);

  if (usableWidth <= 0) {
    return {
      error: "The material roll does not have enough usable width.",
    };
  }

  // ======================================================
  // TEST BOTH ORIENTATIONS
  // ======================================================

  const normal = calculateLayout({
    acrossSize: width,
    alongSize: height,
    quantity: qty,
    usableWidth,
    gap,
    rotated: false,
  });

  const rotated = calculateLayout({
    acrossSize: height,
    alongSize: width,
    quantity: qty,
    usableWidth,
    gap,
    rotated: true,
  });

  const validLayouts = [normal, rotated].filter(Boolean);

  if (validLayouts.length === 0) {
    return {
      error: `Sticker is too large for the ${rollWidth}" material roll.`,
    };
  }

  // Use the orientation that consumes less roll length.
  const layout = validLayouts.reduce((best, current) =>
    current.usedLengthIn < best.usedLengthIn ? current : best,
  );

  // ======================================================
  // PRODUCTION WASTE
  // ======================================================

  const wasteMultiplier = 1 + wastePercent / 100;

  const productionLengthIn = layout.usedLengthIn * wasteMultiplier;
  const linearFeetUsed = productionLengthIn / 12;

  // Actual media consumed from the roll.
  const productionAreaSqft = (productionMediaWidth / 12) * linearFeetUsed;

  // Finished sticker surface area.
  const finishedStickerAreaSqft = (width * height * qty) / 144;

  // ======================================================
  // VINYL COST
  // ======================================================

  const materialCost = linearFeetUsed * effectiveMaterialCostPerLinearFt;

  // ======================================================
  // LAMINATE COST
  // ======================================================

  let laminateCost = 0;
  let laminateCostPerSqft = 0;

  if (laminated && laminate) {
    laminateCostPerSqft = Number(laminate.costPerSqft || 0);

    if (laminateCostPerSqft > 0) {
      laminateCost = productionAreaSqft * laminateCostPerSqft;
    }
  }

  // ======================================================
  // INK
  // ======================================================

  // Ink is based on the finished printed sticker area.
  const inkCost = finishedStickerAreaSqft * inkCostPerSqft;

  // ======================================================
  // CUTTING
  // ======================================================

  /*
   * We do not yet have cutting speed stored in settings.
   *
   * Therefore we DO NOT invent cutting minutes.
   * For now only the configured base cutting fee is applied.
   *
   * Later we can add:
   * cutSpeedInPerMinute
   * cutComplexity
   *
   * and calculate this from contour length.
   */

  // Approximate contour length.
  // This uses the rectangular perimeter of each sticker.
  // Later we can add a complexity multiplier for irregular die-cut shapes.
  const cutLengthPerStickerIn = (width + height) * 2;

  const totalCutLengthIn = cutLengthPerStickerIn * qty;

  const estimatedCutMinutes =
    cutSpeedInPerMinute > 0 ? totalCutLengthIn / cutSpeedInPerMinute : 0;

  const cuttingCost = cuttingBaseFee + estimatedCutMinutes * cuttingPerMinute;

  // ======================================================
  // MACHINE + LABOR
  // ======================================================

  /*
   * Same situation here:
   * machineCostPerHour and laborPerHour exist,
   * but we do not yet have production speed/time settings.
   *
   * Do not invent machine or labor hours.
   */

  // Printing time based on media area consumed.
  const estimatedMachineHours =
    printSpeedSqftPerHour > 0 ? productionAreaSqft / printSpeedSqftPerHour : 0;

  // Base handling/setup labor for every order,
  // plus estimated cutting time.
  const estimatedLaborMinutes = laborMinutesPerOrder;

  const estimatedLaborHours = estimatedLaborMinutes / 60;

  const machineCost = estimatedMachineHours * machineCostPerHour;

  const laborCost = estimatedLaborHours * laborPerHour;

  // ======================================================
  // TOTAL PRODUCTION COST
  // ======================================================

  const totalCost =
    materialCost +
    laminateCost +
    inkCost +
    cuttingCost +
    machineCost +
    laborCost +
    setupFee;

  // ======================================================
  // SELLING PRICE
  // ======================================================

  // Prevent division by zero / impossible 100% margin.
  const safeMarginPercent = Math.min(Math.max(profitMargin, 0), 95);

  const marginDecimal = safeMarginPercent / 100;

  const priceForMargin =
    marginDecimal < 1 ? totalCost / (1 - marginDecimal) : totalCost;

  const finalPrice = Math.max(priceForMargin, minimumOrderPrice);

  const unitPrice = finalPrice / qty;

  // ======================================================
  // RESULT
  // ======================================================

  return {
    material: {
      id: material.id,
      name: material.name,

      originalRollWidthIn: rollWidth,
      productionMediaWidthIn: productionMediaWidth,

      originalCostPerLinearFt: round(materialCostPerLinearFt, 4),

      effectiveCostPerLinearFt: round(effectiveMaterialCostPerLinearFt, 4),
    },

    laminate:
      laminated && laminate
        ? {
            id: laminate.id,
            name: laminate.name,
            costPerSqft: round(laminateCostPerSqft, 4),
          }
        : null,

    stickerWidth: width,
    stickerHeight: height,
    quantity: qty,

    laminated: Boolean(laminated),
    cutType,

    layout: {
      rotated: layout.rotated,
      usableWidth: round(usableWidth, 4),
      across: layout.across,
      rows: layout.rows,

      rawLengthIn: round(layout.usedLengthIn, 4),
      productionLengthIn: round(productionLengthIn, 4),

      linearFeetUsed: round(linearFeetUsed, 4),
      productionAreaSqft: round(productionAreaSqft, 4),
      finishedStickerAreaSqft: round(finishedStickerAreaSqft, 4),

      gapIn: gap,
      sideMarginIn: sideMargin,
      wastePercent,
    },

    costs: {
      material: round(materialCost),
      laminate: round(laminateCost),
      ink: round(inkCost),
      cutting: round(cuttingCost),
      machine: round(machineCost),
      labor: round(laborCost),
      setup: round(setupFee),

      total: round(totalCost),
    },

    pricing: {
      profitMargin: safeMarginPercent,
      minimumOrderPrice: round(minimumOrderPrice),

      priceBeforeMinimum: round(priceForMargin),

      finalPrice: round(finalPrice),

      unitPrice: round(unitPrice, 4),
    },

    finalPrice: round(finalPrice),
    unitPrice: round(unitPrice, 4),
    totalCost: round(totalCost),

    production: {
      printSpeedSqftPerHour: round(printSpeedSqftPerHour, 2),

      estimatedMachineMinutes: round(estimatedMachineHours * 60, 2),

      baseLaborMinutes: round(laborMinutesPerOrder, 2),

      totalCutLengthIn: round(totalCutLengthIn, 2),

      cutSpeedInPerMinute: round(cutSpeedInPerMinute, 2),

      estimatedCutMinutes: round(estimatedCutMinutes, 2),

      estimatedLaborMinutes: round(estimatedLaborMinutes, 2),
    },
  };
}

// ======================================================
// LAYOUT
// ======================================================

function calculateLayout({
  acrossSize,
  alongSize,
  quantity,
  usableWidth,
  gap,
  rotated,
}) {
  const across = Math.floor((usableWidth + gap) / (acrossSize + gap));

  if (across < 1) {
    return null;
  }

  const rows = Math.ceil(quantity / across);

  const usedLengthIn = rows * alongSize + Math.max(0, rows - 1) * gap;

  return {
    rotated,
    across,
    rows,
    usedLengthIn,
  };
}

// ======================================================
// ROUNDING
// ======================================================

function round(value, decimals = 2) {
  const factor = 10 ** decimals;

  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}
