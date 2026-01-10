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

  return (
    <main className="min-h-screen bg-gray-50 flex justify-center py-10 px-4">
      <div className="w-full max-w-5xl bg-white p-8 rounded-xl shadow-md">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/customers" className="text-blue-600 hover:text-blue-700">
            <ArrowLeft size={22} />
          </Link>

          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                {client.name}
              </h1>
              <p className="text-gray-500">{client.company}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8">
          <a
            href={`tel:${client.phone}`}
            className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200"
          >
            <Phone size={16} /> Call
          </a>

          <a
            href={`mailto:${client.email}`}
            className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200"
          >
            <Mail size={16} /> Email
          </a>

          <a
            href={`https://wa.me/1${client.phone?.replace(/\D/g, "")}`}
            target="_blank"
            className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-md hover:bg-green-200"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>

          <Link
            href={`/customers/${client.id}/edit`}
            className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200"
          >
            <Edit size={16} /> Edit
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b pb-2 mb-6 text-gray-600">
          {["profile", "quotes", "orders", "invoices"].map((tab) => (
            <button
              key={tab}
              className={`pb-2 capitalize ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600 font-medium"
                  : "hover:text-gray-800"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Profile */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <p><strong>Email:</strong> {client.email}</p>
            <p><strong>Phone:</strong> {client.phone}</p>
            <p><strong>Address:</strong> {client.address}</p>
            <p><strong>City:</strong> {client.city}, {client.state}</p>
            <p><strong>Zip:</strong> {client.zip}</p>
          </div>
        )}

        {/* Quotes */}
        {activeTab === "quotes" && (
          <div>
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-lg">Quotes</h3>
              <Link
                href={`/quotes/new?client=${client.id}`}
                className="bg-blue-600 px-3 py-2 rounded-md text-white hover:bg-blue-700 text-sm"
              >
                + New Quote
              </Link>
            </div>

            {quotes.length === 0 ? (
              <p className="text-gray-500">No quotes found.</p>
            ) : (
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2">Reference</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q.id} className="border-t hover:bg-gray-50 cursor-pointer">
                      <td className="p-2">{q.reference}</td>
                      <td className="p-2">${q.total.toFixed(2)}</td>
                      <td className="p-2">{q.status}</td>
                      <td className="p-2">{q.createdAt.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Orders */}
        {activeTab === "orders" && (
          <div>
            <h3 className="font-semibold text-lg mb-3">Orders</h3>

            {orders.length === 0 ? (
              <p className="text-gray-500">No orders found.</p>
            ) : (
              <ul className="space-y-2">
                {orders.map((o) => (
                  <li
                    key={o.id}
                    className="border p-3 rounded-md bg-gray-50 hover:bg-gray-100"
                  >
                    <strong>#{o.id}</strong> — {o.status}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Invoices */}
        {activeTab === "invoices" && (
          <div>
            <h3 className="font-semibold text-lg mb-3">Invoices</h3>

            {invoices.length === 0 ? (
              <p className="text-gray-500">No invoices found.</p>
            ) : (
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2">Invoice #</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">{inv.invoiceNumber}</td>
                      <td className="p-2">${inv.total.toFixed(2)}</td>
                      <td className="p-2">{inv.paymentStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
