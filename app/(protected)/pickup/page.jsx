"use client";

import { useState } from "react";

export default function PickupScanPage() {
  const [code, setCode] = useState("");
  const [invoice, setInvoice] = useState(null);

  async function handleScan(value) {
    if (!value.startsWith("INV-")) return;

    const invoiceNumber = value.replace("INV-", "");

    const res = await fetch(`/api/invoices/by-number/${invoiceNumber}`);
    const data = await res.json();

    setInvoice(data);
    setCode("");
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">Pickup Scanner</h1>

      <input
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleScan(code);
        }}
        className="border px-4 py-2 rounded-xl w-96"
        placeholder="Scan invoice barcode..."
      />

      {invoice && (
        <div className="mt-8 p-6 border rounded-xl bg-white shadow">
          <div className="text-lg font-semibold">
            Invoice #{invoice.invoiceNumber}
          </div>

          <div className="mt-2">Customer: {invoice.client?.name}</div>

          <div className="mt-4 text-xl font-bold">
            {invoice.balance > 0 ? "⚠️ Balance Due" : "✅ Paid in Full"}
          </div>
        </div>
      )}
    </div>
  );
}
