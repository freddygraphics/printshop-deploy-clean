"use client";

import { useEffect, useState } from "react";
import CreateCustomerModal from "@/components/customers/CreateCustomerModal";

export default function CustomersPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔑 ESTADO DEL MODAL (ESTO FALTABA)
  const [openModal, setOpenModal] = useState(false);

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Customers</h1>

        <button className="btn btn-primary" onClick={() => setOpenModal(true)}>
          + New Customer
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="text-gray-500">No customers found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Quotes</th>
                <th>Invoices</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.company || "-"}</td>
                  <td>{c.email || "-"}</td>
                  <td>{c.phone || "-"}</td>
                  <td>{c._count?.quotes ?? 0}</td>
                  <td>{c._count?.invoices ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ MODAL VA AQUÍ, FUERA DE LA TABLA */}
      <CreateCustomerModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={loadClients}
      />
    </div>
  );
}
