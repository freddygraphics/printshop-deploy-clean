"use client";
export const dynamic = "force-dynamic";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  Search,
  Calendar,
  User2,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react";

import JobDrawer from "@/components/JobDrawer";

/* ================= CONSTANTS ================= */

const COLUMN_BG = {
  Pending: "bg-gray-100",
  Design: "bg-gray-100",
  Production: "bg-gray-100",
  Ready: "bg-gray-100",
  Delivered: "bg-gray-100",
};

const STATUSES = [
  { key: "Pending", label: "Pending" },
  { key: "Design", label: "Design" },
  { key: "Production", label: "Production" },
  { key: "Ready", label: "Ready" },
  { key: "Delivered", label: "Delivered" },
];

const PRIORITY_BADGE = {
  Low: "bg-gray-100 text-gray-700 border-gray-200",
  Normal: "bg-blue-50 text-blue-700 border-blue-200",
  Rush: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_ACCENT = {
  Pending: "border-t-gray-300",
  Design: "border-t-blue-500",
  Production: "border-t-amber-500",
  Ready: "border-t-emerald-500",
  Delivered: "border-t-slate-500",
};

/* ================= HELPERS ================= */

function isOverdue(dueDateISO) {
  if (!dueDateISO) return false;
  const d = new Date(dueDateISO);
  const t = new Date();
  return (
    new Date(d.getFullYear(), d.getMonth(), d.getDate()) <
    new Date(t.getFullYear(), t.getMonth(), t.getDate())
  );
}

function formatDue(dueDateISO) {
  if (!dueDateISO) return "—";
  return new Date(dueDateISO).toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
  });
}

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={[
        "px-3 py-1.5 rounded-full text-sm border transition",
        active
          ? "bg-gray-900 text-white border-gray-900"
          : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ================= SORTABLE CARD ================= */

function SortableJobCard({ job, onOpen, isOverlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 180ms ease",
  };

  const overdue = isOverdue(job.dueDate);

  return (
    <div
      ref={isOverlay ? null : setNodeRef}
      style={isOverlay ? undefined : style}
      onClick={() => {
        if (!isDragging && !isOverlay) onOpen(job);
      }}
      className={[
        "bg-white  border shadow-md p-5 select-none border-t-4",
        STATUS_ACCENT[job.status],
        overdue ? "border-red-400" : "border-gray-200",
        "hover:shadow-lg transition",
        isDragging && !isOverlay ? "opacity-60" : "",
      ].join(" ")}
      {...(!isOverlay ? attributes : {})}
      {...(!isOverlay ? listeners : {})}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link
            href={`/invoices/${job.invoiceId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            Invoice #{job.invoice?.invoiceNumber ?? "—"}
          </Link>

          <div className="font-semibold text-base text-gray-900">
            JOB #{job.jobNumber}
          </div>

          <div className="text-xs text-gray-500 mt-1">
            Qty{" "}
            {job.invoice?.invoiceItems?.reduce((s, i) => s + (i.qty || 0), 0) ||
              0}
          </div>
        </div>

        <span className="text-[11px] text-gray-400 border px-2 py-1 rounded-lg">
          Drag
        </span>
      </div>

      <div className="mt-2 text-sm font-medium text-gray-900">
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
  );
}

/* ================= COLUMN ================= */
function Column({ title, statusKey, jobs, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: statusKey });

  // ✅ AQUÍ SÍ EXISTE jobs
  const isEmpty = jobs.length === 0;

  return (
    <div className="min-w-[280px] w-[280px] lg:min-w-[320px] lg:w-[320px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="font-semibold">{title}</div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border">
          {jobs.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={[
          "rounded-2xl transition-colors",
          "min-h-[70vh]", // 👈 CLAVE
          isEmpty ? COLUMN_BG[statusKey] : "bg-gray-100",
          isOver ? "bg-blue-100/70" : "",
        ].join(" ")}
      >
        <div className="p-3 space-y-3 h-full overflow-auto">
          <SortableContext
            items={jobs.map((j) => j.id)}
            strategy={verticalListSortingStrategy}
          >
            {jobs.map((job) => (
              <SortableJobCard key={job.id} job={job} onOpen={onOpen} />
            ))}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

export default function ProductionBoardPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeJob, setActiveJob] = useState(null);

  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("All");
  const [assignedTo, setAssignedTo] = useState("All");
  const [priority, setPriority] = useState("All");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then(setJobs);
  }, []);

  const assignees = useMemo(() => {
    const set = new Set(jobs.map((j) => j.assignedTo).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter((j) => {
      if (
        q &&
        !String(j.jobNumber).includes(q) &&
        !j.client?.name?.toLowerCase().includes(q)
      )
        return false;

      if (assignedTo !== "All" && j.assignedTo !== assignedTo) return false;
      if (priority !== "All" && j.priority !== priority) return false;
      if (quickFilter === "Overdue") return isOverdue(j.dueDate);

      return true;
    });
  }, [jobs, search, quickFilter, assignedTo, priority]);

  const jobsByStatus = useMemo(() => {
    const map = Object.fromEntries(STATUSES.map((s) => [s.key, []]));
    filtered.forEach((j) => map[j.status]?.push(j));
    return map;
  }, [filtered]);

  function handleDragEnd({ active, over }) {
    if (!over) return;
    setActiveJob(null);

    setJobs((prev) => {
      const activeJob = prev.find((j) => j.id === active.id);
      if (!activeJob) return prev;

      let newStatus = activeJob.status;
      if (STATUSES.some((s) => s.key === over.id)) newStatus = over.id;

      const overJob = prev.find((j) => j.id === over.id);
      if (overJob) newStatus = overJob.status;

      let updated = prev.map((j) =>
        j.id === active.id ? { ...j, status: newStatus } : j
      );

      const oldIndex = updated.findIndex((j) => j.id === active.id);
      const newIndex = updated.findIndex((j) => j.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        updated = arrayMove(updated, oldIndex, newIndex);
      }

      fetch("/api/jobs/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: updated }),
      });

      return [...updated];
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <div className="max-w-[1900px] mx-auto px-6 py-6">
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Production Board</h1>
            <p className="text-sm text-gray-600">
              Drag jobs across columns to update status.
            </p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-gray-900 text-white">
            + Create Job
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="mt-5 bg-white border rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 border rounded-xl"
                placeholder="Search job, invoice, client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
              {["All", "Today", "ThisWeek", "Overdue"].map((k) => (
                <Pill
                  key={k}
                  active={quickFilter === k}
                  onClick={() => setQuickFilter(k)}
                >
                  {k}
                </Pill>
              ))}
            </div>

            <select
              className="px-3 py-2 border rounded-xl"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              {assignees.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>

            <select
              className="px-3 py-2 border rounded-xl"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {["All", "Low", "Normal", "Rush"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedJob && (
          <JobDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />
        )}

        {/* BOARD */}

        <div className="mt-5">
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={({ active }) => {
              const job = jobs.find((j) => j.id === active.id);
              setActiveJob(job);
            }}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveJob(null)}
          >
            <div className="flex gap-4 pb-4">
              {STATUSES.map((s) => (
                <Column
                  key={s.key}
                  title={s.label}
                  statusKey={s.key}
                  jobs={jobsByStatus[s.key] || []}
                  onOpen={setSelectedJob}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={null}>
              {activeJob ? (
                <div className="w-[320px]">
                  <SortableJobCard
                    job={activeJob}
                    onOpen={() => {}}
                    isOverlay
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
