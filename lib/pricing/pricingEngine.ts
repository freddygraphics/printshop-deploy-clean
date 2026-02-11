import prisma from "@/lib/db";

// ===============================
// TYPES
// ===============================
export type PricingMode = "manual" | "sqft";

export type PriceBreakdownLine = {
  label: string;
  qty: number;
  rate: number;
  amount: number;
};

export type PriceBreakdown = {
  mode: PricingMode;
  unitQty: number;
  unitSqft: number;
  unitPrice: number;
  subtotal: number;
  lines: PriceBreakdownLine[];
};

// ===============================
// HELPERS
// ===============================
function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calcSqft(widthIn: number, heightIn: number) {
  return (Number(widthIn) * Number(heightIn)) / 144;
}

// ===============================
// MANUAL PRICING
// ===============================
export function priceManual(args: {
  basePrice: number;
  quantity?: number;
}): PriceBreakdown {
  const unitQty = Math.max(1, Number(args.quantity ?? 1));
  const unitPrice = round2(args.basePrice);
  const subtotal = round2(unitPrice * unitQty);

  return {
    mode: "manual",
    unitQty,
    unitSqft: 0,
    unitPrice,
    subtotal,
    lines: [
      {
        label: "Manual price",
        qty: unitQty,
        rate: unitPrice,
        amount: subtotal,
      },
    ],
  };
}

// ===============================
// SQFT PRICING (🔥 ESTA FALTABA BIEN ARMADA)
// ===============================
export async function priceFromPrintProfileSqft(args: {
  printProductionProfileId: string;
  widthIn: number;
  heightIn: number;
  quantity: number;
}): Promise<PriceBreakdown> {
  const { printProductionProfileId, widthIn, heightIn, quantity } = args;

  const profile = await prisma.printProductionProfile.findUnique({
    where: { id: printProductionProfileId },
    include: {
      material: true,
      process: true,
      lamination: true,
    },
  });

  if (!profile) {
    throw new Error("PrintProductionProfile not found");
  }

  const unitQty = Math.max(1, Number(quantity ?? 1));
  const unitSqft = calcSqft(widthIn, heightIn);

  const materialSell = profile.material.sellPerSqft;
  const processSell = profile.process.sellPerSqft;
  const laminationSell = profile.lamination?.sellPrice ?? 0;

  const baseRate = materialSell + processSell;

  const unitPrice = round2(unitSqft * baseRate + laminationSell);
  const subtotal = round2(unitPrice * unitQty);

  return {
    mode: "sqft",
    unitQty,
    unitSqft,
    unitPrice,
    subtotal,
    lines: [
      {
        label: profile.material.name,
        qty: unitQty,
        rate: materialSell,
        amount: round2(unitSqft * materialSell * unitQty),
      },
      {
        label: profile.process.name,
        qty: unitQty,
        rate: processSell,
        amount: round2(unitSqft * processSell * unitQty),
      },
      ...(laminationSell > 0
        ? [
            {
              label: profile.lamination?.name || "Lamination",
              qty: unitQty,
              rate: laminationSell,
              amount: round2(laminationSell * unitQty),
            },
          ]
        : []),
    ],
  };
}
