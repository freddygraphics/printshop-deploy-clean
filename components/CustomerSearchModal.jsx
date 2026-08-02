"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";
import CreateCustomerModal from "@/components/customers/CreateCustomerModal";

export default function CustomerSearchModal({ onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);

  useEffect(() => {
    const cleanSearch = search.trim();

    if (cleanSearch.length < 2) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const delay = setTimeout(async () => {
      setLoading(true);

      try {
        const res = await fetch(
          `/api/clients?search=${encodeURIComponent(cleanSearch)}`,
          {
            signal: controller.signal,
          },
        );

        const data = await res.json();

        setCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error("Error searching customers:", error);
          setCustomers([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(delay);
      controller.abort();
    };
  }, [search]);

  const handleCreatedCustomer = (newCustomer) => {
    setShowCreateCustomer(false);

    if (!newCustomer?.id) return;

    onSelect(newCustomer);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold">Select Customer</h2>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* SEARCH */}
          <div className="p-5">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                autoFocus
                type="text"
                placeholder="Search customer by name or company..."
                className="w-full rounded-lg border-2 border-gray-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-600"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {/* RESULTS */}
          <div className="max-h-72 overflow-y-auto border-t">
            {loading && <p className="p-6 text-sm text-gray-500">Searching…</p>}

            {!loading && search.trim().length < 2 && (
              <p className="p-6 text-sm text-gray-500">
                Type at least 2 characters to search
              </p>
            )}

            {!loading &&
              search.trim().length >= 2 &&
              customers.length === 0 && (
                <p className="p-6 text-sm text-gray-500">No customers found</p>
              )}

            {!loading &&
              customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    onSelect(customer);
                    onClose();
                  }}
                  className="block w-full border-b px-6 py-4 text-left transition hover:bg-blue-50"
                >
                  <span className="block text-[15px] font-semibold text-gray-800">
                    {customer.name}
                  </span>

                  <span className="block text-sm text-gray-500">
                    {customer.company || "Individual customer"}
                  </span>
                </button>
              ))}
          </div>

          {/* FOOTER */}
          <div className="border-t bg-gray-50 p-5">
            <button
              type="button"
              onClick={() => setShowCreateCustomer(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
            >
              <UserPlus size={18} />
              Add New Customer
            </button>
          </div>
        </div>
      </div>

      <CreateCustomerModal
        open={showCreateCustomer}
        customer={null}
        isEdit={false}
        onClose={() => setShowCreateCustomer(false)}
        onCreated={handleCreatedCustomer}
      />
    </>
  );
}
