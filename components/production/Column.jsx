"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import JobCard from "./JobCard";

export default function Column({ title, statusKey, jobs, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: statusKey });

  return (
    <div className="w-[350px] flex-shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <div className="font-semibold">{title}</div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border">
          {jobs.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={[
          "rounded-2xl bg-[#F5F7F9] min-h-[70vh]",
          isOver ? "bg-[#F5F7F9]" : "",
        ].join(" ")}
      >
        <div className="w-[320px] flex-shrink-0">
          <SortableContext
            items={jobs.map((j) => j.id)}
            strategy={verticalListSortingStrategy}
          >
            {jobs.map((job) => (
              <div key={job.id} className="px-3 pt-3 last:pb-3">
                <JobCard job={job} onOpen={onOpen} />
              </div>
            ))}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}
