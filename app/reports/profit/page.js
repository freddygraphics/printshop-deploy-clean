"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getInvoiceStatus } from "@/lib/invoiceStatus";
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Receipt,
  TrendingUp,
} from "lucide-react";

import { formatCurrency } from "@/lib/formatCurrency";

import DocumentListPage from "@/components/documents/DocumentListPage";

export default function ProfitReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlFilter = searchParams.get("filter") || "thismonth";

  const [filter, setFilter] = useState(urlFilter);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfitReport() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/reports/profit", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.details || result.error || "Unable to load profit report",
          );
        }

        setInvoices(Array.isArray(result.invoices) ? result.invoices : []);
      } catch (err) {
        console.error("Error loading profit report:", err);

        setError(
          err instanceof Error ? err.message : "Unable to load profit report",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfitReport();
  }, []);

  // --------------------------------------------------
  // ÚLTIMOS 3 MESES, SIN INCLUIR EL MES ACTUAL
  // --------------------------------------------------
  const last3Months = Array.from({ length: 3 }).map((_, index) => {
    const date = new Date();

    date.setMonth(date.getMonth() - (index + 1));

    return {
      value: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
  });

  // --------------------------------------------------
  // FILTRO DE FECHA
  // --------------------------------------------------
  const dateFilteredInvoices = useMemo(() => {
    const now = new Date();

    const validInvoices = invoices.filter(
      (invoice) =>
        getInvoiceStatus(invoice) !== "Void" &&
        Number(invoice.balance || 0) <= 0.01,
    );

    return validInvoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.issuedAt || invoice.createdAt);

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

      // Mes específico: 2026-6, 2026-7, etc.
      if (filter.includes("-")) {
        const [year, month] = filter.split("-").map(Number);

        return invoiceYear === year && invoiceMonth === month;
      }

      if (filter === "lastyear") {
        return invoiceYear === now.getUTCFullYear() - 1;
      }

      // All Time
      return true;
    });
  }, [invoices, filter]);

  // --------------------------------------------------
  // FILTRO POR ESTADO DE COSTOS
  // --------------------------------------------------
  const statusFilteredInvoices = useMemo(() => {
    return dateFilteredInvoices.filter((invoice) => {
      if (statusFilter === "COMPLETED") {
        return invoice.costsCompleted;
      }

      if (statusFilter === "PENDING") {
        return !invoice.costsCompleted;
      }

      return true;
    });
  }, [dateFilteredInvoices, statusFilter]);

  // --------------------------------------------------
  // BUSCADOR
  // --------------------------------------------------
  const searchedInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return statusFilteredInvoices;
    }

    return statusFilteredInvoices.filter((invoice) => {
      const invoiceNumber = String(
        invoice.invoiceNumber || invoice.id || "",
      ).toLowerCase();

      const customerName = String(invoice.client?.name || "").toLowerCase();

      const companyName = String(invoice.client?.company || "").toLowerCase();

      return (
        invoiceNumber.includes(query) ||
        `in-${invoice.id}`.includes(query) ||
        customerName.includes(query) ||
        companyName.includes(query)
      );
    });
  }, [statusFilteredInvoices, search]);

  // --------------------------------------------------
  // RESUMEN DEL PERÍODO SELECCIONADO
  // Solo invoices con todos los costos completados
  // --------------------------------------------------
  const completedInvoices = dateFilteredInvoices.filter(
    (invoice) => invoice.costsCompleted,
  );

  const pendingInvoices = dateFilteredInvoices.filter(
    (invoice) => !invoice.costsCompleted,
  );

  const completedSales = completedInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.subtotal || 0),
    0,
  );

  const productionCost = completedInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.totalCost || 0),
    0,
  );

  const grossProfit = completedSales - productionCost;

  const profitMargin =
    completedSales > 0 ? (grossProfit / completedSales) * 100 : 0;

  // --------------------------------------------------
  // TABS
  // --------------------------------------------------
  const statusTabs = [
    {
      value: "ALL",
      label: "ALL",
      count: dateFilteredInvoices.length,
    },
    {
      value: "COMPLETED",
      label: "COMPLETED",
      count: completedInvoices.length,
    },
    {
      value: "PENDING",
      label: "PENDING",
      count: pendingInvoices.length,
    },
  ];

  return (
    <>
      {error && (
        <div className="mx-6 mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-medium">Unable to load the profit report</p>

            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <DocumentListPage
        title="Profit Report"
        icon={TrendingUp}
        iconClassName="text-emerald-600"
        loading={loading}
        summaryCards={[
          {
            key: "sales",
            title: "Completed Sales",
            value: formatCurrency(completedSales),
            subtitle: `${completedInvoices.length} invoices with costs`,
            icon: Receipt,
          },
          {
            key: "cost",
            title: "Production Cost",
            value: formatCurrency(productionCost),
            subtitle: "Costs entered",
            icon: DollarSign,
          },
          {
            key: "profit",
            title: "Gross Profit",
            value: formatCurrency(grossProfit),
            subtitle: "Sales minus production cost",
            icon: TrendingUp,
          },
          {
            key: "margin",
            title: "Profit Margin",
            value: `${profitMargin.toFixed(2)}%`,
            subtitle: `${pendingInvoices.length} invoices pending`,
            icon: CheckCircle2,
          },
        ]}
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
        tabs={statusTabs}
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
            render: (invoice) => invoice.client?.name || "No Customer",
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
            key: "sales",
            label: "Sales",
            render: (invoice) => formatCurrency(invoice.subtotal),
          },
          {
            key: "cost",
            label: "Cost",
            render: (invoice) =>
              invoice.costsCompleted ? formatCurrency(invoice.totalCost) : "—",
          },
          {
            key: "profit",
            label: "Profit",
            render: (invoice) =>
              invoice.costsCompleted ? formatCurrency(invoice.profit) : "—",
          },
          {
            key: "margin",
            label: "Margin",
            render: (invoice) =>
              invoice.costsCompleted
                ? `${Number(invoice.profitMargin || 0).toFixed(2)}%`
                : "—",
          },
          {
            key: "status",
            label: "Cost Status",
            render: (invoice) =>
              invoice.costsCompleted ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {invoice.pendingItems || 0} pending
                </span>
              ),
          },
        ]}
        rows={searchedInvoices}
        onRowClick={(invoice) => {
          router.push(`/reports/profit/${invoice.id}`);
        }}
        emptyMessage="No invoices found for this period."
      />
    </>
  );
}

// --------------------------------------------------
// ETIQUETA DEL FILTRO
// --------------------------------------------------
function getFilterLabel(filter, last3Months) {
  if (filter === "today") return "Today";
  if (filter === "last7") return "Last 7 Days";
  if (filter === "thismonth") return "This Month";
  if (filter === "lastyear") return "Last Year";
  if (filter === "all") return "All Time";

  const month = last3Months.find((item) => item.value === filter);

  return month?.label || "Select";
}

// --------------------------------------------------
// COMPROBAR SI ES HOY
// --------------------------------------------------
function isToday(date) {
  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}
