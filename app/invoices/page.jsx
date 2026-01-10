"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Receipt, Loader2, Calendar, Plus, ChevronDown } from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInvoiceStatus } from "@/lib/invoiceStatus";
import { Listbox } from "@headlessui/react";

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter") || "thismonth";

  const [filter, setFilter] = useState(urlFilter);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await fetch("/api/invoices");
        const data = await res.json();
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading invoices:", err);
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, []);
  function Option({ value, label }) {
    return (
      <Listbox.Option
        value={value}
        className={({ active, selected }) =>
          `cursor-pointer px-4 py-2 ${
            active ? "bg-blue-50 text-blue-700" : "text-gray-700"
          } ${selected ? "font-semibold" : ""}`
        }
      >
        {label}
      </Listbox.Option>
    );
  }
  function getFilterLabel(filter, last3Months) {
    if (filter === "today") return "Today";
    if (filter === "last7") return "Last 7 Days";
    if (filter === "thismonth") return "This Month";
    if (filter === "lastyear") return "Last Year";
    if (filter === "all") return "All Time";

    const month = last3Months.find((m) => m.value === filter);
    return month?.label || "Select";
  }

  function Divider() {
    return <div className="h-px bg-gray-200 my-1" />;
  }

  // --------------------------
  // FILTRO DE FECHA
  // --------------------------
  function applyFilter(list) {
    const now = new Date();

    return list.filter((i) => {
      const date = new Date(i.createdAt);

      if (filter === "today") return isToday(date);

      if (filter === "last7") {
        const last7 = new Date();
        last7.setDate(now.getDate() - 7);
        return date >= last7 && date <= now;
      }

      if (filter === "thismonth") {
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      }

      // 🟢 MES ESPECÍFICO (January 2026, etc.)
      if (filter.includes("-")) {
        const [year, month] = filter.split("-").map(Number);
        return date.getFullYear() === year && date.getMonth() === month;
      }

      if (filter === "lastyear") {
        return date.getFullYear() === now.getFullYear() - 1;
      }

      return true; // All Time
    });
  }

  const filteredInvoices = applyFilter(invoices);

  // --------------------------
  // BUSCADOR (invoice / cliente)
  // --------------------------
  const searchedInvoices = filteredInvoices.filter((i) => {
    const q = search.toLowerCase();
    return (
      String(i.invoiceNumber).includes(q) ||
      `in-${i.id}`.includes(q) ||
      i.client?.name?.toLowerCase().includes(q)
    );
  });
  // --------------------------
  // SUMMARY CARDS (KANAKKU) - TOTALS $
  // --------------------------

  // TOTAL DE TODAS LAS INVOICES
  const totalInvoices = invoices.reduce(
    (sum, i) => sum + Number(i.total || 0),
    0
  );

  // TOTAL PAGADO
  const paidInvoices = invoices
    .filter((i) => getInvoiceStatus(i) === "Paid")
    .reduce((sum, i) => sum + Number(i.total || 0), 0);

  // TOTAL PENDIENTE (sent + partial)
  const pendingInvoices = invoices
    .filter(
      (i) =>
        getInvoiceStatus(i) === "Sent" ||
        getInvoiceStatus(i) === "Partially Paid"
    )
    .reduce((sum, i) => sum + Number(i.balance || 0), 0);

  // TOTAL VENCIDO
  const overdueInvoices = invoices
    .filter((i) => getInvoiceStatus(i) === "Overdue")
    .reduce((sum, i) => sum + Number(i.balance || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }
  // --------------------------
  // LAST 3 PREVIOUS MONTHS (EXCLUDING CURRENT)
  // --------------------------
  const last3Months = Array.from({ length: 3 }).map((_, index) => {
    const d = new Date();

    // 👇 empezamos desde el mes anterior
    d.setMonth(d.getMonth() - (index + 1));

    return {
      value: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 mt-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Invoices"
            value={`$${totalInvoices.toFixed(2)}`}
            color="bg-white-50 text-blue-700"
          />
          <SummaryCard
            title="Paid Invoices"
            value={`$${paidInvoices.toFixed(2)}`}
            color="bg-white-50 text-blue-700"
          />
          <SummaryCard
            title="Pending Invoices"
            value={`$${pendingInvoices.toFixed(2)}`}
            color="bg-white-50 text-blue-700"
          />
          <SummaryCard
            title="Overdue Invoices"
            value={`$${overdueInvoices.toFixed(2)}`}
            color="bg-white-50 text-blue-700"
          />
        </div>
        {/* HEADER */}
        <div className="flex flex-wrap items-center mt-10 justify-between gap-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Receipt className="text-green-600" /> Invoices
          </h1>

          <div className="flex items-center gap-3">
            <Link href="/invoices/new">
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm shadow">
                <Plus size={16} />
                New Invoice
              </button>
            </Link>

            <Listbox value={filter} onChange={setFilter}>
              <div className="relative">
                <Listbox.Button className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm hover:shadow-md transition text-sm font-medium text-gray-700 min-w-[170px]">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{getFilterLabel(filter, last3Months)}</span>
                  </div>

                  <ChevronDown size={16} className="text-gray-400" />
                </Listbox.Button>

                <Listbox.Options className="absolute z-50 mt-2 w-56 bg-white rounded-xl shadow-lg overflow-hidden text-sm focus:outline-none">
                  {/* FIXED OPTIONS */}
                  <Option value="today" label="Today" />
                  <Option value="last7" label="Last 7 Days" />
                  <Option value="thismonth" label="This Month" />

                  <Divider />

                  {/* MONTHS */}
                  {last3Months.map((m) => (
                    <Option key={m.value} value={m.value} label={m.label} />
                  ))}

                  <Divider />

                  <Option value="lastyear" label="Last Year" />
                  <Option value="all" label="All Time" />
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
        </div>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search by invoice # or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mt-5 md:w-1/3 px-4 py-2 border rounded-md"
        />

        {/* TABLE */}
        <div className="rounded-xl mt-5 border bg-white shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-sm text-gray-600 text-left">
                <th className="px-6 py-3">Invoice #</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Invoice Total</th>
                <th className="px-6 py-3">Payments</th>
                <th className="px-6 py-3">Balance</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {searchedInvoices.length > 0 ? (
                searchedInvoices.map((i) => {
                  const status = getInvoiceStatus(i);

                  return (
                    <tr
                      key={i.id}
                      onClick={() => router.push(`/invoices/${i.id}`)}
                      className="border-t text-sm hover:bg-blue-50 cursor-pointer transition"
                    >
                      <td className="px-6 py-3">
                        {i.invoiceNumber ?? `IN-${i.id}`}
                      </td>

                      <td className="px-6 py-3">
                        {i.client?.name || "No Client"}
                      </td>

                      <td className="px-6 py-3">
                        {new Date(i.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-3">
                        ${Number(i.total || 0).toFixed(2)}
                      </td>

                      <td className="px-6 py-3">
                        ${Number(i.paymentsTotal || 0).toFixed(2)}
                      </td>

                      <td
                        className={`px-6 py-3 font-bold text-[12pt] ${
                          i.balance > 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        ${Number(i.balance || 0).toFixed(2)}
                      </td>

                      <td className="px-6 py-3">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-400">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
// --------------------------
// SUMMARY CARD
// --------------------------
function SummaryCard({ title, value, color }) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

// --------------------------
// STATUS BADGE
// --------------------------
function StatusBadge({ status }) {
  const colors = {
    Draft: "bg-gray-100 text-gray-600",
    Sent: "bg-blue-100 text-blue-700",
    "Partially Paid": "bg-yellow-100 text-yellow-700",
    Paid: "bg-green-100 text-green-700",
    Overdue: "bg-red-100 text-red-700",
    Void: "bg-gray-300 text-gray-700",
  };

  return (
    <span
      className={`px-3 py-1  text-xs font-semibold ${
        colors[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

// --------------------------
// DATE HELPERS
// --------------------------
function isToday(date) {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isThisWeek(date) {
  const now = new Date();
  const start = new Date(now.setDate(now.getDate() - now.getDay()));
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}
