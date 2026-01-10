import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateInvoiceToken } from "@/lib/qrToken";

const prisma = new PrismaClient();

// ----------------------------------------
// GET — LIST ALL INVOICES
// ----------------------------------------
export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        paymentStatus: {
          not: "VOID",
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        payments: true,
      },
    });

    const result = invoices.map((inv) => {
      const paymentsTotal = inv.payments.reduce((sum, p) => sum + p.amount, 0);

      return {
        ...inv,
        paymentsTotal,
        balance: inv.total - paymentsTotal,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Error loading invoices:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ----------------------------------------
// POST — CREATE NEW INVOICE + QR TOKEN
// ----------------------------------------
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["admin", "sales"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "You do not have permission to create invoices" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      clientId,
      issuedAt,
      dueDate,
      subtotal = 0,
      tax = 0,
      total = 0,
      notes = "",
      items = [],
    } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "Client is required" },
        { status: 400 }
      );
    }

    // 🔢 Invoice Number (desde 100)
    const counter = await prisma.counter.upsert({
      where: { name: "invoice" },
      update: { value: { increment: 1 } },
      create: { name: "invoice", value: 99 },
    });

    // 1️⃣ Crear invoice
    const invoice = await prisma.invoice.create({
      data: {
        clientId,
        invoiceNumber: counter.value,
        issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal,
        tax,
        total,
        paymentStatus: "Unpaid",
        notes,
        invoiceItems: {
          create: [],
        },
      },
      include: {
        client: true,
        invoiceItems: true,
      },
    });

    // 2️⃣ Generar QR Token cifrado
    const qrToken = generateInvoiceToken(invoice.id);

    // 3️⃣ Guardar QR Token
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        qrToken, // ✅ solo esto
      },
      include: {
        client: true,
        invoiceItems: true,
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("❌ Error creating invoice:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
