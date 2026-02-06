// /app/api/clients/[id]/route.ts
"use client";

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import prisma from "../../../../lib/db";

// 📌 GET — Cliente + quotes + orders + invoices (con pagos validados) + notes
export async function GET(req, { params }) {
  const id = parseInt(params.id);

  try {
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 },
      );
    }

    const quotes = await prisma.quote.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
    });

    const orders = await prisma.order.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
    });

    // 🔥 INVOICES CON PAGOS (CLAVE)
    const rawInvoices = await prisma.invoice.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
      include: {
        payments: true, // 👈 ESTO ES LO QUE FALTABA
      },
    });

    // 🔥 NORMALIZACIÓN CONTABLE (PRO)
    const invoices = rawInvoices.map((inv) => {
      const total = Number(inv.total || 0);

      const paid = inv.payments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0,
      );

      const balance = Number((total - paid).toFixed(2));

      let status = "Issued";
      if (total === 0) status = "Draft";
      else if (paid === 0) status = "Issued";
      else if (paid > 0 && balance > 0) status = "Partially Paid";
      else if (balance <= 0) status = "Paid";

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        total,
        paid,
        balance,
        status,
        createdAt: inv.createdAt,
      };
    });

    const notes = await prisma.note.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      client,
      quotes,
      orders,
      invoices, // ✅ YA NORMALIZADAS
      notes,
    });
  } catch (error) {
    console.error("❌ Error en GET /clients/[id]:", error);
    return NextResponse.json(
      { error: "Error interno al obtener cliente" },
      { status: 500 },
    );
  }
}
