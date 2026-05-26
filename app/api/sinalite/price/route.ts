import { NextResponse } from "next/server";

import { getSinalitePrice } from "@/lib/sinalite";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("🔥 PRICE BODY:", body);

    const data = await getSinalitePrice(body.productId, body.options);

    console.log("🔥 SINALITE RESPONSE:", data);

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("❌ API PRICE ERROR:", err);

    return NextResponse.json(
      {
        error: err.message || "Sinalite Error",
      },
      { status: 500 },
    );
  }
}
