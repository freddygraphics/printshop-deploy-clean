import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_GANG_SHEETS = [
  { feet: 2, price: 19.99, active: true },
  { feet: 5, price: 49.99, active: true },
  { feet: 7, price: 69.99, active: true },
  { feet: 10, price: 89.99, active: true },
  { feet: 15, price: 109.99, active: true },
  { feet: 20, price: 129.99, active: true },
  { feet: 30, price: 179.99, active: true },
];

const DEFAULT_QUANTITY_MARGINS = [
  { minQuantity: 1, maxQuantity: 11, percent: 50 },
  { minQuantity: 12, maxQuantity: 23, percent: 45 },
  { minQuantity: 24, maxQuantity: 47, percent: 40 },
  { minQuantity: 48, maxQuantity: 99, percent: 35 },
  { minQuantity: 100, maxQuantity: null, percent: 30 },
];
const DEFAULT_PRINT_LOCATIONS = [
  {
    key: "front",
    name: "Front",
    width: 3.5,
    height: 3.5,
    enabled: true,
  },
  {
    key: "back",
    name: "Back",
    width: 10.5,
    height: 11,
    enabled: true,
  },
  {
    key: "leftSleeve",
    name: "Left Sleeve",
    width: 3,
    height: 3,
    enabled: false,
  },
  {
    key: "rightSleeve",
    name: "Right Sleeve",
    width: 3,
    height: 3,
    enabled: false,
  },
  {
    key: "longLeftSleeve",
    name: "Long Left Sleeve",
    width: 2.5,
    height: 17,
    enabled: false,
  },
  {
    key: "longRightSleeve",
    name: "Long Right Sleeve",
    width: 2.5,
    height: 17,
    enabled: false,
  },
];
function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeGangSheets(gangSheets) {
  if (!Array.isArray(gangSheets)) {
    return DEFAULT_GANG_SHEETS;
  }

  return gangSheets
    .map((sheet) => ({
      feet: Math.max(0, numberValue(sheet.feet)),
      price: Math.max(0, numberValue(sheet.price)),
      active: sheet.active !== false,
    }))
    .filter((sheet) => sheet.feet > 0)
    .sort((a, b) => a.feet - b.feet);
}

function normalizeQuantityMargins(margins) {
  if (!Array.isArray(margins)) {
    return DEFAULT_QUANTITY_MARGINS;
  }

  return margins.map((margin) => ({
    minQuantity: Math.max(1, numberValue(margin.minQuantity, 1)),
    maxQuantity:
      margin.maxQuantity === null ||
      margin.maxQuantity === undefined ||
      margin.maxQuantity === ""
        ? null
        : Math.max(1, numberValue(margin.maxQuantity, 1)),
    percent: Math.max(0, numberValue(margin.percent)),
  }));
}
function normalizePrintLocations(locations) {
  if (!Array.isArray(locations) || locations.length === 0) {
    return DEFAULT_PRINT_LOCATIONS;
  }

  return locations
    .map((location, index) => ({
      key: String(location.key || `location-${index}`),
      name: String(location.name || "Print Location"),
      width: Math.max(0.1, numberValue(location.width, 1)),
      height: Math.max(0.1, numberValue(location.height, 1)),
      enabled: location.enabled === true,
    }))
    .filter((location) => location.key && location.name);
}
// ========================================
// GET — Read apparel pricing settings
// ========================================

