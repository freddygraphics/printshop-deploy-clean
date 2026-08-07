"use client";

export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import QuoteEditor from "@/components/QuoteEditor";

export default function EditQuotePage() {
  const params = useParams();
  const quoteId = Number(params?.id);

  if (!Number.isInteger(quoteId) || quoteId <= 0) {
    return (
      <main className="p-8">
        <p className="text-red-600">Invalid quote id.</p>
      </main>
    );
  }

  return <QuoteEditor mode="edit" quoteId={quoteId} />;
}
