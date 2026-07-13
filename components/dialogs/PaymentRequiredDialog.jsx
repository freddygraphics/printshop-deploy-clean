"use client";

import Dialog from "./Dialog";
import { AlertTriangle, DollarSign } from "lucide-react";
import Link from "next/link";

export default function PaymentRequiredDialog({
  open,
  onClose,
  invoiceId,
  invoiceNumber,
  balance,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Payment Required"
      maxWidth="max-w-lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Close
          </button>

          <Link
            href={`/invoices/${invoiceId}`}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Collect Payment
          </Link>
        </>
      }
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Outstanding Balance
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            This job cannot be released because the invoice still has an unpaid
            balance.
          </p>

          {/* Invoice */}
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Invoice
                </div>

                <div className="mt-1 text-lg font-semibold text-gray-900">
                  #{invoiceNumber}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Balance Due
                </div>

                <div className="mt-1 flex items-center justify-end gap-1 text-2xl font-bold text-red-600">
                  <DollarSign className="h-5 w-5" />
                  {Number(balance).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              Payment must be completed before this order can be marked as
              <strong> Picked Up</strong>.
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
