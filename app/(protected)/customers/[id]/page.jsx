"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Edit } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import { getInvoiceStatus } from "@/lib/invoiceStatus";
import { useRouter } from "next/navigation";

/* =========================
   CONSTANTS
========================= */

const INVOICE_GRID = "grid-cols-[1fr_1fr_2fr_1fr_1fr]";
function resolveInvoiceStatus(inv) {
  const total = Number(inv.total || 0);
  const paid = Number(inv.amountPaid || 0);
  const balance = total - paid;

  if (total === 0) return "Draft";
  if (paid === 0) return "Issued";
  if (paid > 0 && balance > 0) return "Partially Paid";
  if (balance <= 0) return "Paid";

  return "Issued";
}

/* =========================
   Helpers
========================= */
function StatusBadge({ status }) {
  const colors = {
    Draft: "bg-gray-100 text-gray-600",
    Issued: "bg-blue-100 text-blue-700",
    "Partially Paid": "bg-yellow-100 text-yellow-700",
    Paid: "bg-green-100 text-green-700",
    Overdue: "bg-red-100 text-red-700",
    Void: "bg-gray-300 text-gray-700",
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded ${
        colors[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

function InvoiceStatusBadge({ status }) {
  const styles = {
    PAID: "bg-green-100 text-green-700",
    PARTIAL: "bg-purple-100 text-purple-700",
    DUE: "bg-blue-100 text-blue-700",
    OVERDUE: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-200 text-gray-700",
    UNCOLLECTABLE: "bg-gray-300 text-gray-600",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="font-semibold text-lg">${value.toFixed(2)}</div>
    </div>
  );
}

/* =========================
   Page
========================= */
function validatePayments(inv) {
  const total = Number(inv.total || inv.invoiceTotal || 0);

  // 🔑 detectar pagos reales
  const paid =
    Number(inv.amountPaid) ||
    Number(inv.paymentsTotal) ||
    (Array.isArray(inv.payments)
      ? inv.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
      : 0);

  const balance = Number((total - paid).toFixed(2));

  if (total === 0) {
    return { paid: 0, balance: 0, status: "Draft" };
  }

  if (paid === 0) {
    return { paid: 0, balance: total, status: "Issued" };
  }

  if (paid > 0 && balance > 0) {
    return { paid, balance, status: "Partially Paid" };
  }

  if (balance <= 0) {
    return { paid, balance: 0, status: "Paid" };
  }

  return { paid, balance, status: "Issued" };
}

export default function CustomerCRM({ params }) {
  const router = useRouter();
  const { id } = params;
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/clients/${id}`);
      const json = await res.json();
      setData(json);
    }
    load();
  }, [id]);

  if (!data) {
    return null;
  }

  const { client, invoices = [] } = data;

  /* =========================
     Initials
  ========================= */
  const initials = client.name
    ?.split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  /* =========================
     Invoice Stats
  ========================= */
  const stats = {
    total: 0,
    outstanding: 0,
    overdue: 0,
    draft: 0,
    cancelled: 0,
  };

  invoices.forEach((inv) => {
    stats.total += inv.total || 0;

    if (inv.status === "CANCELLED") {
      stats.cancelled += inv.total || 0;
      return;
    }

    if (inv.paymentStatus !== "PAID") {
      stats.outstanding += inv.total || 0;
    }

    if (inv.paymentStatus === "OVERDUE") {
      stats.overdue += inv.total || 0;
    }
  });

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* =========================
            CUSTOMER HEADER
        ========================= */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-lg">
              {initials}
            </div>

            <div>
              <h2 className="text-xl font-semibold">{client.name}</h2>
              <p className="text-sm text-gray-500"> {client.company || "—"}</p>
            </div>
          </div>

          <Link
            href={`/customers/${id}/edit`}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-50"
          >
            <Edit size={14} />
            Edit Profile
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white border  px-6 py-4 mt-6 text-sm">
          {/* Email */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-gray-400">📧</div>
            <div>
              <div className="text-xs text-gray-500">Email Address</div>
              <div className="font-medium text-gray-900">
                {client.email || "—"}
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-gray-400">📞</div>
            <div>
              <div className="text-xs text-gray-500">Phone</div>
              <div className="font-medium text-gray-900">
                {client.phone || "—"}
              </div>
            </div>
          </div>

          {/* Company */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-gray-400">🏢</div>
            <div>
              <div className="text-xs text-gray-500">Address</div>
              <div className="font-medium text-gray-900">
                {client.address || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
            INVOICE STATISTICS
        ========================= */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Invoice Statistics</h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat label="Total Invoice" value={stats.total} />
          <Stat label="Outstanding" value={stats.outstanding} />
          <Stat label="Overdue" value={stats.overdue} />
          <Stat label="Draft" value={stats.draft} />
          <Stat label="Cancelled" value={stats.cancelled} />
        </div>
      </div>

      {/* =========================
            INVOICE LIST (Listbox-style)
        ========================= */}
      <div className="rounded-xl mt-5 border bg-white shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-sm text-gray-600 text-left">
              <th className="px-6 py-3">Invoice #</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Invoice Total</th>
              <th className="px-6 py-3">Paid</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {invoices.length > 0 ? (
              invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-t text-sm font-medium hover:bg-blue-50 cursor-pointer transition"
                  onClick={() => router.push(`/invoices/${inv.id}`)}
                >
                  <td className="px-6 py-3">{inv.invoiceNumber}</td>

                  <td className="px-6 py-3">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-3">{formatCurrency(inv.total)}</td>

                  <td className="px-6 py-3">{formatCurrency(inv.paid)}</td>

                  <td className="px-6 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
