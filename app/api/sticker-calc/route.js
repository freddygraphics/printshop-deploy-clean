import { NextResponse } from "next/server";
import { calculateStickerPrice } from "@/lib/stickers/calculateStickerPrice";

export async function POST(req) {
  const body = await req.json();

  const result = calculateStickerPrice(body);

  return NextResponse.json(result);
}
