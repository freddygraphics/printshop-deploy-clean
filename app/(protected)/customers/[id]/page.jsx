"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Edit } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import { useRouter } from "next/navigation";

/* =========================
   HELPERS
========================= */

function validateInvoice(inv) {
  if (!inv) {
    return {
      total: 0,
      paid: 0,
      balance: 0,
      status: "Issued",
    };
  }

  const total = Number(inv.total || 0);
  const paid = Number(inv.paid || 0);
  const balance = Math.max(0, Number(inv.balance || 0));
  const status = inv.status || "Issued";

  return {
    total,
    paid,
    balance,
    status,
  };
}

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
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        colors[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-sm text-gray-500">{label}</div>

      <div className="text-lg font-semibold">{formatCurrency(value)}</div>
    </div>
  );
}

/* =========================
   PAGE
========================= */

export default function CustomerCRM({ params }) {
  const router = useRouter();

  const { id } = params;

  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/clients/${id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Unable to load customer");
        }

        const json = await res.json();

        setData(json);
      } catch (error) {
        console.error("Error loading customer:", error);
      }
    }

    load();
  }, [id]);
  if (!data) {
    return null;
  }

  const client = data?.client;

  const invoices = Array.isArray(data?.invoices)
    ? data.invoices.filter(Boolean)
    : [];

  if (!client) {
    return null;
  }

  /* =========================
   INITIALS
========================= */

  const initials = client.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  /* =========================
     INVOICE STATISTICS
  ========================= */

  const stats = {
    total: 0,
    outstanding: 0,
    overdue: 0,
    draft: 0,
    cancelled: 0,
  };

  invoices.filter(Boolean).forEach((inv) => {
    const result = validateInvoice(inv);

    const total = result.total;

    /*
      VOID
      No suma al Total Invoice ni Outstanding.
      Sí suma a Cancelled.
    */
    if (result.status === "Void") {
      stats.cancelled += total;
      return;
    }

    /*
      DRAFT
    */
    if (result.status === "Draft") {
      stats.draft += total;
      return;
    }

    /*
      TOTAL INVOICE
      Solo invoices reales, no VOID ni Draft.
    */
    stats.total += total;

    /*
      OUTSTANDING
    */
    if (result.balance > 0) {
      stats.outstanding += result.balance;
    }

    /*
      OVERDUE
    */
    if (result.status === "Overdue") {
      stats.overdue += result.balance;
    }
  });

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* =========================
          CUSTOMER HEADER
      ========================= */}

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
              {initials}
            </div>

            <div>
              <h2 className="text-xl font-semibold">{client.name}</h2>

              <p className="text-sm text-gray-500">{client.company || "—"}</p>
            </div>
          </div>

          <Link
            href={`/customers/${id}/edit`}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            <Edit size={14} />
            Edit Profile
          </Link>
        </div>

        {/* CUSTOMER INFO */}

        <div className="mt-6 grid grid-cols-1 gap-6 border bg-white px-6 py-4 text-sm md:grid-cols-4">
          {/* EMAIL */}

          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-gray-400">📧</div>

            <div>
              <div className="text-xs text-gray-500">Email Address</div>

              <div className="font-medium text-gray-900">
                {client.email || "—"}
              </div>
            </div>
          </div>

          {/* PHONE */}

          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-gray-400">📞</div>

            <div>
              <div className="text-xs text-gray-500">Phone</div>

              <div className="font-medium text-gray-900">
                {client.phone || "—"}
              </div>
            </div>
          </div>

          {/* ADDRESS */}

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

      <div className="rounded-xl border bg-white p-6">
        <h3 className="mb-4 font-semibold">Invoice Statistics</h3>

        {/* TOTAL AMOUNT DUE */}
        <div className="mb-6 border-b pb-5">
          <div className="text-sm font-medium text-gray-500">
            Total Amount Due
          </div>

          <div
            className={`mt-1 text-2xl font-bold ${
              stats.outstanding > 0 ? "text-red-600" : "text-gray-900"
            }`}
          >
            {formatCurrency(stats.outstanding)}
          </div>
        </div>

        {/* STATISTICS */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Total Invoice" value={stats.total} />
          <Stat label="Overdue" value={stats.overdue} />
          <Stat label="Draft" value={stats.draft} />
          <Stat label="Cancelled" value={stats.cancelled} />
        </div>
      </div>

      {/* =========================
          INVOICE LIST
      ========================= */}

      <div className="mt-5 overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-600">
              <th className="px-6 py-3">Invoice #</th>

              <th className="px-6 py-3">Date</th>

              <th className="px-6 py-3">Invoice Total</th>

              <th className="px-6 py-3">Paid</th>

              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {invoices.filter(Boolean).length > 0 ? (
              invoices.filter(Boolean).map((inv) => {
                const invoice = validateInvoice(inv);

                return (
                  <tr
                    key={inv.id}
                    className="cursor-pointer border-t text-sm font-medium transition hover:bg-blue-50"
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                  >
                    <td className="px-6 py-3">{inv.invoiceNumber}</td>

                    <td className="px-6 py-3">
                      {new Date(
                        inv.issuedAt || inv.createdAt,
                      ).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-3">
                      {formatCurrency(
                        Number(inv.total || inv.invoiceTotal || 0),
                      )}
                    </td>

                    <td className="px-6 py-3">
                      {formatCurrency(invoice.paid)}
                    </td>

                    <td className="px-6 py-3">
                      <StatusBadge status={invoice.status} />
                    </td>
                  </tr>
                );
              })
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
