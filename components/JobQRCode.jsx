"use client";

import { QRCodeCanvas } from "qrcode.react";

export default function JobQRCode({ pickupToken }) {
  const pickupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pickup/${pickupToken}`;

  return (
    <div className="mt-6 rounded-2xl border bg-slate-50 p-4">
      <div className="text-sm font-semibold mb-2">Pickup QR</div>

      <QRCodeCanvas value={pickupUrl} size={130} />

      <div className="text-xs text-slate-500 mt-2">
        Escanea cuando el cliente llegue.
      </div>
    </div>
  );
}
