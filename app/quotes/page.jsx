"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Loader2, Calendar, Search, X } from "lucide-react";

export default function QuotesPage() {
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter") || "month";

  const [filter, setFilter] = useState(urlFilter);
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState([]);

  // CUSTOMER SEARCH
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    async function loadQuotes() {
      try {
        const res = await fetch("/api/quotes");
        const data = await res.json();
        setQuotes(data);
      } catch (err) {
        console.error("Error loading quotes:", err);
      }
      setLoading(false);
    }
    loadQuotes();
  }, []);

  // AUTOCOMPLETE SEARCH — IMPORTANT: STILL CALLS `/api/clients/search`
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (customerSearch.length < 2) {
        setCustomerResults([]);
        return;
      }

      console.log("Searching:", customerSearch);

      const res = await fetch(`/api/clients/search?q=${customerSearch}`);
      const data = await res.json();

      setCustomerResults(Array.isArray(data) ? data : []);
    }, 300);

    return () => clearTimeout(delay);
  }, [customerSearch]);

  // DATE FILTER
  function applyFilter(list) {
    const now = new Date();
    return list.filter((item) => {
      const date = new Date(item.createdAt);
      switch (filter) {
        case "today":
          return isToday(date);
        case "week":
          return isThisWeek(date);
        case "month":
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        case "year":
          return date.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }

  const dateFiltered = applyFilter(quotes);

  const customerFiltered = dateFiltered.filter((q) => {
    if (!selectedCustomer) return true;
    return q.client?.id === selectedCustomer.id;
  });

  const totalAmount = customerFiltered.reduce(
    (acc, q) => acc + (q.total || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <FileText className="text-blue-500" /> Quotes
        </h1>

        {/* DATE FILTER */}
        <div className="flex items-center gap-2 bg-white border rounded-lg shadow-sm px-3 py-2">
          <Calendar className="text-gray-500" size={20} />
          <select
            className="text-sm bg-transparent focus:outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* CUSTOMER SEARCH INPUT */}
      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-2 bg-white border rounded-lg shadow-sm px-3 py-2">
          <Search className="text-gray-400" size={18} />

          <input
            type="text"
            className="text-sm bg-transparent focus:outline-none w-full"
            placeholder="Search customer..."
            value={selectedCustomer ? selectedCustomer.name : customerSearch}
            onChange={(e) => {
              setSelectedCustomer(null);
              setCustomerSearch(e.target.value);
            }}
          />

          {selectedCustomer && (
            <button
              onClick={() => {
                setSelectedCustomer(null);
                setCustomerSearch("");
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* AUTOCOMPLETE RESULTS */}
        {customerResults.length > 0 && !selectedCustomer && (
          <div className="absolute w-full bg-white border rounded-xl shadow-lg mt-2 max-h-64 overflow-y-auto z-50">
            {customerResults.map((c) => (
              <div
                key={c.id}
                className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b"
                onClick={() => {
                  setSelectedCustomer(c);
                  setCustomerResults([]);
                  setCustomerSearch("");
                }}
              >
                <p className="font-semibold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-500">{c.company || ""}</p>
                <p className="text-xs text-gray-500">{c.phone || ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUOTES TABLE */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-600">
              <th className="px-6 py-3">Quote #</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Total</th>
            </tr>
          </thead>

          <tbody>
            {customerFiltered.length > 0 ? (
              customerFiltered.map((q) => (
                <tr
                  key={q.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => (window.location.href = `/quotes/${q.id}`)}
                >
                  <td className="px-6 py-3 font-medium">{q.quoteNumber}</td>
                  <td className="px-6 py-3">{q.client?.name}</td>
                  <td className="px-6 py-3">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 font-semibold text-blue-600">
                    ${q.total.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-6 text-gray-400">
                  No quotes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// HELPERS
function isToday(d) {
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth();
}
function isThisWeek(date) {
  const now = new Date();
  const start = new Date(now.setDate(now.getDate() - now.getDay()));
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}
