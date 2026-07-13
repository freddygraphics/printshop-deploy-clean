import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") || "";

  if (!q) {
    return NextResponse.json([]);
  }

  const jobs = await prisma.job.findMany({
    where: {
      OR: [
        // Job Number
        !isNaN(Number(q))
          ? {
              jobNumber: Number(q),
            }
          : {},

        // Invoice Number
        !isNaN(Number(q))
          ? {
              invoice: {
                invoiceNumber: Number(q),
              },
            }
          : {},

        // Customer Name
        {
          client: {
            name: {
              contains: q,
              mode: "insensitive",
            },
          },
        },

        // Business Name
        {
          client: {
            company: {
              contains: q,
              mode: "insensitive",
            },
          },
        },
      ],
    },

    include: {
      client: true,
      invoice: true,
      files: true,
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 50,
  });

  return NextResponse.json(jobs);
}
