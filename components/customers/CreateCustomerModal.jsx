"use client";

import { useState, useEffect } from "react";
function formatPhoneNumber(value) {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 10);

  if (digits.length === 0) return "";

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
export default function CreateCustomerModal({
  open,
  onClose,
  onCreated,
  customer,
  isEdit,
}) {
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

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        company: customer.company || "",
        email: customer.email || "",
        phone: formatPhoneNumber(customer.phone || ""),
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        zip: customer.zip || "",
        country: customer.country || "",
      });
    } else {
      // reset si es nuevo
      setForm({
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
    }
  }, [customer]);

  const [loading, setLoading] = useState(false);

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      alert("Customer name is required");
      return;
    }

    setLoading(true);

    try {
      let res;

      if (isEdit) {
        res = await fetch(`/api/clients/${customer.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Error");
        return;
      }

      onCreated(data);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Customer" : "New Customer"}
          </h2>

          {/* BOTÓN CERRAR */}
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
                Email
              </label>
              <input
                type="email"
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
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={14}
                value={form.phone}
                onChange={(e) =>
                  update("phone", formatPhoneNumber(e.target.value))
                }
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
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                className="mt-1 w-full border rounded-lg px-4 py-2.5 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">ZIP</label>
              <input
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
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save Changes"
                : "Create Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}
