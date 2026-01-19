import { X } from "lucide-react";

export default function JobHeader({ job, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
      <div>
        <div className="text-xs text-gray-500">JOB #{job.jobNumber}</div>
        <div className="text-lg font-semibold text-gray-900">
          {job.client?.name || "No client"}
        </div>
      </div>

      <button onClick={onClose}>
        <X className="w-5 h-5 text-gray-500 hover:text-black" />
      </button>
    </div>
  );
}
