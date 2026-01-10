"use client";
export const dynamic = "force-dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import CreateCustomerModal from "@/components/customers/CreateCustomerModal";

const PAGE_SIZE = 50; // ← MOSTRAR 50 POR PÁGINA

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterQuotes, setFilterQuotes] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // --------------------------------------------------
  // 🔄 RECARGAR CUSTOMERS (USADO POR LISTA + MODAL)
  // --------------------------------------------------
  const reloadCustomers = async () => {
    try {
      setLoading(true);

      const query = search.trim()
        ? `?search=${encodeURIComponent(search)}`
        : "";

      const res = await fetch(`/api/clients${query}`);
      const data = await res.json();

      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error loading customers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar Customers
  useEffect(() => {
    reloadCustomers();
  }, [search]);

  // --------------------------------------------------
  // STATS (KANAKKU STYLE)
  // --------------------------------------------------
  const stats = useMemo(() => {
    const total = customers.length;
    const withQuotes = customers.filter((c) => c._count?.quotes > 0).length;
    const withInvoices = customers.filter((c) => c._count?.invoices > 0).length;

    const last30 = customers.filter((c) => {
      const created = new Date(c.createdAt).getTime();
      return Date.now() - created <= 30 * 86400000;
    }).length;

    return { total, withQuotes, withInvoices, last30 };
  }, [customers]);

  // --------------------------------------------------
  // FILTROS
  // --------------------------------------------------
  const filtered = useMemo(() => {
    let result = [...customers];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        [c.name, c.company, c.email, c.phone]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(q))
      );
    }

    if (filterQuotes === "with") {
      result = result.filter((c) => c._count?.quotes > 0);
    } else if (filterQuotes === "without") {
      result = result.filter((c) => !c._count || c._count.quotes === 0);
    }

    return result;
  }, [customers, search, filterQuotes]);

  // --------------------------------------------------
  // PAGINACIÓN
  // --------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  // ==================================================
  // RENDER
  // ==================================================
  return (
    <>
      <main className="min-h-screen bg-[#F5F7FB] flex justify-center py-10 px-4">
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-10 border border-gray-200">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-10">
            <Link
              href="/"
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft size={18} className="mr-1" />
              Back to Dashboard
            </Link>

            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
              Customers
            </h1>

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              + New Customer
            </button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            <StatCard label="Total Customers" value={stats.total} />
            <StatCard label="With Quotes" value={stats.withQuotes} />
            <StatCard label="With Invoices" value={stats.withInvoices} />
            <StatCard label="New (30 days)" value={stats.last30} />
          </div>

          {/* SEARCH + FILTER */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full border rounded-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Quotes:</span>

              <select
                value={filterQuotes}
                onChange={(e) => {
                  setFilterQuotes(e.target.value);
                  setPage(1);
                }}
                className="border rounded-lg px-3 py-2 shadow-sm"
              >
                <option value="all">All</option>
                <option value="with">With Quotes</option>
                <option value="without">Without Quotes</option>
              </select>
            </div>
          </div>

          {/* TABLE */}
          <div className="border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Company</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Quotes</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-500">
                      Loading customers...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-500">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t hover:bg-gray-50 transition cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/customers/${c.id}`)
                      }
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {c.company || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.email}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {c._count?.quotes ?? 0}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between mt-6 text-sm text-gray-700">
              <p>
                Page <span className="font-semibold">{currentPage}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border shadow-sm"
                >
                  Previous
                </button>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ✅ MODAL */}
      {showCreateModal && (
        <CreateCustomerModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            reloadCustomers();
          }}
        />
      )}
    </>
  );
}

// --------------------------------------------------
// STAT CARD
// --------------------------------------------------
function StatCard({ label, value }) {
  return (
    <div className="bg-white shadow-md border rounded-xl p-4">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  );
}
