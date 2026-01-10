"use client";

import { useState } from "react";

export default function CreateCustomerModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  const [loading, setLoading] = useState(false);

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleCreate = async () => {
    // ✅ VALIDACIÓN OBLIGATORIA (OPCIÓN A)
    if (!form.name.trim() || !form.email.trim()) {
      alert("Customer name and email are required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          company: form.company || null,
          email: form.email,
          phone: form.phone || null,
          address: form.address || null,
          city: form.city || null,
          state: form.state || null,
          zip: form.zip || null,
          country: form.country || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Error creating customer");
        return;
      }

      onCreated(); // 🔄 refresca lista
    } catch (err) {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">New Customer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 py-6 space-y-6">
          {/* IDENTITY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500">
                Customer Name *
              </label>
              <input
                required
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="mt-1 w-full border rounded-lg px-4 py-2.5 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">
                Company
              </label>
              <input
                placeholder="ABC Printing LLC"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                className="mt-1 w-full border rounded-lg px-4 py-2.5 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* CONTACT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500">
                Email *
              </label>
              <input
                type="email"
                required
                placeholder="john@company.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="mt-1 w-full border rounded-lg px-4 py-2.5 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">
                Phone
              </label>
              <input
                placeholder="(555) 123-4567"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="mt-1 w-full border rounded-lg px-4 py-2.5 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* ADDRESS */}
          <div>
            <label className="text-xs font-semibold text-gray-500">
              Address
            </label>
            <input
              placeholder="123 Main Street"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className="mt-1 w-full border rounded-lg px-4 py-2.5 placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500">
                City
              </label>
              <input
                placeholder="Newark"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className="mt-1 w-full border rounded-lg px-4 py-2.5 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">
                State
              </label>
              <input
                placeholder="NJ"
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                className="mt-1 w-full border rounded-lg px-4 py-2.5 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">ZIP</label>
              <input
                placeholder="07102"
                value={form.zip}
                onChange={(e) => update("zip", e.target.value)}
                className="mt-1 w-full border rounded-lg px-4 py-2.5 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">
                Country
              </label>
              <input
                placeholder="United States"
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
                className="mt-1 w-full border rounded-lg px-4 py-2.5 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-gray-700"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}
