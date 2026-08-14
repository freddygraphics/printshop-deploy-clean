"use client";
import nextDynamic from "next/dynamic";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import DesktopBoard from "@/components/production/DesktopBoard";
const JobModal = nextDynamic(() => import("@/components/JobModal/JobModal"), {
  ssr: false,
});
import SearchResults from "@/components/production/SearchResults";
import SearchBar from "@/components/production/SearchBar";

import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
/* ================= CONSTANTS ================= */

const STATUSES = [
  { key: "Pending", label: "Pending" },
  { key: "Design", label: "Design" },
  { key: "Proofing", label: "Proofing" },
  { key: "Production", label: "Production" },
  { key: "Ready", label: "Ready" },
];

/* ================= PAGE ================= */

export default function ProductionBoardPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeJob, setActiveJob] = useState(null);

  const [search, setSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const url = search.trim()
          ? `/api/jobs/search?q=${encodeURIComponent(search)}`
          : "/api/jobs";

        const res = await fetch(url);

        if (!res.ok) throw new Error("API error");

        const data = await res.json();

        if (Array.isArray(data)) {
          setJobs(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadJobs();
  }, [search]);

  const filtered = jobs;

  const jobsByStatus = useMemo(() => {
    const map = {
      Pending: [],
      Design: [],
      Proofing: [],
      Production: [],
      Ready: [],
    };

    filtered.forEach((j) => {
      const key = map[j.status] ? j.status : "Pending";
      map[key].push(j);
    });

    // 🔥 MÁS NUEVOS ARRIBA EN TODAS LAS COLUMNAS
    Object.keys(map).forEach((status) => {
      map[status].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });

    console.log(
      "Estados devueltos:",
      filtered.map((j) => ({
        job: j.jobNumber,
        status: j.status,
      })),
    );
    return map;
  }, [filtered]);

  function handleDragEnd({ active, over }) {
    if (!over) return;
    setActiveJob(null);

    setJobs((prev) => {
      const activeJob = prev.find((j) => j.id === active.id);
      if (!activeJob) return prev;

      let newStatus = activeJob.status;

      if (STATUSES.some((s) => s.key === over.id)) {
        newStatus = over.id;
      }

      const overJob = prev.find((j) => j.id === over.id);

      if (overJob) {
        newStatus = overJob.status;
      }

      let updated = prev.map((j) =>
        j.id === active.id ? { ...j, status: newStatus } : j,
      );

      // 🔥 SIEMPRE MÁS NUEVOS ARRIBA
      updated = updated.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      fetch(`/api/jobs/${active.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });
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
      <div className="max-w-[1920px] mx-auto px-6 py-6">
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
        {/* SEARCH */}

        <SearchBar value={search} onChange={setSearch} />
        {selectedJob && (
          <JobModal
            job={jobs.find((j) => j.id === selectedJob?.id) || selectedJob}
            onClose={() => {
              setSelectedJob(null);

              fetch("/api/jobs")
                .then((r) => r.json())
                .then((data) => {
                  if (Array.isArray(data)) setJobs(data);
                });
            }}
          />
        )}

        {/* BOARD */}

        <div className="mt-5">
          {search.trim() ? (
            <SearchResults jobs={jobs} onOpen={setSelectedJob} />
          ) : (
            <DesktopBoard
              sensors={sensors}
              jobs={jobs}
              jobsByStatus={jobsByStatus}
              activeJob={activeJob}
              setActiveJob={setActiveJob}
              setSelectedJob={setSelectedJob}
              handleDragEnd={handleDragEnd}
              STATUSES={STATUSES}
            />
          )}
        </div>
      </div>
    </div>
  );
}
