"use client";
export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublicInvoicePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/public/invoice/${token}`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({ error: true }));
  }, [token]);

  if (!data) {
    return <div className="p-10 text-center">Loading…</div>;
  }

  if (data.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Invoice not found.</p>
      </div>
    );
  }
  const intent = data.paymentIntent;
  const isDeposit = intent?.type === "deposit";

  const amountToday = intent ? intent.totalCharged : data.balance;

  const labelToday = intent
    ? isDeposit
      ? "50% Deposit Due Today"
      : "Amount Due Today"
    : "Balance Due";

  // 👇 resto igual (NO necesitas cambiar nada más)

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow p-8">
        {/* HEADER */}

        {data.balance === 0 && (
          <div className="mb-4 text-green-700 font-semibold">
            ✓ Paid in full
          </div>
        )}

        {data.balance > 0 && data.paymentsTotal > 0 && (
          <div className="mb-4 text-yellow-700 font-semibold">
            Partial payment received
          </div>
        )}

        <div className="space-y-0">
          <h1 className="text-4xl font-bold leading-tight m-0">
            Freddy Graphics has
          </h1>
          <h1 className="text-4xl font-bold leading-tight m-0">requested a</h1>
          <h1 className="text-4xl font-bold leading-tight">
            payment of $
            {intent ? intent.totalCharged.toFixed(2) : data.total.toFixed(2)}
          </h1>
        </div>

        <div>
          <h1 className="text-2xl font-semibold mt-6">
            Invoice #{data.invoiceNumber}
          </h1>
          <p className="text-sm text-gray-600">{data.client.name}</p>
        </div>

        <div className="text-right text-sm">
          <div>Issued: {new Date(data.issuedAt).toLocaleDateString()}</div>
          {data.dueDate && (
            <div>Due: {new Date(data.dueDate).toLocaleDateString()}</div>
          )}
        </div>

        {/* ITEMS */}
        <table className="w-full text-sm border-t">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} className="border-t">
                <td className="py-2">{item.name}</td>
                <td>{item.qty}</td>
                <td>${item.unitPrice.toFixed(2)}</td>
                <td className="text-right">${item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS */}

        {/* TAX — DEBE IR AQUÍ */}
        <div className="flex justify-between mt-4 text-sm">
          <span>Tax</span>
          <span>${data.tax.toFixed(2)}</span>
        </div>

        {/* DEPOSIT BADGE */}
        {intent?.type === "deposit" && (
          <div className="bg-[#EFF6FF] text-black px-4 py-2 rounded-lg my-3 font-semibold">
            50% Deposit Payment
          </div>
        )}

        {/* DEPOSIT DETAILS */}
        {intent && (
          <>
            <div className="flex justify-between">
              <span>Total</span>
              <span>${intent.amount.toFixed(2)}</span>
            </div>

            {intent.processingFee > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing Fee</span>
                <span>${intent.processingFee.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Amount to Pay Today</span>
              <span>${intent.totalCharged.toFixed(2)}</span>
            </div>
          </>
        )}

        {/* PAY BUTTON */}
        {intent && (
          <button
            onClick={async () => {
              const res = await fetch("/api/payments/square/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: data.publicToken }),
              });

              const json = await res.json();

              if (!res.ok || !json.url) {
                alert("Unable to start payment");
                return;
              }

              // 🔥 REDIRECT REAL A SQUARE
              window.location.href = json.url;
            }}
            className="mt-6 block w-full bg-black text-white text-center py-3 rounded-lg text-lg"
          >
            Pay ${amountToday.toFixed(2)} with Card
          </button>
        )}
      </div>
    </div>
  );
}
