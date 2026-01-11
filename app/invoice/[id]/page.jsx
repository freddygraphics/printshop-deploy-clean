import { notFound } from "next/navigation";
import prisma from "@/lib/db";

export default async function PublicInvoicePage({ params }) {
  const invoiceId = Number(params.id);

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true,
      payments: true,
      customer: true,
    },
  });

  if (!invoice) return notFound();

  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const balance = invoice.total - paid;

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow p-6 space-y-6">
        <h1 className="text-2xl font-bold">Invoice #{invoice.id}</h1>

        <p className="text-gray-500">{invoice.customer?.name}</p>

        <div className="space-y-3">
          {invoice.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>{item.name}</span>
              <span>${item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Total</span>
            <span>${invoice.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Paid</span>
            <span>${paid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Balance Due</span>
            <span>${balance.toFixed(2)}</span>
          </div>
        </div>

        {balance > 0 && (
          <button className="w-full bg-black text-white py-3 rounded-xl">
            Pay ${balance.toFixed(2)}
          </button>
        )}
      </div>
    </div>
  );
}
