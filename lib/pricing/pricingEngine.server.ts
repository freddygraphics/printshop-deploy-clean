import prisma from "@/lib/db";

/* helpers */
function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calcSqft(widthIn: number, heightIn: number) {
  return (Number(widthIn) * Number(heightIn)) / 144;
}

export async function priceFromPrintProfileSqft(args: {
  printProductionProfileId: string;
  widthIn: number;
  heightIn: number;
  quantity?: number;
}) {
  const unitQty = Math.max(1, Number(args.quantity ?? 1));

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

  const unitSqft = calcSqft(args.widthIn, args.heightIn);

  const materialAmount = unitSqft * profile.material.sellPerSqft;
  const processAmount = unitSqft * profile.process.sellPerSqft;

  let unitPrice = materialAmount + processAmount + (profile.setupCost ?? 0);

  if (profile.wastePercent && profile.wastePercent > 0) {
    unitPrice = unitPrice * (1 + profile.wastePercent / 100);
  }

  unitPrice = round2(unitPrice);
  const subtotal = round2(unitPrice * unitQty);

  return {
    mode: "sqft" as const,
    unitQty,
    unitSqft: round2(unitSqft),
    unitPrice,
    subtotal,
    lines: [
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
    ],
  };
}
