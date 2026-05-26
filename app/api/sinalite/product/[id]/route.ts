import { NextResponse } from "next/server";
import { getSinaliteToken } from "@/lib/sinalite";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const token = await getSinaliteToken();

  const res = await fetch(
    `https://api.sinaliteuppy.com/product/${params.id}/1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await res.json();

  console.log("🔥 FULL PRODUCT:", JSON.stringify(data, null, 2));

  return NextResponse.json(data);
}
