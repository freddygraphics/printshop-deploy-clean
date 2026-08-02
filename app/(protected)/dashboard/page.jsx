"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Receipt, ListOrdered, Loader2 } from "lucide-react";
import { getInvoiceStatus } from "@/lib/invoiceStatus";
import DocumentDateFilter from "@/components/documents/DocumentDateFilter";

export default function DashboardPage() {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0);
  };

  const [loading, setLoading] = useState(true);

  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [jobs, setJobs] = useState([]);

  const [filter, setFilter] = useState("thismonth"); // default filter

  useEffect(() => {
    async function loadData() {
      try {
        const q = await fetch("/api/quotes").then((r) => r.json());
        const inv = await fetch("/api/invoices").then((r) => r.json());
        const jb = await fetch("/api/jobs").then((r) => r.json());

        setQuotes(q);
        setInvoices(inv);
        setJobs(jb.jobs || []);

        setLoading(false);
      } catch (err) {
        console.error("Dashboard error:", err);
        setLoading(false);
      }
    }

    loadData();
  }, []);
  const previousMonths = Array.from({ length: 3 }).map((_, index) => {
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

  function getFilterLabel(filterValue) {
    if (filterValue === "today") return "Today";
    if (filterValue === "last7") return "Last 7 Days";
    if (filterValue === "thismonth") return "This Month";
    if (filterValue === "lastyear") return "Last Year";
    if (filterValue === "all") return "All Time";

    const selectedMonth = previousMonths.find(
      (month) => month.value === filterValue,
    );

    return selectedMonth?.label || "Select";
  }
  if (loading) {
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // -----------------------------------
  // FILTRO DE FECHAS
  // -----------------------------------
  function applyFilter(list, dateField = "createdAt") {
    if (!Array.isArray(list)) return [];

    const now = new Date();

    return list.filter((item) => {
      const rawDate = item?.[dateField] || item?.createdAt;

      if (!rawDate) return false;

      const itemDate = new Date(rawDate);

      if (Number.isNaN(itemDate.getTime())) {
        return false;
      }

      if (filter === "today") {
        return isToday(itemDate);
      }

      if (filter === "last7") {
        const startDate = new Date(now);

        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);

        return itemDate >= startDate && itemDate <= now;
      }

      if (filter === "thismonth") {
        return (
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear()
        );
      }

      if (filter.includes("-")) {
        const [year, month] = filter.split("-").map(Number);

        return itemDate.getFullYear() === year && itemDate.getMonth() === month;
      }

      if (filter === "lastyear") {
        return itemDate.getFullYear() === now.getFullYear() - 1;
      }

      return true;
    });
  }

  const fQuotes = applyFilter(quotes, "quoteDate");
  const fInvoices = applyFilter(invoices, "issuedAt");
  const validInvoices = fInvoices.filter(
    (invoice) => getInvoiceStatus(invoice) !== "Void",
  );
  const fJobs = applyFilter(jobs, "createdAt");

  // -----------------------------------
  // TOTALES SEGÚN FILTRO
  // -----------------------------------
  const quotesTotalAmount = fQuotes.reduce((acc, q) => acc + (q.total || 0), 0);

  const invoicesTotalAmount = validInvoices.reduce(
    (acc, invoice) => acc + Number(invoice.invoiceTotal ?? invoice.total ?? 0),
    0,
  );
  const activeJobs = fJobs.filter((job) => job.status !== "Completed").length;

  return (
    <div className="w-full">
      {/* CONTENEDOR CENTRAL */}
      <div className="max-w-[1200px] mx-auto">
        <div className="space-y-8 animate-fadeIn">
          {/* HEADER + FILTERS */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Freddy Graphics LLC
            </h1>
            <DocumentDateFilter
              value={filter}
              onChange={setFilter}
              label={getFilterLabel(filter)}
              previousMonths={previousMonths}
            />
          </div>

          {/* 3 COLUMNAS */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* QUOTES */}
            <Column
              title="Quotes"
              icon={<FileText className="text-blue-500" size={22} />}
            >
              <CardStat
                label="Quotes Created"
                value={fQuotes.length}
                color="blue"
                href="/quotes"
                filter={filter}
              />

              <CardStat
                label="Quotes Total Amount"
                value={formatCurrency(quotesTotalAmount)}
                color="blue"
                href="/quotes"
                filter={filter}
              />
            </Column>

            {/* INVOICES */}
            <Column
              title="Invoices"
              icon={<Receipt className="text-green-600" size={22} />}
            >
              <CardStat
                label="Invoices Created"
                value={validInvoices.length}
                color="green"
                href="/invoices"
                filter={filter}
              />

              <CardStat
                label="Invoices Total Amount"
                value={formatCurrency(invoicesTotalAmount)}
                color="green"
                href="/invoices"
                filter={filter}
              />
            </Column>

            {/* JOBS */}
            <Column
              title="Jobs"
              icon={<ListOrdered className="text-orange-500" size={22} />}
            >
              <CardStat
                label="Jobs Created"
                value={fJobs.length}
                color="orange"
                href="/orders"
                filter={filter}
              />

              <CardStat
                label="Active Jobs"
                value={activeJobs}
                color="orange"
                href="/orders"
                filter={filter}
              />
            </Column>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------
// COMPONENTES
// -----------------------------------

function Column({ title, icon, children }) {
  return (
    <div className="space-y-4 animate-slideUp">
      <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

function CardStat({ label, value, color, href, filter }) {
  const router = useRouter();

  const colors = {
    blue: "text-grey-200 bg-blue-50 border-blue-200",
    green: "text-grey-200 bg-green-50 border-green-200",
    orange: "text-grey-200 bg-orange-50 border-orange-200",
  };

  return (
    <div
      onClick={() => {
        const destination = filter ? `${href}?filter=${filter}` : href;

        router.push(destination);
      }}
      className="
        rounded-xl border shadow-sm p-5 cursor-pointer
        transition-all duration-300 transform 
        hover:scale-[1.03] hover:shadow-md bg-white
        active:scale-[0.98]
      "
    >
      <div className="flex flex-col">
        <span className="text-l text-gray-500">{label}</span>

        <span
          className={`text-xl font-bold mt-1 ${colors[color].split(" ")[0]}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

// -----------------------------------
// HELPERS DE FECHA
// -----------------------------------

function isToday(date) {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}
