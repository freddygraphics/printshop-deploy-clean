"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateQuoteButton({ requestId, disabled = false }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateQuote() {
    if (loading || disabled) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/quote-requests/${requestId}/create-quote`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create quote.");
      }

      router.push(`/quotes/${data.quote.id}`);
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to create quote.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCreateQuote}
        disabled={loading || disabled}
        className="w-full rounded-lg bg-[#1D2959] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#162044] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Creating Quote..."
          : disabled
            ? "Quote Already Created"
            : "Create Quote"}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
