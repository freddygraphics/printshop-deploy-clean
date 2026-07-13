"use client";

import Link from "next/link";
import { Calendar, User2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
const STATUS_ACCENT = {
  Pending: "border-t-gray-300",
  Design: "border-t-blue-500",
  Proofing: "border-t-purple-500",
  Production: "border-t-amber-500",
  Ready: "border-t-emerald-500",
};

function formatDue(dueDateISO) {
  if (!dueDateISO) return "—";

  return new Date(dueDateISO).toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
  });
}
export default function JobCard({ job, onOpen, isOverlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const imageFile =
    job.files?.find((f) => f.isDefault) ||
    job.files?.find((f) => f.type?.startsWith("image/"));

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 180ms ease",
  };

  return (
    <div
      ref={isOverlay ? null : setNodeRef}
      style={isOverlay ? undefined : style}
      onClick={() => {
        if (!isDragging && !isOverlay) onOpen(job);
      }}
      className={[
        "bg-white border shadow-md select-none border-t-4 w-full overflow-hidden",
        STATUS_ACCENT[job.status],
        isDragging && !isOverlay ? "opacity-60" : "",
      ].join(" ")}
      {...(!isOverlay ? attributes : {})}
      {...(!isOverlay ? listeners : {})}
    >
      {/* IMAGE — FULL WIDTH REAL */}
      {imageFile && (
        <div className="w-full h-36 overflow-hidden">
          <img
            src={imageFile.url}
            alt="Job preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* CONTENT */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            {job.invoice ? (
              <Link
                href={`/invoices/${job.invoice.id}`}
                onClick={(e) => e.stopPropagation()}
                className=" bg-blue-600 text-white px-3 py-1.5 rounded-md text-m hover:bg-blue-700 transition"
              >
                Invoice #{job.invoice.invoiceNumber}
              </Link>
            ) : (
              <div className="text-sm text-gray-400 italic">No invoice</div>
            )}

            <div className="text-sm text-gray-900 mt-2">
              JOB #{job.jobNumber}
            </div>
          </div>
        </div>

        <div className="mt-2 text-l font-medium text-gray-900">
          {job.client?.company || "No client"}
        </div>

        <div className=" text-sm text-gray-900">
          {job.client?.name || "No client"}
        </div>

        <div className="text-sm text-gray-800">
          {job.invoice?.invoiceItems?.length
            ? job.invoice.invoiceItems.map((i) => i.name).join(", ")
            : "No items"}
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Due {formatDue(job.dueDate)}
          </span>
          <span className="flex items-center gap-1">
            <User2 className="w-3.5 h-3.5" />
            {job.assignedTo || "Unassigned"}
          </span>
        </div>
      </div>
    </div>
  );
}
