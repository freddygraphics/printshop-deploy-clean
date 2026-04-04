export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import prisma from "@/lib/db";
import PayWithCardButton from "@/components/payments/PayWithCardButton";
import InvoicePDFButton from "@/components/InvoicePDFButton";

export default async function InvoicePublicPage({ params }) {
  const invoiceId = Number(params.id);

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: { select: { name: true } },
      payments: { select: { amount: true } },
      invoiceItems: { select: { total: true } },
    },
  });

  if (!invoice) {
    return <div className="p-10 text-center">Invoice not found</div>;
  }

  // ✅ 1. TOTAL REAL (desde items)
  const realTotal = invoice.invoiceItems.reduce(
    (sum, i) => sum + Number(i.total || 0),
    0,
  );

  // 🔐 Invoice no emitida
  if (realTotal <= 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-xl shadow p-6 text-center">
          <h1 className="text-xl font-bold mb-3">
            Invoice #{invoice.invoiceNumber}
          </h1>
          <div className="text-yellow-600 font-semibold">
            Invoice not issued yet
          </div>
        </div>
      </div>
    );
  }

  // ✅ 2. PAGOS REALES
  const totalPaid = invoice.payments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0,
  );

  // ✅ 3. BALANCE REAL
  const balance = Math.max(realTotal - totalPaid, 0);

  // 🔐 BLINDAJE ANTI-ERROR
  if (balance <= 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-xl shadow p-6 text-center">
          <h1 className="text-xl font-bold mb-3">
            Invoice #{invoice.invoiceNumber}
          </h1>
          <div className="text-green-600 font-semibold">Paid in full</div>
        </div>
      </div>
    );
  }

  // ✅ 4. PAGO
  return (
    <div
      id="invoice-root"
      className="min-h-screen bg-gray-100 flex items-center justify-center p-4"
    >
      <div className="bg-white max-w-md w-full rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-1">
          Invoice #{invoice.invoiceNumber}
        </h1>

        <div className="text-gray-600 mb-4">{invoice.client?.name}</div>

        <div className="text-xl font-semibold mb-6">
          Balance Due: ${balance.toFixed(2)}
        </div>

        <PayWithCardButton invoiceId={invoice.id} amount={balance} />

        {/* 🔥 BOTÓN PDF */}
        <InvoicePDFButton />
      </div>
    </div>
  );
}
