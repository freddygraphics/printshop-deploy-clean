"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { JOB_STATUS_COLORS } from "@/lib/jobStatuses";
import { JOB_TRANSITIONS } from "@/lib/jobTransitions";

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadJob = async () => {
    try {
      const res = await fetch(`/api/jobs/${id}`);

if (!res.ok) {
  console.error("❌ Job not found");
  setJob(null);
  return;
}

const data = await res.json();
setJob(data);

    } catch (err) {
      console.error("❌ Load job error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [id]);

  const updateStatus = async (newStatus) => {
    await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadJob();
  };

  if (loading) {
    return <div className="p-6">Loading job…</div>;
  }

  if (!job) {
    return <div className="p-6 text-red-500">Job not found</div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Job #{job.jobNumber}
          </h1>
          <p className="text-sm text-gray-500">
            Client: {job.client?.name}
          </p>
        </div>

        <div
          className={`rounded-lg border px-3 py-1 text-sm font-semibold
            ${JOB_STATUS_COLORS[job.status]}`}
        >
          {job.status}
        </div>
      </div>

      {/* STATUS CONTROL */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="font-semibold mb-2">Status</h2>

        <select
          value={job.status}
          disabled={job.status === "Finished"}
          onChange={(e) => updateStatus(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value={job.status}>
            Current: {job.status}
          </option>

          {JOB_TRANSITIONS[job.status].map((s) => (
            <option key={s} value={s}>
              Move to {s}
            </option>
          ))}
        </select>
      </div>

      {/* ITEMS */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-4">Job Items</h2>

        {job.quote?.items?.length === 0 && (
          <p className="text-gray-400">No items</p>
        )}

        {job.quote?.items?.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-3 mb-3"
          >
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-gray-500">
              Qty: {item.qty} • Total: ${item.total}
            </div>
          </div>
        ))}
      </div>

      {/* BACK */}
      <div className="mt-6">
        <button
          onClick={() => router.push("/production")}
          className="text-blue-600 hover:underline"
        >
          ← Back to Production Board
        </button>
      </div>
    </div>
  );
}
