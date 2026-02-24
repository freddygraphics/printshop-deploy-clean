"use client";

import Barcode from "react-barcode";

export default function PickupBarcode({ job }) {
  if (!job || job.status !== "Ready") return null;
  if (!job.invoice?.invoiceNumber) return null;

  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      <Barcode
        value={`INV-${job.invoice.invoiceNumber}`}
        format="CODE128"
        width={2}
        height={60}
        displayValue={true}
      />
      <div className="text-xs text-gray-500">Scan to verify payment</div>
    </div>
  );
}
