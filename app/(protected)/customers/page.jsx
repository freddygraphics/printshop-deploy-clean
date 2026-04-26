"use client";

import { useEffect, useState } from "react";
import CreateCustomerModal from "@/components/customers/CreateCustomerModal";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

export default function CustomersPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  // 🔑 ESTADO DEL MODAL (ESTO FALTABA)
  const [openModal, setOpenModal] = useState(false);
  const router = useRouter();
  // 🔑 FUNCIÓN PARA CARGAR CLIENTES (ESTO FALTABA)
  async function loadClients() {
    try {
      setLoading(true);
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error("Error loading clients:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

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

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();

    return (
      c.name?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });
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
                {filteredClients.map((c) => (
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
