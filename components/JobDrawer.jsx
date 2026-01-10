import Link from "next/link";
import { X } from "lucide-react";

export default function JobDrawer({ job, onClose }) {
  if (!job) return null;

  return (
    <>
      {/* OVERLAY */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* DRAWER */}
      <div className="fixed top-0 right-0 h-full w-[420px] bg-white z-50 shadow-xl flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <div className="text-xs text-gray-500">JOB #{job.jobNumber}</div>
            <div className="text-lg font-semibold text-gray-900">
              {job.client?.name || "No client"}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* INVOICE */}
          <div className="rounded-xl border p-3">
            <div className="text-xs text-gray-500 mb-1">Invoice</div>
            {job.invoice ? (
              <Link
                href={`/invoices/${job.invoice.id}`}
                className="font-semibold text-blue-700 hover:underline"
              >
                Invoice #{job.invoice.invoiceNumber}
              </Link>
            ) : (
              <span className="text-sm text-gray-400">—</span>
            )}
          </div>

          {/* STATUS */}
          <div className="rounded-xl border p-3">
            <div className="text-xs text-gray-500 mb-1">Status</div>
            <div className="text-sm font-medium text-gray-900">
              {job.status}
            </div>
          </div>

          {/* ITEMS */}
          <div className="rounded-xl border p-3">
            <div className="text-xs text-gray-500 mb-2">Items</div>
            <ul className="space-y-1 text-sm">
              {job.invoice?.invoiceItems?.map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span>{i.name}</span>
                  <span className="text-gray-500">x{i.qty}</span>
                </li>
              )) || <span className="text-gray-400">No items</span>}
            </ul>
          </div>

          {/* SPECS */}
          {job.specs && (
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500 mb-1">Specs</div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {job.specs}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="border-t px-5 py-4 flex gap-2">
          <Link
            href={`/invoices/${job.invoice?.id}`}
            className="flex-1 text-center px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800"
          >
            Open Invoice
          </Link>

          <button className="px-4 py-2 rounded-xl border hover:bg-gray-50">
            Mark Ready
          </button>
        </div>
      </div>
    </>
  );
}
