"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Loader2,
  Save,
  TrendingUp,
} from "lucide-react";

import { formatCurrency } from "@/lib/formatCurrency";

export default function InvoiceProfitPage() {
  const params = useParams();
  const router = useRouter();

  const invoiceId = Number(params.id);

  const [invoice, setInvoice] = useState(null);
  const [costInputs, setCostInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      setError("Invalid invoice id.");
      setLoading(false);
      return;
    }

    loadInvoice();
  }, [invoiceId]);

  async function loadInvoice() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.details || result.error || "Unable to load invoice.",
        );
      }

      const items = Array.isArray(result.invoiceItems)
        ? result.invoiceItems
        : [];

      const initialCosts = {};

      items.forEach((item) => {
        initialCosts[item.id] =
          item.totalCost === null || item.totalCost === undefined
            ? ""
            : String(item.totalCost);
      });

      setInvoice({
        ...result,
        invoiceItems: items,
      });

      setCostInputs(initialCosts);
    } catch (err) {
      console.error("Error loading invoice profit:", err);

      setError(err instanceof Error ? err.message : "Unable to load invoice.");
    } finally {
      setLoading(false);
    }
  }

  function handleCostChange(itemId, value) {
    if (value !== "" && Number(value) < 0) {
      return;
    }

    setCostInputs((previous) => ({
      ...previous,
      [itemId]: value,
    }));

    setSuccess("");
  }

  const calculations = useMemo(() => {
    const items = invoice?.invoiceItems || [];

    const itemRows = items.map((item) => {
      const saleTotal = Number(item.total || 0);
      const rawCost = costInputs[item.id];

      const hasCost =
        rawCost !== "" && rawCost !== null && rawCost !== undefined;

      const totalCost = hasCost ? Number(rawCost) : null;

      const validCost =
        totalCost !== null && Number.isFinite(totalCost) && totalCost >= 0;

      const profit = validCost ? saleTotal - totalCost : null;

      const margin =
        validCost && saleTotal > 0 ? (profit / saleTotal) * 100 : null;

      return {
        ...item,
        saleTotal,
        totalCost: validCost ? totalCost : null,
        profit,
        margin,
        costCompleted: validCost,
      };
    });

    const costsCompleted =
      itemRows.length > 0 && itemRows.every((item) => item.costCompleted);

    const pendingItems = itemRows.filter((item) => !item.costCompleted).length;

    const enteredCost = itemRows.reduce(
      (sum, item) => sum + Number(item.totalCost ?? 0),
      0,
    );

    const subtotal = Number(invoice?.subtotal || 0);

    const profit = costsCompleted ? subtotal - enteredCost : null;

    const profitMargin =
      costsCompleted && subtotal > 0 ? (profit / subtotal) * 100 : null;

    return {
      itemRows,
      costsCompleted,
      pendingItems,
      enteredCost,
      subtotal,
      profit,
      profitMargin,
    };
  }, [invoice, costInputs]);

  async function saveCosts() {
    try {
      if (!invoice) return;

      setSaving(true);
      setError("");
      setSuccess("");

      const items = invoice.invoiceItems.map((item) => {
        const rawValue = costInputs[item.id];

        if (rawValue === "" || rawValue === null || rawValue === undefined) {
          return {
            id: item.id,
            totalCost: null,
          };
        }

        const totalCost = Number(rawValue);

        if (!Number.isFinite(totalCost) || totalCost < 0) {
          throw new Error(`Invalid cost for ${item.name || "invoice item"}.`);
        }

        return {
          id: item.id,
          totalCost,
        };
      });

      const response = await fetch(`/api/invoices/${invoiceId}/costs`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.details || result.error || "Unable to save costs.",
        );
      }

      const updatedInvoice = result.invoice;

      if (updatedInvoice) {
        const updatedItems = Array.isArray(updatedInvoice.invoiceItems)
          ? updatedInvoice.invoiceItems
          : [];

        const nextCosts = {};

        updatedItems.forEach((item) => {
          nextCosts[item.id] =
            item.totalCost === null || item.totalCost === undefined
              ? ""
              : String(item.totalCost);
        });

        setInvoice({
          ...updatedInvoice,
          invoiceItems: updatedItems,
        });

        setCostInputs(nextCosts);
      }

      setSuccess("Costs saved successfully.");
    } catch (err) {
      console.error("Error saving invoice costs:", err);

      setError(err instanceof Error ? err.message : "Unable to save costs.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading invoice profitability...</span>
        </div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => router.push("/reports/profit")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profit Report
        </button>

        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-medium">Unable to load invoice</p>

            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const customerName =
    invoice?.client?.company || invoice?.client?.name || "No customer";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/reports/profit")}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profit Report
          </button>

          <h1 className="text-2xl font-semibold text-gray-900">
            Invoice #{invoice.invoiceNumber || invoice.id}
          </h1>

          <p className="mt-1 text-sm text-gray-500">{customerName}</p>
        </div>

        <button
          type="button"
          onClick={saveCosts}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {saving ? "Saving..." : "Save Costs"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-medium">Unable to save costs</p>

            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Sales"
          value={formatCurrency(calculations.subtotal)}
          subtitle="Before tax"
          icon={DollarSign}
        />

        <SummaryCard
          title="Production Cost"
          value={formatCurrency(calculations.enteredCost)}
          subtitle={
            calculations.costsCompleted
              ? "All costs entered"
              : `${calculations.pendingItems} items pending`
          }
          icon={DollarSign}
        />

        <SummaryCard
          title="Gross Profit"
          value={
            calculations.profit === null
              ? "—"
              : formatCurrency(calculations.profit)
          }
          subtitle="Sales minus production cost"
          icon={TrendingUp}
        />

        <SummaryCard
          title="Profit Margin"
          value={
            calculations.profitMargin === null
              ? "—"
              : `${calculations.profitMargin.toFixed(2)}%`
          }
          subtitle={
            calculations.costsCompleted
              ? "Completed"
              : "Complete all item costs"
          }
          icon={CheckCircle2}
        />
      </div>

      <div className="rounded-xl border border-[#ededed] bg-white">
        <div className="border-b border-[#ededed] px-5 py-4">
          <h2 className="font-semibold text-gray-900">Invoice items</h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the total production cost for each line.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead className="bg-[#FBFBFB]">
              <tr className="border-b border-[#ededed]">
                <TableHeading>Item</TableHeading>
                <TableHeading align="right">Qty</TableHeading>
                <TableHeading align="right">Unit Price</TableHeading>
                <TableHeading align="right">Sales Total</TableHeading>
                <TableHeading align="right">Total Cost</TableHeading>
                <TableHeading align="right">Profit</TableHeading>
                <TableHeading align="right">Margin</TableHeading>
              </tr>
            </thead>

            <tbody>
              {calculations.itemRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center text-sm text-gray-500"
                  >
                    This invoice has no items.
                  </td>
                </tr>
              ) : (
                calculations.itemRows.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#ededed] last:border-b-0"
                  >
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">
                        {item.name || "Invoice item"}
                      </p>

                      {item.notes && (
                        <p className="mt-1 text-xs text-gray-400">
                          {item.notes}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-gray-700">
                      {item.qty}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-gray-700">
                      {formatCurrency(item.unitPrice)}
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(item.saleTotal)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="ml-auto flex w-36 items-center rounded-lg border border-gray-200 bg-white px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                        <span className="mr-1 text-sm text-gray-400">$</span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={costInputs[item.id] ?? ""}
                          onChange={(event) =>
                            handleCostChange(item.id, event.target.value)
                          }
                          placeholder="0.00"
                          className="w-full border-0 bg-transparent text-right text-sm outline-none"
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-medium">
                      {item.profit === null ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span
                          className={
                            item.profit >= 0
                              ? "text-emerald-700"
                              : "text-red-600"
                          }
                        >
                          {formatCurrency(item.profit)}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm">
                      {item.margin === null ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span
                          className={
                            item.margin >= 0 ? "text-gray-700" : "text-red-600"
                          }
                        >
                          {item.margin.toFixed(2)}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#ededed] bg-[#FBFBFB] px-5 py-5">
          <div className="ml-auto max-w-md space-y-3">
            <SummaryRow
              label="Sales before tax"
              value={formatCurrency(calculations.subtotal)}
            />

            <SummaryRow
              label="Production cost"
              value={formatCurrency(calculations.enteredCost)}
            />

            <SummaryRow
              label="Gross profit"
              value={
                calculations.profit === null
                  ? "Pending"
                  : formatCurrency(calculations.profit)
              }
              emphasis
            />

            <SummaryRow
              label="Profit margin"
              value={
                calculations.profitMargin === null
                  ? "Pending"
                  : `${calculations.profitMargin.toFixed(2)}%`
              }
              emphasis
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#ededed] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>

          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        </div>

        <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function TableHeading({ children, align = "left" }) {
  return (
    <th
      className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function SummaryRow({ label, value, emphasis = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        emphasis ? "border-t border-gray-200 pt-3" : ""
      }`}
    >
      <span
        className={
          emphasis ? "font-medium text-gray-900" : "text-sm text-gray-500"
        }
      >
        {label}
      </span>

      <span
        className={
          emphasis
            ? "text-lg font-semibold text-gray-900"
            : "text-sm font-medium text-gray-900"
        }
      >
        {value}
      </span>
    </div>
  );
}
