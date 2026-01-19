import prisma from "@/lib/db";

export async function GET(req, { params }) {
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: params.token },
    include: {
      client: true,
      invoiceItems: true,
      payments: true,
      appliedDiscounts: true, // 👈 IMPORTANTE
    },
  });

  if (!invoice) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // -----------------------------
  // 1️⃣ SUBTOTAL
  // -----------------------------
  const subtotal = invoice.invoiceItems.reduce(
    (sum, item) => sum + Number(item.total ?? item.unitPrice * item.qty),
    0,
  );

  // -----------------------------
  // 2️⃣ DESCUENTO (SOLO UNO)
  // -----------------------------
  const discount = invoice.appliedDiscounts?.[0] || null;

  let discountAmount = 0;

  if (discount) {
    if (discount.type === "percent") {
      discountAmount = subtotal * (discount.value / 100);
    }
    if (discount.type === "fixed") {
      discountAmount = discount.value;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const discountedSubtotal = subtotal - discountAmount;

  // -----------------------------
  // 3️⃣ TAX (CORRECTO)
  // -----------------------------
  const taxRate = Number(invoice.taxRate || 0);
  const tax =
    invoice.taxEnabled && taxRate > 0
      ? discountedSubtotal * (taxRate / 100)
      : 0;

  // -----------------------------
  // 4️⃣ TOTAL
  // -----------------------------
  const total = discountedSubtotal + tax;

  // -----------------------------
  // 5️⃣ PAYMENTS
  // -----------------------------
  const paymentsTotal = invoice.payments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0,
  );

  // -----------------------------
  // 6️⃣ BALANCE
  // -----------------------------
  const balance = Math.max(total - paymentsTotal, 0);

  return Response.json({
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt,
    dueDate: invoice.dueDate,
    status: invoice.paymentStatus,

    client: {
      name: invoice.client.name,
      email: invoice.client.email,
    },

    items: invoice.invoiceItems.map((i) => ({
      name: i.name,
      qty: i.qty,
      unitPrice: i.unitPrice,
      total: i.total ?? i.unitPrice * i.qty,
    })),

    subtotal,
    discount: discount
      ? {
          name: discount.name,
          amount: discountAmount,
        }
      : null,

    tax,
    total,
    paymentsTotal,
    balance,

    publicToken: invoice.publicToken,
  });
}
