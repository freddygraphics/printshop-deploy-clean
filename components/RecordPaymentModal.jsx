"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";

export default function RecordPaymentModal({
  invoice,
  defaultDepositPercent = 50,
  onClose,
  onSave,
}) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().split("T")[0]);
  const [preset, setPreset] = useState("full"); // full | deposit | custom
  const isCash = paymentMethod === "Cash";
  const isCard = paymentMethod === "Card";
  const isZelle = paymentMethod === "Zelle";

  const publicSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const invoiceLink = invoice?.publicToken
    ? `${publicSiteUrl}/i/${invoice.publicToken}`
    : "";

  const cardFeePercent = 3.5; // ✅ AQUÍ ESTÁ BIEN

  const showQuickAmount = isCash || isCard || isZelle;

  // Texto que el usuario escribe
  const [amountPaidInput, setAmountPaidInput] = useState(
    invoice.balance?.toFixed(2) || "",
  );

  // Número real para cálculos
  const [amountPaid, setAmountPaid] = useState(invoice.balance || 0);

  const [amountReceivedInput, setAmountReceivedInput] = useState("");
  const [amountReceived, setAmountReceived] = useState(0);

  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!paymentMethod) newErrors.paymentMethod = true;
    if (!paidOn) newErrors.paidOn = true;
    if (!amountPaid || amountPaid <= 0) newErrors.amountPaid = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // --- MONEY HELPERS ---
  const moneyFmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const formatMoney = (value) => {
    if (value === "" || value === null || isNaN(value)) return "";
    return moneyFmt.format(Number(value));
  };

  const parseMoney = (value) => {
    if (!value) return 0;
    const cleaned = value.replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };
  useEffect(() => {
    if (invoice?.balance == null) return;

    setPreset("full");
    setAmountPaid(Number(invoice.balance));
    setAmountPaidInput(Number(invoice.balance).toFixed(2));
  }, [invoice?.balance]);

  async function openInvoiceForPayment() {
    const res = await fetch("/api/payment-intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId: invoice.id,
        amount: amountPaid,
        processingFee,
        method: "card",
      }),
    });

    const data = await res.json();

    if (!data.intentId) {
      alert("Failed to prepare payment");
      return;
    }

    // 🔥 REDIRIGE AL INVOICE CON INTENT
    window.open(`/i/${invoice.publicToken}?pi=${data.intentId}`, "_blank");
  }
  async function getFreshPublicToken(invoiceId) {
    const res = await fetch(`/api/invoices/${invoiceId}`);
    const freshInvoice = await res.json();

    if (!freshInvoice?.publicToken) {
      throw new Error("Invoice still initializing");
    }

    return freshInvoice.publicToken;
  }

  async function handleCopyPaymentLink() {
    if (!amountPaid || amountPaid <= 0) {
      alert("Amount must be greater than $0");
      return;
    }
    console.log("➡️ Sending to Square:", {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: totalWithFee,
    });

    const res = await fetch("/api/payments/square/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: totalWithFee, // 👈 FULL o 50% + FEE
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.url) {
      alert("Failed to generate payment link");
      return;
    }

    async function handleCopyPaymentLink() {
      if (!amountPaid || amountPaid <= 0) {
        alert("Amount must be greater than $0");
        return;
      }

      const res = await fetch("/api/payments/square/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: totalWithFee,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        alert("Failed to generate payment link");
        return;
      }

      // 🔥 CLAVE: REFRESCAR TOKEN
      const publicToken = await getFreshPublicToken(invoice.id);

      const link = `${window.location.origin}/i/${publicToken}`;

      await navigator.clipboard.writeText(link);
      alert("Payment link copied");
    }
  }

  const processingFeePercent = 3.5;

  const processingFee = isCard ? amountPaid * (processingFeePercent / 100) : 0;

  function buildReceiptMessage() {
    const clientName = invoice?.client?.name || "there";
    const invNo = invoice?.invoiceNumber || "";
    const charged = Number(totalWithFee || 0).toFixed(2);

    const remaining = Math.max(
      Number(invoice.balance || 0) - Number(amountPaid || 0),
      0,
    ).toFixed(2);

    // Resumen simple de items (opcional)
    const itemsSummary =
      Array.isArray(invoice.items) && invoice.items.length
        ? invoice.items
            .slice(0, 3)
            .map((it) => `${it.name} x${it.qty || 1}`)
            .join(", ") + (invoice.items.length > 3 ? "…" : "")
        : "Your order";

    return `✅ Payment received – Invoice #${invNo}

Hi ${clientName}, we received your payment of $${charged}.

🖨️ ${itemsSummary}
Balance due: $${remaining}

👉 View full invoice & details:
${invoiceLink}

Thank you,
Freddy Graphics`;
  }

  // =======================
  // TOTAL CHARGED (CLIENT PAYS)
  // =======================
  const totalWithFee =
    isCard && amountPaid > 0
      ? Number(amountPaid) + Number(processingFee)
      : Number(amountPaid);

  if (invoice.balance <= 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
        <div className="bg-white w-full max-w-md rounded-lg shadow-xl p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">
            Invoice #{invoice.invoiceNumber}
          </h2>
          <p className="text-green-600 font-semibold">
            This invoice is already paid in full
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-5 py-2 rounded-md border hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            Record Payment for {invoice.client?.name}
          </h2>

          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        {/* SUMMARY TABLE */}
        <div className="px-6 py-4">
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-blue-50 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Invoice</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2">IN #{invoice.invoiceNumber}</td>
                  <td className="px-4 py-2 text-right">
                    ${invoice.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">
                    ${invoice.balance.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FORM */}
        {/* FORM */}
        <div className="px-6 py-4 space-y-6">
          {/* PAYMENT METHOD + DATE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PAYMENT METHOD */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                * Payment Method
              </label>
              <select
                className={`w-full border rounded-lg px-4 py-2 ${
                  errors.paymentMethod ? "border-red-500" : ""
                }`}
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setErrors({ ...errors, paymentMethod: null });
                }}
              >
                <option value="">Select Method</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Zelle">Zelle</option>
                <option value="Check">Check</option>
              </select>
            </div>

            {/* PAID ON */}
            <div>
              <label className="text-sm font-medium">Paid On *</label>
              <input
                type="date"
                className={`w-full border rounded-lg px-4 py-2 ${
                  errors.paidOn ? "border-red-500" : ""
                }`}
                value={paidOn}
                onChange={(e) => {
                  setPaidOn(e.target.value);
                  setErrors({ ...errors, paidOn: null });
                }}
              />
            </div>
          </div>

          {/* QUICK AMOUNT */}
          {/* QUICK AMOUNT */}
          {invoice && showQuickAmount && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Quick Amount</p>

              <div className="inline-flex rounded-lg border bg-white p-1 gap-1">
                {/* FULL */}
                <button
                  type="button"
                  onClick={() => {
                    setPreset("full");
                    setAmountPaid(invoice.balance);
                    setAmountPaidInput(invoice.balance.toFixed(2));
                  }}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    preset === "full"
                      ? "bg-green-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Full
                </button>

                {/* 50% DEPOSIT */}
                <button
                  type="button"
                  onClick={() => {
                    const value =
                      Math.round(
                        ((invoice.balance * defaultDepositPercent) / 100) * 100,
                      ) / 100;

                    setPreset("deposit");
                    setAmountPaid(value);
                    setAmountPaidInput(value.toFixed(2));
                  }}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    preset === "deposit"
                      ? "bg-green-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {defaultDepositPercent}% Deposit
                </button>
              </div>
            </div>
          )}

          {/* AMOUNT PAID */}
          {showQuickAmount && (
            <div>
              <label className="text-sm font-medium">Amount Paid *</label>
              <div className="relative">
                <span className="absolute left-3 top-[11px] text-gray-500">
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`w-full h-11 border rounded-lg pl-7 pr-4 py-2 ${
                    errors.amountPaid ? "border-red-500" : ""
                  }`}
                  value={amountPaidInput}
                  onChange={(e) => {
                    setPreset("custom");
                    const raw = e.target.value;
                    if (!/^\d*\.?\d{0,2}$/.test(raw)) return;
                    setAmountPaidInput(raw);
                    setAmountPaid(parseFloat(raw || 0));
                  }}
                  onBlur={() => {
                    if (amountPaidInput !== "") {
                      setAmountPaidInput(Number(amountPaid).toFixed(2));
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* CASH + ZELLE */}
          {isCash && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium">Amount Received</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full border rounded-lg px-4 py-2"
                  value={amountReceivedInput}
                  onChange={(e) => {
                    const val = parseMoney(e.target.value);
                    setAmountReceived(val);
                    setAmountReceivedInput(formatMoney(val));
                  }}
                />
              </div>

              {amountReceived > 0 && (
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Change</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${(amountReceived - amountPaid).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CARD FEE */}
          {isCard && (
            <div className="bg-gray-50 border rounded-lg p-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Processing Fee ({processingFeePercent}%)
                </span>
                <span className="text-gray-800">
                  +${processingFee.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between font-semibold">
                <span className="text-gray-700">Total Charged</span>
                <span className="text-green-700">
                  ${totalWithFee.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-outline mt-2 w-full"
                onClick={async () => {
                  const totalCharged =
                    Number(amountPaid || 0) + Number(processingFee || 0);

                  const res = await fetch("/api/payment-intents", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      invoiceId: invoice.id,
                      amount: amountPaid, // 50% o full
                      processingFee,
                      totalCharged,
                      method: "card",
                      type: preset === "deposit" ? "deposit" : "full",
                      status: "pending",
                    }),
                  });

                  if (!res.ok) {
                    alert("Failed to prepare payment");
                    return;
                  }

                  const { intentId } = await res.json();

                  // ✅ COPY LINK EN VEZ DE ABRIR
                  const publicToken = await getFreshPublicToken(invoice.id);

                  const link = `${window.location.origin}/i/${publicToken}?pi=${intentId}`;
                  await navigator.clipboard.writeText(link);
                  alert("Payment link copied");
                }}
              >
                Copy Payment Link
              </button>

              <button
                type="button"
                onClick={async () => {
                  const msg = buildReceiptMessage();
                  await navigator.clipboard.writeText(msg);
                  alert("WhatsApp/SMS message copied ✅");
                }}
                className="btn btn-outline mt-2 w-full"
              >
                Copy WhatsApp / SMS Message
              </button>
            </div>
          )}

          {/* NOTE */}
          <div>
            <label className="text-sm font-medium text-gray-700">Note</label>
            <textarea
              className="mt-1 w-full border rounded-md px-3 py-2 min-h-[90px]"
              placeholder="Internal note about this payment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-md border text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            onClick={() => {
              if (!validate()) return;

              // 🚫 BLOQUEAR OVERPAYMENT
              if (amountPaid > invoice.balance) {
                setErrors({
                  ...errors,
                  amountPaid: `Amount cannot exceed balance ($${invoice.balance.toFixed(
                    2,
                  )})`,
                });
                return;
              }

              const safeAmount = Math.min(
                Number(amountPaid),
                Number(invoice.balance),
              );
              onSave({
                paymentMethod,
                amount: amountPaid, // 👈 SOLO invoice amount
                processingFee, // 👈 extra
                paidOn,
                note,
              });
            }}
          >
            Save Payment
          </button>
        </div>
      </div>
    </div>
  );
}
