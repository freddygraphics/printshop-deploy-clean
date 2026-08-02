"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";

import { useRouter } from "next/navigation";
import { getInvoiceStatus } from "@/lib/invoiceStatus";

import DocumentListPage, {
  DocumentStatusBadge,
} from "@/components/documents/DocumentListPage";

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter") || "thismonth";

  const [filter, setFilter] = useState(urlFilter);

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await fetch("/api/invoices");
        const data = await res.json();
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading invoices:", err);
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, []);

  function getFilterLabel(filter, last3Months) {
    if (filter === "today") return "Today";
    if (filter === "last7") return "Last 7 Days";
    if (filter === "thismonth") return "This Month";
    if (filter === "lastyear") return "Last Year";
    if (filter === "all") return "All Time";

    const month = last3Months.find((m) => m.value === filter);
    return month?.label || "Select";
  }

  // --------------------------
  // FILTRO DE FECHA
  // --------------------------
  function applyFilter(list) {
    const now = new Date();

    return list.filter((i) => {
      const invoiceDate = new Date(i.issuedAt || i.createdAt);

      const invoiceYear = invoiceDate.getUTCFullYear();
      const invoiceMonth = invoiceDate.getUTCMonth();

      if (filter === "today") {
        return isToday(invoiceDate);
      }

      if (filter === "last7") {
        const last7 = new Date();
        last7.setDate(now.getDate() - 7);

        return invoiceDate >= last7 && invoiceDate <= now;
      }
      if (filter === "thismonth") {
        return (
          invoiceMonth === now.getUTCMonth() &&
          invoiceYear === now.getUTCFullYear()
        );
      }

      // 🟢 MES ESPECÍFICO (January 2026, etc.)
      if (filter.includes("-")) {
        const [year, month] = filter.split("-").map(Number);

        return invoiceYear === year && invoiceMonth === month;
      }
      if (filter === "lastyear") {
        return invoiceYear === now.getUTCFullYear() - 1;
      }

      return true; // All Time
    });
  }
  console.log("FILTER:", filter);
  const filteredInvoices = applyFilter(invoices);

  // --------------------------
  // BUSCADOR (invoice / cliente)
  // --------------------------
  const statusFilteredInvoices = filteredInvoices.filter((i) => {
    const status = getInvoiceStatus(i);

    switch (statusFilter) {
      case "ACTIVE":
        return status !== "Void";

      case "PAID":
        return status === "Paid";

      case "PARTIALLY PAID":
        return status === "Partially Paid";

      case "ISSUED":
        return status === "Issued";

      case "VOID":
        return status === "Void";

      default:
        return true;
    }
  });
  const searchedInvoices = statusFilteredInvoices.filter((i) => {
    const q = search.toLowerCase();

    return (
      String(i.invoiceNumber).includes(q) ||
      `in-${i.id}`.includes(q) ||
      i.client?.name?.toLowerCase().includes(q) ||
      i.client?.company?.toLowerCase().includes(q)
    );
  });
  const cardSource = searchedInvoices;

  // 🔥 STATS CALCULADAS EN FRONTEND
  const validInvoices = cardSource.filter(
    (i) => getInvoiceStatus(i) !== "Void",
  );

  const total = validInvoices.reduce(
    (sum, i) => sum + Number(i.invoiceTotal || 0),
    0,
  );

  const paid = validInvoices
    .filter((i) => Number(i.balance) === 0)
    .reduce((sum, i) => sum + Number(i.invoiceTotal || 0), 0);

  const pending = validInvoices
    .filter((i) => Number(i.balance) > 0)
    .reduce((sum, i) => sum + Number(i.balance || 0), 0);

  const today = new Date();

  // fuerza a solo fecha (sin hora)
  today.setHours(0, 0, 0, 0);

  const overdue = validInvoices
    .filter((i) => {
      if (!i.dueDate) return false;

      const due = new Date(i.dueDate);
      due.setHours(0, 0, 0, 0);

      return Number(i.balance) > 0 && due < today;
    })
    .reduce((sum, i) => sum + Number(i.balance || 0), 0);
  // --------------------------
  // SUMMARY CARDS (KANAKKU) - TOTALS $
  // --------------------------

  // --------------------------
  // LAST 3 PREVIOUS MONTHS (EXCLUDING CURRENT)
  // --------------------------
  const last3Months = Array.from({ length: 3 }).map((_, index) => {
    const d = new Date();

    // 👇 empezamos desde el mes anterior
    d.setMonth(d.getMonth() - (index + 1));

    return {
      value: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
  });
  const statusTabs = [
    {
      label: "ALL",
      count: filteredInvoices.length,
    },
    {
      label: "ACTIVE",
      count: filteredInvoices.filter((i) => getInvoiceStatus(i) !== "Void")
        .length,
    },
    {
      label: "PAID",
      count: filteredInvoices.filter((i) => getInvoiceStatus(i) === "Paid")
        .length,
    },
    {
      label: "PARTIALLY PAID",
      count: filteredInvoices.filter(
        (i) => getInvoiceStatus(i) === "Partially Paid",
      ).length,
    },
    {
      label: "ISSUED",
      count: filteredInvoices.filter((i) => getInvoiceStatus(i) === "Issued")
        .length,
    },
    {
      label: "VOID",
      count: filteredInvoices.filter((i) => getInvoiceStatus(i) === "Void")
        .length,
    },
  ];

  return (
    <DocumentListPage
      title="Invoices"
      icon={Receipt}
      iconClassName="text-green-600"
      summaryCards={[
        {
          key: "total",
          title: "Total Invoices",
          value: formatCurrency(total),
        },
        {
          key: "paid",
          title: "Paid Invoices",
          value: formatCurrency(paid),
        },
        {
          key: "pending",
          title: "Pending Invoices",
          value: formatCurrency(pending),
        },
        {
          key: "overdue",
          title: "Overdue Invoices",
          value: formatCurrency(overdue),
        },
      ]}
      createHref="/invoices/new"
      createLabel="New Invoice"
      filter={filter}
      onFilterChange={setFilter}
      filterLabel={getFilterLabel(filter, last3Months)}
      filterOptions={[
        {
          value: "today",
          label: "Today",
        },
        {
          value: "last7",
          label: "Last 7 Days",
        },
        {
          value: "thismonth",
          label: "This Month",
        },
        {
          value: "lastyear",
          label: "Last Year",
          dividerBefore: true,
        },
        {
          value: "all",
          label: "All Time",
        },
      ]}
      previousMonths={last3Months}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by invoice # or customer..."
      tabs={statusTabs.map((tab) => ({
        value: tab.label,
        label: tab.label,
        count: tab.count,
      }))}
      activeTab={statusFilter}
      onTabChange={setStatusFilter}
      columns={[
        {
          key: "invoiceNumber",
          label: "Invoice #",
          render: (invoice) => invoice.invoiceNumber ?? `IN-${invoice.id}`,
        },
        {
          key: "customer",
          label: "Customer",
          render: (invoice) => invoice.client?.name || "No Client",
        },
        {
          key: "company",
          label: "Company",
          className: "px-6 py-3 text-gray-600",
          render: (invoice) => invoice.client?.company || "—",
        },
        {
          key: "date",
          label: "Date",
          render: (invoice) =>
            new Date(
              invoice.issuedAt || invoice.createdAt,
            ).toLocaleDateString(),
        },
        {
          key: "total",
          label: "Invoice Total",
          render: (invoice) => formatCurrency(invoice.invoiceTotal),
        },
        {
          key: "payments",
          label: "Payments",
          render: (invoice) => formatCurrency(invoice.paymentsTotal),
        },
        {
          key: "balance",
          label: "Balance",
          render: (invoice) => formatCurrency(invoice.balance),
        },
        {
          key: "status",
          label: "Status",
          render: (invoice) => (
            <DocumentStatusBadge status={getInvoiceStatus(invoice)} />
          ),
        },
      ]}
      rows={searchedInvoices}
      onRowClick={(invoice) => {
        router.push(`/invoices/${invoice.id}`);
      }}
      emptyMessage="No invoices found."
    />
  );
}
// --------------------------
// DATE HELPERS
// --------------------------
function isToday(date) {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isThisWeek(date) {
  const now = new Date();
  const start = new Date(now.setDate(now.getDate() - now.getDay()));
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}
