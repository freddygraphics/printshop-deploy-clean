"use client";

import { useEffect, useState } from "react";
import CreateCustomerModal from "@/components/customers/CreateCustomerModal";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

export default function CustomersPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 15;
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  // 🔑 ESTADO DEL MODAL (ESTO FALTABA)
  const [openModal, setOpenModal] = useState(false);
  const router = useRouter();
  // 🔑 FUNCIÓN PARA CARGAR CLIENTES (ESTO FALTABA)
  async function loadClients() {
    try {
      setLoading(true);

      const res = await fetch("/api/clients", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Error from /api/clients:", data);
        setClients([]);
        return;
      }

      if (!Array.isArray(data)) {
        console.error("Invalid clients response:", data);
        setClients([]);
        return;
      }

      setClients(data);
    } catch (err) {
      console.error("Error loading clients:", err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  if (loading) {
    return <div className="p-6">Loading customers…</div>;
  }
  function getStatusBadge(status) {
    switch (status) {
      case "paid":
        return <span className="badge badge-success badge-sm">Paid</span>;

      case "issued":
        return <span className="badge badge-info badge-sm">Issued</span>;

      case "void":
        return <span className="badge badge-ghost badge-sm">Void</span>;

      case "partial":
        return <span className="badge badge-warning badge-sm">Partial</span>;

      default:
        return <span className="badge badge-ghost badge-sm">{status}</span>;
    }
  }

  const filteredClients = (Array.isArray(clients) ? clients : []).filter(
    (c) => {
      const q = search.toLowerCase();

      return (
        c.name?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      );
    },
  );

  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

  const startIndex = (currentPage - 1) * clientsPerPage;
  const endIndex = startIndex + clientsPerPage;

  const paginatedClients = filteredClients.slice(startIndex, endIndex);
  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto p-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Customers</h1>

          <button
            onClick={() => setOpenModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm shadow"
          >
            + New Customer
          </button>
        </div>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search by name, phone or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 mt-5 px-4 py-2 border rounded-md"
        />

        {/* TABLE */}
        {filteredClients.length === 0 ? (
          <div className="text-gray-500 mt-4">No customers found.</div>
        ) : (
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden mt-5">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-sm text-gray-600 text-left">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedClients.map((c) => (
                  <tr
                    onClick={() => router.push(`/customers/${c.id}`)}
                    key={c.id}
                    className="border-t text-sm font-medium hover:bg-blue-50 cursor-pointer transition"
                  >
                    <td className="px-6 py-3">{c.name}</td>

                    <td className="px-6 py-3 text-gray-600">
                      {c.company || "—"}
                    </td>

                    <td className="px-6 py-3 text-gray-600">
                      {c.email || "—"}
                    </td>

                    <td className="px-6 py-3 text-gray-600">
                      {c.phone || "—"}
                    </td>

                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        {/* EDIT */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(c);
                            setEditOpen(true);
                          }}
                          className="text-gray-500 hover:text-blue-600"
                        >
                          <Pencil size={16} />
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();

                            if (!confirm("Delete this customer?")) return;

                            await fetch(`/api/clients/${c.id}`, {
                              method: "DELETE",
                            });

                            loadClients();
                          }}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredClients.length)} of{" "}
                  {filteredClients.length} customers
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(page - 1, 1))
                    }
                    className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-3 text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(page + 1, totalPages))
                    }
                    className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateCustomerModal
        open={openModal || editOpen}
        onClose={() => {
          setOpenModal(false);
          setEditOpen(false);
          setSelectedCustomer(null);
        }}
        onCreated={loadClients}
        customer={selectedCustomer}
        isEdit={editOpen}
      />
    </div>
  );
}
