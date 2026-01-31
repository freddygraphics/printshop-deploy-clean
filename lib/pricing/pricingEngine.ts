// src/lib/pricing/pricingEngine.ts
import prisma from "@/lib/db";

/* ======================================================
   TIPOS
====================================================== */

export type PricingMode = "manual" | "sqft";

export type PriceBreakdownLine = {
  label: string;
  qty: number; // sqft por unidad
  rate: number; // $/sqft
  amount: number;
};

export type PriceBreakdown = {
  mode: PricingMode;

  unitQty: number; // cantidad de items
  unitSqft: number; // sqft por unidad

  unitPrice: number; // precio por UNA unidad
  subtotal: number; // unitPrice × unitQty

  lines: PriceBreakdownLine[];
};

/* ======================================================
   HELPERS
====================================================== */

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calcSqft(widthIn: number, heightIn: number) {
  return (Number(widthIn) * Number(heightIn)) / 144;
}

/* ======================================================
   ENGINE — SQFT (USA PrintProductionProfile REAL)
====================================================== */

export async function priceFromPrintProfileSqft(args: {
  printProductionProfileId: string;
  widthIn: number;
  heightIn: number;
  quantity?: number;
}) {
  const unitQty = Math.max(1, Number(args.quantity ?? 1));

  // 🔑 CARGA PERFIL REAL (EL DE TU SCHEMA)
  const profile = await prisma.printProductionProfile.findUnique({
    where: { id: args.printProductionProfileId },
    include: {
      material: true,
      process: true,
    },
  });

  if (!profile) {
    throw new Error("PrintProductionProfile no encontrado");
  }

  // 📐 SQFT POR UNIDAD
  const unitSqft = calcSqft(args.widthIn, args.heightIn);

  // 🧱 MATERIAL
  const materialAmount = unitSqft * profile.material.sellPerSqft;

  // ⚙️ PROCESO
  const processAmount = unitSqft * profile.process.sellPerSqft;

  // 🧮 COSTO BASE POR UNIDAD
  let unitPrice = materialAmount + processAmount + (profile.setupCost ?? 0);

  // ♻️ WASTE %
  if (profile.wastePercent && profile.wastePercent > 0) {
    unitPrice = unitPrice * (1 + profile.wastePercent / 100);
  }

  unitPrice = round2(unitPrice);

  const subtotal = round2(unitPrice * unitQty);

  /* ===========================
     BREAKDOWN
  ============================ */

  const lines: PriceBreakdownLine[] = [
    {
      label: `Material: ${profile.material.name}`,
      qty: round2(unitSqft),
      rate: profile.material.sellPerSqft,
      amount: round2(materialAmount),
    },
    {
      label: `Process: ${profile.process.name}`,
      qty: round2(unitSqft),
      rate: profile.process.sellPerSqft,
      amount: round2(processAmount),
    },
  ];

  return {
    mode: "sqft" as const,

    unitQty,
    unitSqft: round2(unitSqft),

    unitPrice,
    subtotal,

    lines,
  };
}

/* ======================================================
   ENGINE — MANUAL
====================================================== */

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
