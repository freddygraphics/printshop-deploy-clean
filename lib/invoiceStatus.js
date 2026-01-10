// /lib/invoiceStatus.js
export function getInvoiceStatus(invoice) {
  const total = Number(invoice.total ?? 0);
  const balance = Number(invoice.balance ?? 0);
  const paymentsCount = invoice.payments?.length ?? 0;

  // 1️⃣ Void (SIEMPRE PRIMERO)
  if (invoice.status === "VOID") {
    return "Void";
  }

  // 2️⃣ Draft
  if (total === 0 && paymentsCount === 0) {
    return "Draft";
  }

  // 3️⃣ Paid
  if (total > 0 && balance === 0 && paymentsCount > 0) {
    return "Paid";
  }

  // 4️⃣ Partially Paid
  if (paymentsCount > 0 && balance > 0) {
    return "Partially Paid";
  }

  // 5️⃣ Overdue
  if (invoice.dueDate) {
    const today = new Date();
    const due = new Date(invoice.dueDate);
    if (today > due) {
      return "Overdue";
    }
  }

  // 6️⃣ Default
  return "Sent";
}
