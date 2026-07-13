"use client";

import {
  ChevronRight,
  Building2,
  User,
  FileText,
  Calendar,
} from "lucide-react";

const STATUS = {
  Pending: "bg-yellow-100 text-yellow-700",
  Design: "bg-blue-100 text-blue-700",
  Proofing: "bg-purple-100 text-purple-700",
  Production: "bg-orange-100 text-orange-700",
  Ready: "bg-green-100 text-green-700",
  Delivered: "bg-gray-200 text-gray-700",
};

export default function SearchResults({ jobs, onOpen }) {
  if (!jobs.length) {
    return (
      <div className="rounded-xl bg-white border p-12 text-center">
        <h3 className="text-lg font-semibold">No jobs found</h3>
        <p className="text-gray-500 mt-2">
          Try another Job #, Invoice #, Customer or Business Name.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Search Results</h2>

          <p className="text-sm text-gray-500">
            {jobs.length} result{jobs.length > 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {jobs.map((job) => {
        const image =
          job.files?.find((f) => f.isDefault) ||
          job.files?.find((f) => f.type?.startsWith("image/"));

        return (
          <div
            key={job.id}
            onClick={() => onOpen(job)}
            className="bg-white rounded-2xl border hover:border-blue-500 hover:shadow-md transition cursor-pointer overflow-hidden"
          >
            <div className="flex">
              {/* IMAGE */}

              <div className="w-44 h-32 bg-gray-100 flex items-center justify-center border-r">
                {image ? (
                  <img src={image.url} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">No Preview</span>
                )}
              </div>

              {/* INFO */}

              <div className="flex-1 p-5">
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">
                        JOB #{job.jobNumber}
                      </h3>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          STATUS[job.status]
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText size={16} />
                        Invoice #{job.invoice?.invoiceNumber}
                      </div>

                      <div className="flex items-center gap-2">
                        <Building2 size={16} />

                        {job.client?.company || "-"}
                      </div>

                      <div className="flex items-center gap-2">
                        <User size={16} />

                        {job.client?.name || "-"}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
