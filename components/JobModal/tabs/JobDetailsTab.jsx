export default function JobDetailsTab({ job }) {
  const items = job.invoice?.invoiceItems || [];

  return (
    <div className="space-y-6">
      {/* PRODUCTS FROM INVOICE */}
      <div>
        <div className="text-xs text-gray-400 mb-2">Products</div>

        {items.length === 0 ? (
          <div className="text-sm text-gray-500 italic">
            No products in invoice
          </div>
        ) : (
          <div className="border rounded-lg divide-y bg-white">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <div className="font-medium text-gray-900">{item.name}</div>

                <div className="text-gray-600">Qty: {item.qty}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
