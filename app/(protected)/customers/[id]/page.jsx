"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, Edit, MessageCircle } from "lucide-react";

export default function CustomerCRM({ params }) {
  const { id } = params;
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/clients/${id}`); // backend sigue siendo /clients
      const json = await res.json();
      setData(json);
    }
    load();
  }, [id]);

  if (!data) {
    return <div className="p-10 text-center text-gray-500">Loading…</div>;
  }

  const { client, quotes, orders, invoices } = data;

  const initials = client.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  function InvoiceStatusBadge({ status }) {
    const styles = {
      PAID: "bg-green-100 text-green-700",
      PARTIAL: "bg-yellow-100 text-yellow-700",
      DUE: "bg-blue-100 text-blue-700",
      OVERDUE: "bg-red-100 text-red-700",
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

  return (
    <main className="min-h-screen bg-gray-50 flex justify-center py-10 px-4">
      <div className="w-full max-w-6xl p-6">
        {/* Header */}
        <div className="space-y-6 gap-6">
          {/* CARD 1 — CUSTOMER INFO */}
          <div className="bg-white border border-gray-200/70 rounded-xl p-6 shadow-sm">
            <div className="mb-4">
              <div className="text-lg font-semibold text-gray-900">
                {client.name}
              </div>
              {client.company && (
                <div className="text-sm text-gray-500">{client.company}</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <p>
                <span className="font-medium">Email:</span>{" "}
                {client.email || "—"}
              </p>
              <p>
                <span className="font-medium">Phone:</span>{" "}
                {client.phone || "—"}
              </p>
              <p>
                <span className="font-medium">Address:</span>{" "}
                {client.address || "—"}
              </p>
              <p>
                <span className="font-medium">City:</span> {client.city || "—"},{" "}
                {client.state || ""} {client.zip || ""}
              </p>
            </div>
          </div>

          {/* CARD 2 — INVOICES */}
          <div className="bg-white border rounded-xl p-5 lg:col-span-2">
            {invoices.length === 0 ? (
              <p className="text-sm text-gray-500">No invoices found.</p>
            ) : (
              <div className="divide-y">
                {invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-md transition"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        Invoice #{inv.invoiceNumber}
                      </div>
                      <div className="text-xs text-gray-500">
                        ${inv.total.toFixed(2)}
                      </div>
                    </div>

                    <InvoiceStatusBadge status={inv.paymentStatus} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
