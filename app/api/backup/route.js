export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const data = {
      clients: await prisma.client.findMany(),
      invoices: await prisma.invoice.findMany(),
      jobs: await prisma.job.findMany(),
      products: await prisma.product.findMany(),
    };

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="backup.json"',
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
