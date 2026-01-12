"use client";

import { useEffect, useState } from "react";
import { getInvoiceStatus } from "@/lib/invoiceStatus";
import RecordPaymentModal from "@/components/RecordPaymentModal";

export default function InvoicePickupPage({ params }) {
  const invoiceId = params.id;

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}`)
      .then((res) => res.json())
      .then((data) => {
        setInvoice(data);
        setLoading(false);
      });
  }, [invoiceId]);

  if (loading) {
    return <div className="p-10 text-center">Loading…</div>;
  }

  if (!invoice) {
    return (
      <div className="p-10 text-center text-red-600">Invoice not found</div>
    );
  }

  const status = getInvoiceStatus(invoice);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 space-y-6">
        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Invoice #{invoice.invoiceNumber}
          </h1>
          <p className="text-gray-500">{invoice.client?.name}</p>
        </div>

        {/* STATUS */}
        <div className="flex justify-center">
          <span
            className={`px-4 py-1 rounded-full text-sm font-semibold
              ${status === "Paid" && "bg-green-100 text-green-700"}
              ${status === "Partially Paid" && "bg-yellow-100 text-yellow-700"}
              ${status === "Sent" && "bg-blue-100 text-blue-700"}
              ${status === "Overdue" && "bg-red-100 text-red-700"}
            `}
          >
            {status}
          </span>
        </div>

        {/* TOTALS */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold">
              ${Number(invoice.total ?? 0).toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Balance</p>
            <p className="text-xl font-bold text-red-600">
              ${Number(invoice.balance ?? 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* ITEMS */}
        <div>
          <h3 className="font-semibold mb-2">Items</h3>
          <ul className="text-sm divide-y">
            {(invoice.invoiceItems ?? []).map((item) => (
              <li key={item.id} className="py-2 flex justify-between">
                <span>{item.name}</span>
                <span>${item.total.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ACTIONS */}
        <div className="space-y-3">
          {/* 1️⃣ PAGADO PERO NO PICKED UP → MOSTRAR BOTÓN */}
          {invoice.balance === 0 && !invoice.pickedUpAt && (
            <>
              <div className="text-center text-green-700 font-semibold">
                ✔ Invoice Fully Paid — Ready for Pickup
              </div>

              <button
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `/api/invoices/${invoice.id}/pickup`,
                      {
                        method: "POST",
                      }
                    );

                    const data = await res.json();
                    console.log("PICKUP RESPONSE:", data);

                    if (!res.ok) {
                      alert(
                        "Pickup failed: " + (data.error || "Unknown error")
                      );
                      return;
                    }

                    const updated = await fetch(
                      `/api/invoices/${invoice.id}`
                    ).then((r) => r.json());
                    setInvoice(updated);
                  } catch (err) {
                    console.error("PICKUP FETCH ERROR:", err);
                    alert("Pickup request crashed");
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
              >
                Mark as Picked Up
              </button>
            </>
          )}

          {/* 2️⃣ YA PICKED UP → MENSAJE FINAL */}
          {invoice.pickedUpAt && (
            <div className="text-center text-blue-700 font-semibold">
              📦 Picked Up on {new Date(invoice.pickedUpAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showPaymentModal && (
        <RecordPaymentModal
          invoice={invoice}
          onClose={() => setShowPaymentModal(false)}
          onSave={async (paymentData) => {
            // paymentData viene del modal:
            // { paymentMethod, amountPaid, paidOn, note }

            await fetch(`/api/invoices/${invoiceId}/payments`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount: paymentData.amountPaid,
                method: paymentData.paymentMethod,
                note: paymentData.note,
              }),
            });

            setShowPaymentModal(false);

            // 🔄 refrescar invoice con balance actualizado
            const updated = await fetch(`/api/invoices/${invoiceId}`).then(
              (r) => r.json()
            );
            setInvoice(updated);
          }}
        />
      )}
    </div>
  );
}
