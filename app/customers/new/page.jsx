"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCustomerPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    notes: "",
  });

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const saveCustomer = async () => {
    if (!form.name.trim()) {
      alert("Customer name is required");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      router.push("/customers");
    } catch {
      alert("Error creating customer");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">New Customer</h1>
        <p className="text-sm text-gray-500">Create a new customer record</p>
      </div>

      {/* FORM CARD */}
      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
        {/* NAME */}
        <div>
          <label className="text-sm font-medium">Customer Name *</label>
          <input
            className="mt-1 border rounded-lg px-4 py-2.5 w-full"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="John Doe"
          />
        </div>

        {/* COMPANY */}
        <div>
          <label className="text-sm font-medium">Company</label>
          <input
            className="mt-1 border rounded-lg px-4 py-2.5 w-full"
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Business name"
          />
        </div>

        {/* EMAIL */}
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            className="mt-1 border rounded-lg px-4 py-2.5 w-full"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="email@company.com"
          />
        </div>

        {/* PHONE */}
        <div>
          <label className="text-sm font-medium">Phone</label>
          <input
            className="mt-1 border rounded-lg px-4 py-2.5 w-full"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>

        {/* NOTES */}
        <div>
          <label className="text-sm font-medium">Internal Notes</label>
          <textarea
            className="mt-1 border rounded-lg px-4 py-2.5 w-full min-h-[120px]"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Notes about this customer…"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => router.push("/customers")}
            className="px-5 py-2 rounded-lg border text-gray-700"
          >
            Cancel
          </button>

          <button
            onClick={saveCustomer}
            disabled={isSaving}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Create Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}
