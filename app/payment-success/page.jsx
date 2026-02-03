"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const invoice = searchParams.get("invoice");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
        <CheckCircle className="mx-auto h-14 w-14 text-green-500" />

        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          Payment Successful
        </h1>

        <p className="mt-2 text-gray-600">Thank you for your payment.</p>

        {invoice && (
          <p className="mt-3 text-sm text-gray-500">Invoice #{invoice}</p>
        )}

        <p className="mt-6 text-xs text-gray-400">Freddy Graphics LLC</p>
      </div>
    </div>
  );
}
