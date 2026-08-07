"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Receipt,
  ListOrdered,
  Loader2,
  Clock3,
  DollarSign,
  ArrowRight,
  CircleAlert,
} from "lucide-react";
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
      setLoading(true);

      try {
        const [quotesResponse, invoicesResponse, jobsResponse] =
          await Promise.all([
            fetch("/api/quotes"),
            fetch("/api/invoices"),
            fetch("/api/jobs"),
          ]);

        const [quotesData, invoicesData, jobsData] = await Promise.all([
          quotesResponse.json(),
          invoicesResponse.json(),
          jobsResponse.json(),
        ]);

        if (!quotesResponse.ok) {
          console.error("Error loading quotes:", quotesData);
        }

        if (!invoicesResponse.ok) {
          console.error("Error loading invoices:", invoicesData);
        }

        if (!jobsResponse.ok) {
          console.error("Error loading jobs:", jobsData);
        }

        setQuotes(
          quotesResponse.ok && Array.isArray(quotesData) ? quotesData : [],
        );

        setInvoices(
          invoicesResponse.ok && Array.isArray(invoicesData)
            ? invoicesData
            : [],
        );

        setJobs(
          jobsResponse.ok
            ? Array.isArray(jobsData)
              ? jobsData
              : Array.isArray(jobsData?.jobs)
                ? jobsData.jobs
                : []
            : [],
        );
      } catch (error) {
        console.error("Dashboard error:", error);

        setQuotes([]);
        setInvoices([]);
        setJobs([]);
      } finally {
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

  // -----------------------------------
  // FACTURAS PENDIENTES Y PAGOS PARCIALES
  // -----------------------------------
  const outstandingInvoices = (Array.isArray(invoices) ? invoices : [])
    .filter((invoice) => {
      const status = String(getInvoiceStatus(invoice) || "")
        .trim()
        .toLowerCase();

      const balance = getInvoiceBalance(invoice);

      return status !== "void" && balance > 0.01;
    })
    .sort((a, b) => {
      const dateA = getInvoiceDate(a).getTime();
      const dateB = getInvoiceDate(b).getTime();

      // Más antiguas primero
      return dateA - dateB;
    });

  const totalReceivable = outstandingInvoices.reduce(
    (total, invoice) => total + getInvoiceBalance(invoice),
    0,
  );
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
          {/* FACTURAS POR COBRAR + PROFIT REPORT */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.65fr_0.85fr]">
            {/* LISTA DE FACTURAS PENDIENTES */}
            <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#edf0f4] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Clock3 size={21} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Invoices to Collect
                    </h2>

                    <p className="text-sm text-gray-500">
                      Pending and partially paid invoices
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Total receivable
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {formatCurrency(totalReceivable)}
                  </p>
                </div>
              </div>

              {/* Lista con scroll */}
              <div className="max-h-[390px] min-h-[300px] overflow-y-auto">
                {outstandingInvoices.length === 0 ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
                      <DollarSign size={25} />
                    </div>

                    <p className="font-semibold text-gray-800">
                      No outstanding invoices
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      All invoices have been paid.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#edf0f4]">
                    {outstandingInvoices.map((invoice) => {
                      const total = getInvoiceTotal(invoice);
                      const balance = getInvoiceBalance(invoice);
                      const paid = Math.max(total - balance, 0);
                      const isPartial = paid > 0.01 && balance > 0.01;

                      return (
                        <Link
                          key={invoice.id}
                          href={`/invoices/${invoice.id}`}
                          className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-gray-50"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                isPartial
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-orange-50 text-orange-600"
                              }`}
                            >
                              {isPartial ? (
                                <DollarSign size={20} />
                              ) : (
                                <CircleAlert size={20} />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-gray-900">
                                  Invoice #{invoice.invoiceNumber || invoice.id}
                                </p>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                    isPartial
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-orange-50 text-orange-700"
                                  }`}
                                >
                                  {isPartial
                                    ? "Partial payment"
                                    : "Payment pending"}
                                </span>
                              </div>

                              <p className="mt-1 truncate text-sm text-gray-500">
                                {getInvoiceClientName(invoice)}
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                                <span>
                                  Invoice date:{" "}
                                  {formatDashboardDate(getInvoiceDate(invoice))}
                                </span>

                                {isPartial && (
                                  <span>Paid: {formatCurrency(paid)}</span>
                                )}

                                <span>Total: {formatCurrency(total)}</span>

                                {invoice.dueDate && (
                                  <span>
                                    Due: {formatDashboardDate(invoice.dueDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-xs text-gray-400">Balance due</p>

                            <p className="mt-1 font-bold text-gray-900">
                              {formatCurrency(balance)}
                            </p>

                            <ArrowRight
                              size={16}
                              className="ml-auto mt-2 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-700"
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[#edf0f4] bg-gray-50/70 px-6 py-4"></div>
            </div>

            {/* TARJETA PROFIT REPORT */}
            <Link
              href="/reports/profit"
              className="group relative min-h-[350px] overflow-hidden rounded-2xl bg-gray-950 p-7 text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-green-500/20 blur-2xl" />
              <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />

              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                    <DollarSign size={24} />
                  </div>

                  <p className="mt-7 text-sm font-semibold uppercase tracking-wide text-green-400">
                    Reports
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">Profit Report</h2>

                  <p className="mt-4 max-w-sm text-sm leading-6 text-gray-300">
                    Review invoice revenue, production costs, gross profit and
                    profit margins.
                  </p>
                </div>

                <div className="mt-10">
                  <div className="mb-5 h-px bg-white/10" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      Open profit report
                    </span>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-950 transition-transform group-hover:translate-x-1">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </section>
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
function getInvoiceTotal(invoice) {
  return Number(
    invoice?.invoiceTotal ?? invoice?.total ?? invoice?.grandTotal ?? 0,
  );
}

function getInvoicePaidAmount(invoice) {
  if (Array.isArray(invoice?.payments)) {
    return invoice.payments.reduce(
      (total, payment) => total + Number(payment?.amount || 0),
      0,
    );
  }

  return Number(
    invoice?.amountPaid ?? invoice?.paidAmount ?? invoice?.paid ?? 0,
  );
}

function getInvoiceBalance(invoice) {
  if (invoice?.balance !== null && invoice?.balance !== undefined) {
    return Math.max(Number(invoice.balance || 0), 0);
  }

  const total = getInvoiceTotal(invoice);
  const paid = getInvoicePaidAmount(invoice);

  return Math.max(total - paid, 0);
}

function getInvoiceClientName(invoice) {
  return (
    invoice?.client?.company ||
    invoice?.client?.companyName ||
    invoice?.client?.name ||
    invoice?.clientName ||
    invoice?.customerName ||
    "Customer"
  );
}

function formatDashboardDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function getInvoiceDate(invoice) {
  const rawDate =
    invoice?.issuedAt || invoice?.invoiceDate || invoice?.createdAt;

  const date = rawDate ? new Date(rawDate) : new Date(0);

  if (Number.isNaN(date.getTime())) {
    return new Date(0);
  }

  return date;
}
