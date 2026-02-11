import { NextResponse } from "next/server";
import { priceFromPrintProfileSqft } from "@/lib/pricing/pricingEngine.server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await priceFromPrintProfileSqft(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Pricing API error:", error);
    return NextResponse.json({ error: "Pricing failed" }, { status: 500 });
  }
}
