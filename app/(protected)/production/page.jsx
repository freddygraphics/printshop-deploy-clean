"use client";

import nextDynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

import DesktopBoard from "@/components/production/DesktopBoard";
import SearchResults from "@/components/production/SearchResults";
import SearchBar from "@/components/production/SearchBar";

const JobModal = nextDynamic(() => import("@/components/JobModal/JobModal"), {
  ssr: false,
});

const STATUSES = [
  { key: "Pending", label: "Pending" },
  { key: "Design", label: "Design" },
  { key: "Proofing", label: "Proofing" },
  { key: "Production", label: "Production" },
  { key: "Ready", label: "Ready" },
];

export default function ProductionBoardPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [search, setSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  // ============================================
  // LOAD JOBS
  // ============================================

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const url = search.trim()
          ? `/api/jobs/search?q=${encodeURIComponent(search)}`
          : "/api/jobs";

        const res = await fetch(url, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to load jobs");
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setJobs(data);
        }
      } catch (error) {
        console.error("❌ LOAD JOBS ERROR:", error);
      }
    };

    loadJobs();
  }, [search]);

  // ============================================
  // JOBS BY STATUS
  // ============================================

  const jobsByStatus = useMemo(() => {
    const map = {
      Pending: [],
      Design: [],
      Proofing: [],
      Production: [],
      Ready: [],
    };

    jobs.forEach((job) => {
      const status = map[job.status] ? job.status : "Pending";

      map[status].push(job);
    });

    Object.keys(map).forEach((status) => {
      map[status].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    });

    return map;
  }, [jobs]);

  // ============================================
  // DRAG END
  // ============================================

  async function handleDragEnd({ active, over }) {
    setActiveJob(null);

    if (!over) {
      return;
    }

    const draggedJob = jobs.find((job) => job.id === active.id);

    if (!draggedJob) {
      return;
    }

    let newStatus = draggedJob.status;

    // Soltado directamente sobre columna
    if (STATUSES.some((status) => status.key === over.id)) {
      newStatus = over.id;
    }

    // Soltado encima de otro job
    const overJob = jobs.find((job) => job.id === over.id);

    if (overJob) {
      newStatus = overJob.status;
    }

    // No cambió de columna
    if (newStatus === draggedJob.status) {
      return;
    }

    const previousJobs = jobs;

    let updatedJobs = jobs.map((job) =>
      job.id === active.id
        ? {
            ...job,
            status: newStatus,
          }
        : job,
    );

    updatedJobs = updatedJobs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Optimistic UI
    setJobs(updatedJobs);

    try {
      // ========================================
      // UPDATE STATUS
      // ========================================

      const statusRes = await fetch(`/api/jobs/${active.id}/status`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!statusRes.ok) {
        const errorData = await statusRes.json().catch(() => null);

        throw new Error(errorData?.error || "Failed to update job status");
      }

      // ========================================
      // REORDER
      // ========================================

      const reorderRes = await fetch("/api/jobs/reorder", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          updates: updatedJobs,
        }),
      });

      if (!reorderRes.ok) {
        throw new Error("Failed to reorder jobs");
      }
    } catch (error) {
      console.error("❌ DRAG UPDATE ERROR:", error);

      // Regresar visualmente al estado anterior
      setJobs(previousJobs);

      // Volver a cargar desde DB
      try {
        const res = await fetch("/api/jobs", {
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();

          if (Array.isArray(data)) {
            setJobs(data);
          }
        }
      } catch (reloadError) {
        console.error("❌ RELOAD JOBS ERROR:", reloadError);
      }
    }
  }

  // ============================================
  // PAGE
  // ============================================

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

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-gray-900 text-white"
          >
            + Create Job
          </button>
        </div>

        {/* SEARCH */}

        <SearchBar value={search} onChange={setSearch} />

        {/* JOB MODAL */}

        {selectedJob && (
          <JobModal
            job={jobs.find((job) => job.id === selectedJob?.id) || selectedJob}
            onClose={async () => {
              setSelectedJob(null);

              try {
                const res = await fetch("/api/jobs", {
                  cache: "no-store",
                });

                if (!res.ok) {
                  return;
                }

                const data = await res.json();

                if (Array.isArray(data)) {
                  setJobs(data);
                }
              } catch (error) {
                console.error("❌ REFRESH JOBS ERROR:", error);
              }
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
