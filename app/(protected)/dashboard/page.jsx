"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Receipt,
  ListOrdered,
  Loader2,
  Calendar,
} from "lucide-react";

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

  const [filter, setFilter] = useState("month"); // default filter

  useEffect(() => {
    async function loadData() {
      try {
        const q = await fetch("/api/quotes").then((r) => r.json());
        const inv = await fetch("/api/invoices").then((r) => r.json());
        const jb = await fetch("/api/jobs").then((r) => r.json());
        setJobs(jb);

        setQuotes(q);
        setInvoices(inv);
        setJobs(jb);

        setLoading(false);
      } catch (err) {
        console.error("Dashboard error:", err);
        setLoading(false);
      }
    }

    loadData();
  }, []);

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
  function applyFilter(list) {
    if (!Array.isArray(list)) return [];

    const now = new Date();

    return list.filter((item) => {
      if (!item?.createdAt) return false;

      const date = new Date(item.createdAt);

      switch (filter) {
        case "today":
          return isToday(date);

        case "week":
          return isThisWeek(date);

        case "month":
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );

        case "year":
          return date.getFullYear() === now.getFullYear();

        case "all":
          return true;

        default:
          return true;
      }
    });
  }

  const fQuotes = applyFilter(quotes);
  const fInvoices = applyFilter(invoices);
  const fJobs = jobs;

  // -----------------------------------
  // TOTALES SEGÚN FILTRO
  // -----------------------------------
  const quotesTotalAmount = fQuotes.reduce((acc, q) => acc + (q.total || 0), 0);

  const invoicesTotalAmount = fInvoices.reduce(
    (acc, i) => acc + (i.total || 0),
    0,
  );
  const activeJobs = jobs.filter((j) => j.status !== "Completed").length;

  return (
    <div className="w-full">
      {/* CONTENEDOR CENTRAL */}
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8">
        <div className="space-y-8 animate-fadeIn">
          {/* HEADER + FILTERS */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Hola Freddy
            </h1>

            <div className="flex items-center gap-2 bg-white border rounded-lg shadow-sm px-3 py-2">
              <Calendar className="text-gray-500" size={20} />

              <select
                className="text-sm bg-transparent focus:outline-none"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          {/* 3 COLUMNAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              />

              <CardStat
                label="Quotes Total Amount"
                value={formatCurrency(quotesTotalAmount)}
                color="blue"
                href="/quotes"
              />
            </Column>

            {/* INVOICES */}
            <Column
              title="Invoices"
              icon={<Receipt className="text-green-600" size={22} />}
            >
              <CardStat
                label="Invoices Created"
                value={fInvoices.length}
                color="green"
                href="/invoices"
              />

              <CardStat
                label="Invoices Total Amount"
                value={formatCurrency(invoicesTotalAmount)}
                color="green"
                href="/invoices"
              />
            </Column>

            {/* JOBS */}
            <Column
              title="Jobs"
              icon={<ListOrdered className="text-orange-500" size={22} />}
            >
              <CardStat
                label="Jobs Created"
                value={jobs.length}
                color="orange"
                href="/orders"
                filter="all"
              />

              <CardStat
                label="Active Jobs"
                value={activeJobs}
                color="orange"
                href="/orders"
                filter="all"
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
      onClick={() => router.push(`${href}?filter=${filter}`)}
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

function isThisWeek(date) {
  const now = new Date();
  const start = new Date(now.setDate(now.getDate() - now.getDay()));
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}
