// /app/api/invoices/[id]/open-pos/route.js
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
  try {
    const id = Number(params.id);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice || !invoice.posDeepLink) {
      return new Response("Deep link not found", { status: 404 });
    }

    // Redirect iPhone to Square POS deeplink
    return Response.redirect(invoice.posDeepLink, 302);
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}
