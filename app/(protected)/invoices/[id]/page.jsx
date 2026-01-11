import InvoiceEditor from "@/components/InvoiceEditor";

export default function InvoicePage({ params }) {
  return <InvoiceEditor invoiceId={params.id} />;
}
