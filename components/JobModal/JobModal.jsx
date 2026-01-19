"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import JobQRCode from "@/components/JobQRCode";
import JobTabs from "./JobTabs";
import Link from "next/link";

const STATUS_STYLE = {
  Pending: "bg-gray-100 text-gray-700",
  Design: "bg-blue-100 text-blue-700",
  Production: "bg-amber-100 text-amber-700",
  Ready: "bg-emerald-100 text-emerald-700",
  Delivered: "bg-slate-200 text-slate-700",
};

export default function JobModal({ job, onClose }) {
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  if (!job) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-[1100px] bg-white rounded-xl shadow-xl overflow-hidden border">
          {/* HEADER */}
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <div>
              <div className="text-xl text-gray-400 flex items-center gap-2">
                {job.invoice ? (
                  <Link
                    href={`/invoices/${job.invoice.id}`}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-m hover:bg-blue-700 transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Invoice #{job.invoice.invoiceNumber}
                  </Link>
                ) : (
                  <span>Invoice —</span>
                )}
                <span className="text-gray-400">•</span>
                <span>JOB #{job.jobNumber}</span>
              </div>

              <div className="flex items-center gap-3"></div>
            </div>

            <button onClick={onClose}>
              <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
            </button>
          </div>

          {/* BODY */}
          <div className="grid grid-cols-12 min-h-[520px]">
            {/* LEFT */}
            <div className="col-span-8 border-r">
              <div className="px-6 py-5 grid grid-cols-2 gap-6">
                <div>
                  <div className="text-m text-gray-400">Customer</div>
                  <div className="font-medium">{job.client?.name || "—"}</div>
                </div>

                <div>
                  <div className="text-m text-gray-400">Company name</div>
                  <div className="font-medium">
                    {job.client?.company || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-m text-gray-400">Team</div>
                  <div className="font-medium">
                    {" "}
                    {job.assignedTo || "Unassigned"}
                  </div>
                </div>
              </div>

              {/* Tabs + Content */}
              <JobTabs
                job={job}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>

            {/* RIGHT */}
            <div className="col-span-4 bg-gray-50 p-6 flex flex-col gap-8">
              <div>
                <div className="flex justify-center">
                  <JobQRCode job={job} />
                </div>
              </div>

              <div className="px-6 py-5 grid grid-cols-1 gap-6">
                <div>
                  <div className="uppercase bg-green-600 text-white px-3 py-1.5 rounded-md text-xl flex items-center justify-center">
                    {job.status}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
