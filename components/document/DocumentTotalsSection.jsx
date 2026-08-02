"use client";

export default function DocumentTotalsSection({
  showTaxControl = true,
  documentId,

  customerNotes,
  setCustomerNotes,

  payments,
  hasPayments,

  subtotal,
  discountLines,
  appliedDiscount,
  removeDiscount,

  taxEnabled,
  handleTaxChange,

  tax,
  total,
  totalProcessingFee,
  totalCharged,
  balance,
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
      {/* CUSTOMER NOTES */}
      <div>
        <label className="text-sm font-semibold">Customer Notes</label>

        <textarea
          className="mt-1 border rounded-lg px-4 py-2.5 w-full min-h-[80px]"
          placeholder="Notes visible on the PDF…"
          value={customerNotes}
          onChange={(event) => setCustomerNotes(event.target.value)}
        />
      </div>

      {/* PAYMENT HISTORY */}
      {hasPayments ? (
        <div>
          <label className="text-sm font-semibold">Payment History</label>

          <div className="space-y-3">
            {payments.map((payment) => {
              const processingFee = Number(payment.processingFee) || 0;

              const paymentAmount = Number(payment.amount) || 0;

              return (
                <div
                  key={payment.id}
                  className="mt-1 border p-4 flex justify-between items-start bg-white"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {payment.method} Payment
                      {processingFee > 0 && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded">
                          Fee +${processingFee.toFixed(2)}
                        </span>
                      )}
                    </p>

                    <p className="text-xs text-gray-500">
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleDateString()
                        : "No payment date"}
                    </p>

                    {payment.note && (
                      <p className="text-xs italic text-gray-400 mt-1">
                        {payment.note}
                      </p>
                    )}
                  </div>

                  <div className="text-right space-y-1">
                    <p className="text-sm font-semibold">
                      Total Charged: $
                      {(paymentAmount + processingFee).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="hidden lg:block" />
      )}

      {/* TOTALS */}
      <div className="flex justify-end">
        <div className="grid grid-cols-2 gap-x-6 text-base min-w-[270px]">
          {/* LABELS */}
          <div className="text-lg font-semibold space-y-1 text-left text-gray-700">
            <p>Subtotal</p>

            {discountLines.map((discount) => (
              <p
                key={`${discount.name}-${discount.type}`}
                className="text-emerald-700"
              >
                Discount ({discount.name}
                {discount.type === "percent" ? ` ${discount.value}%` : ""})
              </p>
            ))}

            {appliedDiscount && (
              <button
                type="button"
                disabled={!documentId}
                className="block text-xs text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                onClick={removeDiscount}
              >
                Remove Discount
              </button>
            )}

            {showTaxControl && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  disabled={!documentId}
                  onChange={handleTaxChange}
                />
                Apply Tax
              </label>
            )}

            <p className="text-2xl font-bold text-gray-900">Total</p>

            {totalProcessingFee > 0 && (
              <p className="font-semibold">Processing Fee</p>
            )}

            {hasPayments && <p className="text-base">Total Charged</p>}

            {hasPayments && <p className="text-base font-bold">Balance</p>}
          </div>

          {/* VALUES */}
          <div className="mt-1 font-semibold space-y-1 text-right">
            <p>${subtotal.toFixed(2)}</p>

            {discountLines.map((discount) => (
              <p
                key={`${discount.name}-${discount.type}`}
                className="text-emerald-700"
              >
                −${discount.amount.toFixed(2)}
              </p>
            ))}

            <p>${tax.toFixed(2)}</p>

            <p className="text-2xl font-bold">${total.toFixed(2)}</p>

            {totalProcessingFee > 0 && (
              <p className="font-semibold">+${totalProcessingFee.toFixed(2)}</p>
            )}

            {hasPayments && (
              <p className="font-semibold">${totalCharged.toFixed(2)}</p>
            )}

            {hasPayments && (
              <p className="text-base font-bold">${balance.toFixed(2)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
