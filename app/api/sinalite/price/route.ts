import { NextResponse } from "next/server";
import { getSinalitePrice } from "@/lib/sinalite";

export async function POST(req: Request) {
  const { productId, options } = await req.json();

  const data = await getSinalitePrice(productId, options);

  return NextResponse.json(data);
}
