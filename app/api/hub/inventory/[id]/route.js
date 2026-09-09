import { NextResponse } from "next/server";
import { getHubInventory } from "@/lib/onesource";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req, ctx) {
  try {
    const { id } = await ctx.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const inventory = await getHubInventory(id);

    return NextResponse.json({
      success: true,
      productId: id,
      inventory,
    });
  } catch (error) {
    console.error("Hub inventory error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Hub inventory",
      },
      {
        status: 500,
      },
    );
  }
}
