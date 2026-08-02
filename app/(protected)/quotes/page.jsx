"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";

import DocumentListPage, {
  DocumentStatusBadge,
} from "@/components/documents/DocumentListPage";

import { formatCurrency } from "@/lib/formatCurrency";

export default function QuotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlFilter = searchParams.get("filter") || "thismonth";

  const [filter, setFilter] = useState(urlFilter);
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    async function loadQuotes() {
      try {
        const response = await fetch("/api/quotes", {
          cache: "no-store",
        });

        const data = await response.json();

        setQuotes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading quotes:", error);
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    }

    loadQuotes();
  }, []);

  const previousMonths = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, index) => {
        const date = new Date();

        date.setMonth(date.getMonth() - (index + 1));

        return {
          value: `${date.getFullYear()}-${date.getMonth()}`,
          label: date.toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          }),
        };
      }),
    [],
  );

  const filterLabel = useMemo(() => {
    if (filter === "today") return "Today";
    if (filter === "last7") return "Last 7 Days";
    if (filter === "thismonth") return "This Month";
    if (filter === "lastyear") return "Last Year";
    if (filter === "all") return "All Time";

    return (
      previousMonths.find((month) => month.value === filter)?.label || "Select"
    );
  }, [filter, previousMonths]);

  const dateFilteredQuotes = useMemo(() => {
    const now = new Date();

    return quotes.filter((quote) => {
      const quoteDate = new Date(quote.quoteDate || quote.createdAt);

      if (Number.isNaN(quoteDate.getTime())) {
        return false;
      }

      if (filter === "today") {
        return isToday(quoteDate);
      }

      if (filter === "last7") {
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);

        return quoteDate >= startDate && quoteDate <= now;
      }

      if (filter === "thismonth") {
        return (
          quoteDate.getMonth() === now.getMonth() &&
          quoteDate.getFullYear() === now.getFullYear()
        );
      }

      if (filter.includes("-")) {
        const [year, month] = filter.split("-").map(Number);

        return (
          quoteDate.getFullYear() === year && quoteDate.getMonth() === month
        );
      }

      if (filter === "lastyear") {
        return quoteDate.getFullYear() === now.getFullYear() - 1;
      }

      return true;
    });
  }, [quotes, filter]);

  const statusFilteredQuotes = useMemo(() => {
    if (statusFilter === "ALL") {
      return dateFilteredQuotes;
    }

    return dateFilteredQuotes.filter(
      (quote) =>
        String(quote.status || "Pending").toUpperCase() === statusFilter,
    );
  }, [dateFilteredQuotes, statusFilter]);

  const searchedQuotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return statusFilteredQuotes;
    }

    return statusFilteredQuotes.filter((quote) => {
      return (
        String(quote.quoteNumber || "").includes(query) ||
        `qt-${quote.id}`.includes(query) ||
        quote.client?.name?.toLowerCase().includes(query) ||
        quote.client?.company?.toLowerCase().includes(query)
      );
    });
  }, [statusFilteredQuotes, search]);

  const statusTabs = useMemo(() => {
    const countStatus = (status) =>
      dateFilteredQuotes.filter(
        (quote) => String(quote.status || "Pending").toUpperCase() === status,
      ).length;

    return [
      {
        value: "ALL",
        label: "ALL",
        count: dateFilteredQuotes.length,
      },
      {
        value: "PENDING",
        label: "PENDING",
        count: countStatus("PENDING"),
      },
      {
        value: "APPROVED",
        label: "APPROVED",
        count: countStatus("APPROVED"),
      },
      {
        value: "REJECTED",
        label: "REJECTED",
        count: countStatus("REJECTED"),
      },
      {
        value: "CONVERTED TO INVOICE",
        label: "CONVERTED",
        count: countStatus("CONVERTED TO INVOICE"),
      },
    ];
  }, [dateFilteredQuotes]);

  const totalQuotes = searchedQuotes.reduce(
    (sum, quote) => sum + Number(quote.total || 0),
    0,
  );

  const pendingTotal = searchedQuotes
    .filter((quote) => quote.status === "Pending")
    .reduce((sum, quote) => sum + Number(quote.total || 0), 0);

  const approvedTotal = searchedQuotes
    .filter((quote) => quote.status === "Approved")
    .reduce((sum, quote) => sum + Number(quote.total || 0), 0);

  const convertedTotal = searchedQuotes
    .filter((quote) => quote.status === "Converted to Invoice")
    .reduce((sum, quote) => sum + Number(quote.total || 0), 0);

  const columns = [
    {
      key: "quoteNumber",
      label: "Quote #",
      render: (quote) => quote.quoteNumber ?? `QT-${quote.id}`,
    },
    {
      key: "customer",
      label: "Customer",
      render: (quote) => quote.client?.name || "No Client",
    },
    {
      key: "company",
      label: "Company",
      className: "px-6 py-3 text-gray-600",
      render: (quote) => quote.client?.company || "—",
    },
    {
      key: "date",
      label: "Date",
      render: (quote) =>
        new Date(quote.quoteDate || quote.createdAt).toLocaleDateString(),
    },
    {
      key: "total",
      label: "Quote Total",
      render: (quote) => formatCurrency(quote.total),
    },
    {
      key: "status",
      label: "Status",
      render: (quote) => (
        <DocumentStatusBadge status={quote.status || "Pending"} />
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <DocumentListPage
      title="Quotes"
      icon={FileText}
      iconClassName="text-blue-600"
      summaryCards={[
        {
          key: "total",
          title: "Total Quotes",
          value: formatCurrency(totalQuotes),
        },
        {
          key: "pending",
          title: "Pending Quotes",
          value: formatCurrency(pendingTotal),
        },
        {
          key: "approved",
          title: "Approved Quotes",
          value: formatCurrency(approvedTotal),
        },
        {
          key: "converted",
          title: "Converted Quotes",
          value: formatCurrency(convertedTotal),
        },
      ]}
      createHref="/quotes/new"
      createLabel="New Quote"
      filter={filter}
      onFilterChange={setFilter}
      filterLabel={filterLabel}
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
      previousMonths={previousMonths}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by quote # or customer..."
      tabs={statusTabs}
      activeTab={statusFilter}
      onTabChange={setStatusFilter}
      columns={columns}
      rows={searchedQuotes}
      onRowClick={(quote) => {
        router.push(`/quotes/${quote.id}`);
      }}
      emptyMessage="No quotes found."
    />
  );
}

function isToday(date) {
  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}
