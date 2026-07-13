"use client";

import { DndContext, DragOverlay, rectIntersection } from "@dnd-kit/core";

import Column from "./Column";
import JobCard from "./JobCard";

export default function DesktopBoard({
  sensors,
  jobs,
  jobsByStatus,
  activeJob,
  setActiveJob,
  setSelectedJob,
  handleDragEnd,
  STATUSES,
}) {
  return (
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
      <div className="mt-5 overflow-x-auto">
        <div className="flex gap-4 pb-6 w-max">
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
      </div>

      <DragOverlay dropAnimation={null}>
        {activeJob ? (
          <div className="w-[320px]">
            <JobCard job={activeJob} onOpen={() => {}} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
