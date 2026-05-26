export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getSinaliteToken } from "@/lib/sinalite";

export async function GET() {
  const token = await getSinaliteToken();

  const res = await fetch("https://api.sinaliteuppy.com/product", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  return NextResponse.json(data);
}