export async function GET() {
  try {
    const settings = await prisma.apparelPricingSettings.upsert({
      where: {
        supplier_decorationMethod: {
          supplier: "SanMar",
          decorationMethod: "DTF",
        },
      },
      update: {},
      create: {
        supplier: "SanMar",
        decorationMethod: "DTF",
        dtfPricingMethod: "GANG_SHEET",
        dtfCostPerSqft: 4,
        dtfRollWidth: 22,
        dtfGap: 0.25,
        gangSheets: DEFAULT_GANG_SHEETS,
        defaultPrintLocations: DEFAULT_PRINT_LOCATIONS,
        laborPerLocation: 2,
        setupFeePerLocation: 0,
        minimumSetupFee: 0,
        supplierShippingFlat: 0,
        dtfShippingFlat: 0,
        shippingPercent: 0,
        wastePercent: 5,
        pricingMode: "MARKUP",
        defaultProfitMargin: 50,
        quantityMargins: DEFAULT_QUANTITY_MARGINS,
        minimumUnitPrice: 0,
        minimumOrderPrice: 0,
        active: true,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET apparel pricing settings error:", error);

    return NextResponse.json(
      { error: "Unable to load apparel pricing settings." },
      { status: 500 },
    );
  }
}

// ========================================
// PUT — Update apparel pricing settings
// ========================================

export async function PUT(request) {
  try {
    const body = await request.json();

    const dtfPricingMethod =
      body.dtfPricingMethod === "SQUARE_FEET" ? "SQUARE_FEET" : "GANG_SHEET";

    const pricingMode = body.pricingMode === "MARGIN" ? "MARGIN" : "MARKUP";

    const settings = await prisma.apparelPricingSettings.upsert({
      where: {
        supplier_decorationMethod: {
          supplier: "SanMar",
          decorationMethod: "DTF",
        },
      },
      update: {
        dtfPricingMethod,
        dtfCostPerSqft: Math.max(0, numberValue(body.dtfCostPerSqft, 4)),
        dtfRollWidth: Math.max(1, numberValue(body.dtfRollWidth, 22)),
        dtfGap: Math.max(0, numberValue(body.dtfGap, 0.25)),
        gangSheets: normalizeGangSheets(body.gangSheets),
        defaultPrintLocations: normalizePrintLocations(
          body.defaultPrintLocations,
        ),
        laborPerLocation: Math.max(0, numberValue(body.laborPerLocation, 2)),
        setupFeePerLocation: Math.max(0, numberValue(body.setupFeePerLocation)),
        minimumSetupFee: Math.max(0, numberValue(body.minimumSetupFee)),

        supplierShippingFlat: Math.max(
          0,
          numberValue(body.supplierShippingFlat),
        ),
        dtfShippingFlat: Math.max(0, numberValue(body.dtfShippingFlat)),
        shippingPercent: Math.max(0, numberValue(body.shippingPercent)),

        wastePercent: Math.max(0, numberValue(body.wastePercent, 5)),

        pricingMode,
        defaultProfitMargin: Math.max(
          0,
          numberValue(body.defaultProfitMargin, 50),
        ),
        quantityMargins: normalizeQuantityMargins(body.quantityMargins),

        minimumUnitPrice: Math.max(0, numberValue(body.minimumUnitPrice)),
        minimumOrderPrice: Math.max(0, numberValue(body.minimumOrderPrice)),

        active: body.active !== false,
      },
      create: {
        supplier: "SanMar",
        decorationMethod: "DTF",
        dtfPricingMethod,
        dtfCostPerSqft: Math.max(0, numberValue(body.dtfCostPerSqft, 4)),
        dtfRollWidth: Math.max(1, numberValue(body.dtfRollWidth, 22)),
        dtfGap: Math.max(0, numberValue(body.dtfGap, 0.25)),
        gangSheets: normalizeGangSheets(body.gangSheets),
        defaultPrintLocations: normalizePrintLocations(
          body.defaultPrintLocations,
        ),
        laborPerLocation: Math.max(0, numberValue(body.laborPerLocation, 2)),
        setupFeePerLocation: Math.max(0, numberValue(body.setupFeePerLocation)),
        minimumSetupFee: Math.max(0, numberValue(body.minimumSetupFee)),

        supplierShippingFlat: Math.max(
          0,
          numberValue(body.supplierShippingFlat),
        ),
        dtfShippingFlat: Math.max(0, numberValue(body.dtfShippingFlat)),
        shippingPercent: Math.max(0, numberValue(body.shippingPercent)),

        wastePercent: Math.max(0, numberValue(body.wastePercent, 5)),

        pricingMode,
        defaultProfitMargin: Math.max(
          0,
          numberValue(body.defaultProfitMargin, 50),
        ),
        quantityMargins: normalizeQuantityMargins(body.quantityMargins),

        minimumUnitPrice: Math.max(0, numberValue(body.minimumUnitPrice)),
        minimumOrderPrice: Math.max(0, numberValue(body.minimumOrderPrice)),

        active: body.active !== false,
      },
    });

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("PUT apparel pricing settings error:", error);

    return NextResponse.json(
      { error: "Unable to save apparel pricing settings." },
      { status: 500 },
    );
  }
}
