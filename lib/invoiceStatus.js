export function getInvoiceStatus(invoice) {
  const total = Number(invoice.invoiceTotal ?? 0);
  const balance = Number(invoice.balance ?? 0);
  const paid = Number(invoice.paymentsTotal ?? 0);

  // 1️⃣ Void (siempre primero)
  if (invoice.status === "VOID") {
    return "Void";
  }

  // 2️⃣ Draft (nunca enviada y sin monto)
  if (total === 0 && paid === 0) {
    return "Draft";
  }

  // 3️⃣ Paid (balance en 0)
  if (total > 0 && balance === 0) {
    return "Paid";
  }

  // 4️⃣ Partially Paid
  if (paid > 0 && balance > 0) {
    return "Partially Paid";
  }

  // 5️⃣ Overdue (⚠️ SOLO si debe dinero)
  if (invoice.dueDate && balance > 0) {
    const today = new Date();
    const due = new Date(invoice.dueDate);
    if (today > due) {
      return "Overdue";
    }
  }

  // 6️⃣ Issued / Sent
  return "Issued";
}
