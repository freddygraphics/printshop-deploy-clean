import Link from "next/link";

export default function JobInvoiceTab({ job }) {
  if (!job.invoice) return <div className="text-gray-500">No invoice</div>;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-gray-500">Invoice Number</div>
        <div className="font-medium">#{job.invoice.invoiceNumber}</div>
      </div>

      <Link
        href={`/invoices/${job.invoice.id}`}
        className="inline-block text-sm text-blue-600 hover:underline"
      >
        Open Invoice
      </Link>
    </div>
  );
}
