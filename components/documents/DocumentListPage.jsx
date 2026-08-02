"use client";

import Link from "next/link";
import { Calendar, ChevronDown, Plus } from "lucide-react";

import DocumentDateFilter from "./DocumentDateFilter";

export function DocumentSummaryCard({ title, value, valueClassName = "" }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>

      <div className={`mt-2 text-2xl font-semibold ${valueClassName}`}>
        {value}
      </div>
    </div>
  );
}

export function DocumentStatusBadge({ status, colors = {} }) {
  const defaultColors = {
    Draft: "bg-gray-100 text-gray-600",
    Pending: "bg-yellow-100 text-yellow-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
    Issued: "bg-blue-100 text-blue-700",
    "Partially Paid": "bg-yellow-100 text-yellow-700",
    Paid: "bg-green-100 text-green-700",
    Overdue: "bg-red-100 text-red-700",
    Void: "bg-gray-300 text-gray-700",
    "Converted to Invoice": "bg-purple-100 text-purple-700",
  };

  const statusColors = {
    ...defaultColors,
    ...colors,
  };

  return (
    <span
      className={`inline-flex px-3 py-1 text-xs font-semibold ${
        statusColors[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function DocumentListPage({
  title,
  icon: Icon,
  iconClassName = "text-blue-600",

  summaryCards = [],

  createHref,
  createLabel,

  filter,
  onFilterChange,
  filterLabel,
  filterOptions = [],
  previousMonths = [],

  search,
  onSearchChange,
  searchPlaceholder = "Search...",

  tabs = [],
  activeTab,
  onTabChange,

  columns = [],
  rows = [],
  getRowKey = (row) => row.id,
  onRowClick,

  emptyMessage = "No records found.",
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="mx-auto max-w-7xl">
        {summaryCards.length > 0 && (
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <DocumentSummaryCard
                key={card.key || card.title}
                title={card.title}
                value={card.value}
                valueClassName={card.valueClassName}
              />
            ))}
          </div>
        )}

        <div
          className={`flex flex-wrap items-center justify-between gap-4 ${
            summaryCards.length > 0 ? "mt-10" : ""
          }`}
        >
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            {Icon && <Icon className={iconClassName} />}

            {title}
          </h1>

          <div className="flex items-center gap-3">
            {createHref && createLabel && (
              <Link href={createHref}>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white shadow hover:bg-blue-700"
                >
                  <Plus size={16} />
                  {createLabel}
                </button>
              </Link>
            )}

            <DocumentDateFilter
              value={filter}
              onChange={onFilterChange}
              label={filterLabel}
              previousMonths={previousMonths}
            />
          </div>
        </div>

        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="mt-5 w-full rounded-md border px-4 py-2 md:w-1/3"
        />

        {tabs.length > 0 && (
          <div className="mt-5 border-b border-gray-200">
            <nav className="flex gap-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => onTabChange(tab.value)}
                  className={`whitespace-nowrap pb-3 text-sm font-medium transition ${
                    activeTab === tab.value
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}

                  {typeof tab.count === "number" && ` (${tab.count})`}
                </button>
              ))}
            </nav>
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left text-sm text-gray-600">
                  {columns.map((column) => (
                    <th key={column.key} className="px-6 py-3">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.length > 0 ? (
                  rows.map((row) => (
                    <tr
                      key={getRowKey(row)}
                      onClick={() => onRowClick?.(row)}
                      className="cursor-pointer border-t text-sm font-medium transition hover:bg-blue-50"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={column.className || "px-6 py-3"}
                        >
                          {column.render ? column.render(row) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-6 text-center text-gray-400"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
