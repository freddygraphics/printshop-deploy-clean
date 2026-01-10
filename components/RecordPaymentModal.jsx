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

  // Texto que el usuario escribe
  const [amountPaidInput, setAmountPaidInput] = useState(
    invoice.balance?.toFixed(2) || ""
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
    if (defaultDepositPercent > 0 && invoice?.balance > 0) {
      const value =
        Math.round(((invoice.balance * defaultDepositPercent) / 100) * 100) /
        100;

      setPreset("deposit"); // ✅
      setAmountPaid(value);
      setAmountPaidInput(value.toFixed(2));
    }
  }, [defaultDepositPercent, invoice?.balance]);

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
        {/* QUICK AMOUNT (KANAKKU STYLE) */}
        {invoice && (
          <div className="px-6 pb-4">
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
              {true && (
                <button
                  type="button"
                  onClick={() => {
                    const value =
                      Math.round(
                        ((invoice.balance * defaultDepositPercent) / 100) * 100
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
              )}

              {/* CUSTOM */}
              <button
                type="button"
                onClick={() => setPreset("custom")}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  preset === "custom"
                    ? "bg-green-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Custom
              </button>
            </div>
          </div>
        )}

        {/* FORM */}
        <div className="px-6 py-4 space-y-4">
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

              {errors.paidOn && (
                <p className="text-xs text-red-600 mt-1">Required</p>
              )}
            </div>
          </div>

          {/* AMOUNTS */}
          <div className="space-y-4">
            {/* AMOUNTS + CHANGE */}
            {paymentMethod === "Cash" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* LEFT COLUMN */}
                <div className="space-y-4">
                  {/* AMOUNT PAID */}
                  <div>
                    <label className="text-sm font-medium">Amount Paid *</label>

                    <input
                      type="text"
                      inputMode="decimal"
                      className={`w-full border rounded-lg px-4 py-2 ${
                        errors.amountPaid ? "border-red-500" : ""
                      }`}
                      value={amountPaidInput}
                      onChange={(e) => {
                        setPreset("custom");
                        const val = parseMoney(e.target.value);
                        setAmountPaid(val);
                        setAmountPaidInput(formatMoney(val));
                        setErrors({ ...errors, amountPaid: null });
                      }}
                    />
                  </div>

                  {/* AMOUNT RECEIVED */}
                  <div>
                    <label className="text-sm font-medium">
                      Amount Received
                    </label>

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
                </div>

                {/* RIGHT COLUMN – CHANGE */}
                {paymentMethod === "Cash" && amountReceived > 0 && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Change</p>
                      <p className="text-4xl font-bold text-green-600">
                        ${(amountReceived - amountPaid).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CASH ONLY */}
            {paymentMethod === "Cash" && (
              <div className="flex items-end gap-6"></div>
            )}
          </div>

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

              onSave({
                paymentMethod,
                amountPaid: Number(amountPaid),
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
