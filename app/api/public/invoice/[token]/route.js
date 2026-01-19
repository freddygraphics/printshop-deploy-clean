import prisma from "@/lib/db";

export async function GET(req, { params }) {
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: params.token },
    include: {
      client: true,
      invoiceItems: true,
      payments: true,
      appliedDiscounts: true,
    },
  });

  if (!invoice) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const discount = invoice.appliedDiscounts?.[0] || null;

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
      total: i.total,
    })),

    // 🔐 VALORES OFICIALES (YA CALCULADOS)
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    balance: invoice.balance,

    discount: discount
      ? {
          name: discount.name,
          amount: discount.amount,
        }
      : null,

    publicToken: invoice.publicToken,
  });
}
