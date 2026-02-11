"use client";
export const dynamic = "force-dynamic";

import InvoiceEditor from "@/components/InvoiceEditor";

export default function InvoicePage({ params }) {
  return <InvoiceEditor mode="edit" invoiceId={Number(params.id)} />;
}
