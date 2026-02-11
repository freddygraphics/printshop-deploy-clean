export const dynamic = "force-dynamic";
import prisma from "@/lib/db";

export async function GET(req, { params }) {
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: params.token },
    include: {
      client: true,
      invoiceItems: true,
      appliedDiscounts: true,
      paymentIntents: {
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!invoice) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const intent = invoice.paymentIntents[0] || null;
  const discount = invoice.appliedDiscounts?.[0] || null;

  return Response.json({
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt,
    dueDate: invoice.dueDate,

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

    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    balance: invoice.balance,

    discount: discount
      ? { name: discount.name, amount: discount.amount }
      : null,

    // ðŸ”‘ PAYMENT INTENT (LA VERDAD)
    paymentIntent: intent
      ? {
          id: intent.id, // ðŸ”‘ CLAVE
          type: intent.type,
          amount: intent.amount,
          processingFee: intent.processingFee,
          totalCharged: intent.totalCharged,
          method: intent.method,
        }
      : null,

    publicToken: invoice.publicToken,
  });
}

