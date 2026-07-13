import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    // Solo permitir llamadas desde Vercel Cron
    if (process.env.VERCEL) {
      const isCron = req.headers.get("x-vercel-cron");

      if (!isCron) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await prisma.job.updateMany({
      where: {
        status: "Delivered",
        archived: false,

        // Solo archivar trabajos ya recogidos
        pickedUpAt: {
          not: null,
          lt: sevenDaysAgo,
        },

        // Seguridad extra
        invoice: {
          status: {
            not: "VOID",
          },
        },
      },

      data: {
        archived: true,
        archivedAt: new Date(),
      },
    });

    console.log(`✅ Archived ${result.count} jobs`);

    return NextResponse.json({
      success: true,
      archived: result.count,
    });
  } catch (err) {
    console.error("❌ Archive Jobs Error:", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 },
    );
  }
}
