"use client";

import { Calendar, ChevronDown } from "lucide-react";
import { Listbox } from "@headlessui/react";

function FilterOption({ value, label }) {
  return (
    <Listbox.Option
      value={value}
      className={({ active, selected }) =>
        `cursor-pointer px-4 py-2 ${
          active ? "bg-blue-50 text-blue-700" : "text-gray-700"
        } ${selected ? "font-semibold" : ""}`
      }
    >
      {label}
    </Listbox.Option>
  );
}

function Divider() {
  return <div className="my-1 h-px bg-gray-200" />;
}

export default function DocumentDateFilter({
  value,
  onChange,
  label,
  previousMonths = [],
}) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="flex min-w-[170px] items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:shadow-md">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <span>{label}</span>
          </div>

          <ChevronDown size={16} className="text-gray-400" />
        </Listbox.Button>

        <Listbox.Options className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl bg-white text-sm shadow-lg focus:outline-none">
          <FilterOption value="today" label="Today" />
          <FilterOption value="last7" label="Last 7 Days" />
          <FilterOption value="thismonth" label="This Month" />

          <Divider />

          {previousMonths.map((month) => (
            <FilterOption
              key={month.value}
              value={month.value}
              label={month.label}
            />
          ))}

          <Divider />

          <FilterOption value="lastyear" label="Last Year" />
          <FilterOption value="all" label="All Time" />
        </Listbox.Options>
      </div>
    </Listbox>
  );
}
