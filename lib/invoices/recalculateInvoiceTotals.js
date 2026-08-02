import prisma from "@/lib/db";

const roundMoney = (value) => {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
};

export async function recalculateInvoiceTotals(invoiceId) {
  const id = Number(invoiceId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid invoice id");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },

    include: {
      invoiceItems: true,

      payments: true,

      appliedDiscounts: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // --------------------------------------------
  // SUBTOTAL DE LOS ITEMS
  // --------------------------------------------
  const itemsSubtotal = invoice.invoiceItems.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0,
  );

  // --------------------------------------------
  // DESCUENTO
  // Ajusta estos campos según tu modelo real
  // --------------------------------------------
  const discount = invoice.appliedDiscounts?.[0] || null;

  let discountAmount = 0;

  if (discount) {
    const discountType = String(
      discount.type || discount.discountType || "",
    ).toUpperCase();

    const discountValue = Number(discount.value || discount.amount || 0);

    if (discountType === "PERCENTAGE") {
      discountAmount = itemsSubtotal * (discountValue / 100);
    } else {
      discountAmount = discountValue;
    }
  }

  discountAmount = Math.min(Math.max(discountAmount, 0), itemsSubtotal);

  const subtotalAfterDiscount = itemsSubtotal - discountAmount;

  // --------------------------------------------
  // TAX
  // --------------------------------------------
  const taxEnabled = Boolean(invoice.taxEnabled);
  const taxRate = Number(invoice.taxRate || 0);

  const tax = taxEnabled ? subtotalAfterDiscount * (taxRate / 100) : 0;

  // --------------------------------------------
  // TOTAL DEL INVOICE
  // --------------------------------------------
  const total = subtotalAfterDiscount + tax;

  // --------------------------------------------
  // PAGOS
  // --------------------------------------------
  const paymentsTotal = invoice.payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );

  const balance = Math.max(total - paymentsTotal, 0);

  const normalizedSubtotal = roundMoney(subtotalAfterDiscount);

  const normalizedTax = roundMoney(tax);
  const normalizedTotal = roundMoney(total);
  const normalizedPaymentsTotal = roundMoney(paymentsTotal);
  const normalizedBalance = roundMoney(balance);

  // No cambiar el estado VOID
  let paymentStatus = invoice.paymentStatus;

  if (invoice.status !== "VOID") {
    if (normalizedTotal > 0 && normalizedBalance <= 0.01) {
      paymentStatus = "PAID";
    } else if (normalizedPaymentsTotal > 0 && normalizedBalance > 0.01) {
      paymentStatus = "PARTIALLY_PAID";
    } else {
      paymentStatus = "UNPAID";
    }
  }

  return prisma.invoice.update({
    where: { id },

    data: {
      subtotal: normalizedSubtotal,
      tax: normalizedTax,
      total: normalizedTotal,
      balance: normalizedBalance,
      paymentStatus,
    },

    include: {
      client: true,
      invoiceItems: true,
      payments: true,
      appliedDiscounts: true,
    },
  });
}
