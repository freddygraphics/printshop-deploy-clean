"use client";

import { useMemo } from "react";
import { getInvoiceStatus } from "@/lib/invoiceStatus";

export function useInvoiceCalculations({
  items = [],
  appliedDiscount = null,
  taxEnabled = false,
  taxRate = 0,
  payments = [],
  mode = "edit",
  dueDate = null,
  invoiceStatus = null,
}) {
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + Number(item?.total || 0);
    }, 0);
  }, [items]);

  const discountLines = useMemo(() => {
    if (!appliedDiscount) {
      return [];
    }

    const discountType = appliedDiscount.type;
    const discountValue = Number(appliedDiscount.value || 0);

    let amount = 0;

    if (discountType === "percent") {
      amount = subtotal * (discountValue / 100);
    }

    if (discountType === "fixed") {
      amount = discountValue;
    }

    amount = Math.min(Math.max(amount, 0), subtotal);

    return [
      {
        name: appliedDiscount.name || "Discount",
        type: discountType,
        value: discountValue,
        amount,
      },
    ];
  }, [appliedDiscount, subtotal]);

  const discountAmount = useMemo(() => {
    return discountLines.reduce((sum, discount) => {
      return sum + Number(discount.amount || 0);
    }, 0);
  }, [discountLines]);

  const discountedSubtotal = Math.max(subtotal - discountAmount, 0);

  const tax = useMemo(() => {
    if (!taxEnabled) return 0;

    const normalizedTaxRate = Number(taxRate || 0);

    if (normalizedTaxRate <= 0) return 0;

    return discountedSubtotal * (normalizedTaxRate / 100);
  }, [taxEnabled, taxRate, discountedSubtotal]);

  const total = discountedSubtotal + tax;

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, payment) => {
      return sum + Number(payment?.amount || 0);
    }, 0);
  }, [payments]);

  const balance = total - totalPaid;

  const totalProcessingFee = useMemo(() => {
    return payments.reduce((sum, payment) => {
      return sum + Number(payment?.processingFee || 0);
    }, 0);
  }, [payments]);

  const totalCharged = total + totalProcessingFee;

  const status =
    mode === "new"
      ? "Draft"
      : getInvoiceStatus({
          invoiceTotal: total,
          paymentsTotal: totalPaid,
          balance,
          dueDate,
          status: invoiceStatus,
        });

  return {
    subtotal,
    discountLines,
    discountAmount,
    discountedSubtotal,
    tax,
    total,
    totalPaid,
    balance,
    totalProcessingFee,
    totalCharged,
    status,
  };
}
