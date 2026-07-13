"use client";

import Dialog from "./Dialog";
import { PackageCheck } from "lucide-react";

export default function ConfirmPickupDialog({
  open,
  onClose,
  onConfirm,
  invoiceNumber,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Complete Pickup"
      maxWidth="max-w-lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Complete Pickup
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <PackageCheck className="h-7 w-7 text-green-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Ready to release this order?
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            This will mark the job as <strong>Picked Up</strong> and change its
            status to <strong>Delivered</strong>.
          </p>

          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Invoice
            </div>

            <div className="mt-1 text-lg font-semibold text-gray-900">
              #{invoiceNumber}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
