import { auth } from "@/lib/auth";
export const dynamic = "force-dynamic";

import prisma from "@/lib/db";

// ----------------------------------------
// GET — LIST ALL INVOICES
// ----------------------------------------
export async function GET() {
  try {
    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
    );

    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const invoices = await prisma.invoice.findMany({
      where: {
        paymentStatus: {
          not: "VOID",
        },
      },
      orderBy: { issuedAt: "desc" },
      include: {
        client: true,
        payments: true,
        invoiceItems: true,
      },
    });

    const result = invoices.map((inv) => {
      // 1️⃣ SUBTOTAL
      const subtotal = inv.invoiceItems.reduce(
        (sum, item) =>
          sum + Number(item.total ?? item.unitPrice * item.qty ?? 0),
        0,
      );

      // 2️⃣ TAX (USA LA MISMA BANDERA QUE EL EDITOR)
      const taxRate = Number(inv.taxRate || 0);

      const tax =
        inv.taxEnabled && taxRate > 0 ? subtotal * (taxRate / 100) : 0;

      // 3️⃣ TOTAL
      const invoiceTotal = subtotal + tax;

      // 4️⃣ PAYMENTS
      const paymentsTotal = inv.payments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0,
      );

      return {
        ...inv,
        subtotal,
        tax,
        invoiceTotal,
        paymentsTotal,
        balance: invoiceTotal - paymentsTotal,
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
    const session = await auth();

    if (!session || !["admin", "sales"].includes(role)) {
      return NextResponse.json(
        { error: "You do not have permission to create invoices" },
        { status: 403 },
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
    } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "Client is required" },
        { status: 400 },
      );
    }

    // 🔢 Invoice Number
    const counter = await prisma.counter.upsert({
      where: { name: "invoice" },
      update: { value: { increment: 1 } },
      create: { name: "invoice", value: 99 },
    });

    // 🔐 GENERAR TOKEN AQUÍ (CORRECTO)
    const publicToken = crypto.randomBytes(8).toString("hex");

    // ✅ Crear invoice
    const invoice = await prisma.invoice.create({
      data: {
        clientId,
        invoiceNumber: counter.value,
        issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal,
        tax,
        total,
        applyTax: true,
        paymentStatus: "Unpaid",
        notes,

        // 👇 AQUÍ ES DONDE VA
        publicToken,
      },
      include: {
        client: true,
        invoiceItems: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("❌ Error creating invoice:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 },
    );
  }
}
