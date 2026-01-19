"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublicInvoicePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow p-8">
        {/* HEADER */}
        <div className="flex justify-between mb-6">
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

          <div>
            <h1 className="text-2xl font-bold">
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
        <div className="mt-6 flex justify-end">
          <div className="w-64 text-sm space-y-2">
            {data.tax > 0 && (
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${data.tax.toFixed(2)}</span>
              </div>
            )}

            {data.discount && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount ({data.discount.name})</span>
                <span>- ${data.discount.amount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Tax</span>
              <span>${data.tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>${data.total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-red-600 font-semibold">
              <span>Balance Due</span>
              <span>${data.balance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* PAY BUTTON */}
        {data.balance > 0 && (
          <a
            href={`/pay/${data.publicToken}`}
            className="mt-8 block bg-black text-white text-center py-3 rounded-lg text-lg"
          >
            Pay with Card
          </a>
        )}
      </div>
    </div>
  );
}
