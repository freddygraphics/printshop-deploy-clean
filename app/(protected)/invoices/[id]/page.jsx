import InvoiceEditor from "@/components/InvoiceEditor";

export default function InvoicePage({ params }) {
  return <InvoiceEditor mode="edit" invoiceId={params.id} />;
}
