"use client";
export const dynamic = "force-dynamic";
import { useParams } from "next/navigation";
import QuoteEditor from "@/components/QuoteEditor";

export default function EditQuotePage() {
  const { id } = useParams();
  return <QuoteEditor mode="edit" quoteId={id} />;
}
