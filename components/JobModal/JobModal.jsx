"use client";

import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";

import JobTabs from "./JobTabs";
import Link from "next/link";
import JobDescriptionEditor from "./JobDescriptionEditor";
import JobFileUpload from "@/components/JobFileUpload";
import JobAttachments from "./JobAttachments";
import Barcode from "react-barcode";
import ConfirmPickupDialog from "@/components/dialogs/ConfirmPickupDialog";
import PaymentRequiredDialog from "@/components/dialogs/PaymentRequiredDialog";
const STATUS_STYLE = {
  Pending: "bg-gray-100 text-gray-700",
  Design: "bg-blue-100 text-blue-700",
  Production: "bg-amber-100 text-amber-700",
  Ready: "bg-emerald-100 text-emerald-700",
  Delivered: "bg-slate-200 text-slate-700",
};

export default function JobModal({ job, onClose }) {
  const [files, setFiles] = useState([]);
  const [showConfirmPickup, setShowConfirmPickup] = useState(false);

  const [paymentDialog, setPaymentDialog] = useState({
    open: false,
    invoiceId: null,
    invoiceNumber: null,
    balance: 0,
  });
  async function approveProof() {
    try {
      const res = await fetch(`/api/jobs/${job.id}/status`, {
        method: "PUT", // 👈 IMPORTANTE
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Production" }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      onClose(); // refresca board
    } catch (err) {
      console.error("❌ Approve proof failed:", err);
    }
  }

  const sortedFiles = [...files].sort((a, b) =>
    a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1,
  );
  const items = job.invoice?.invoiceItems || [];
  const [activeTab, setActiveTab] = useState("details");
  const [description, setDescription] = useState("");
  const saveTimeout = useRef(null);
  const lastSaved = useRef("");
  useEffect(() => {
    const initial = job?.description || "";
    setDescription(initial);
    lastSaved.current = initial;
  }, [job]);
  useEffect(() => {
    setFiles(job?.files || []);
  }, [job]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  if (!job) return null;

  function handleDescriptionChange(value) {
    setDescription(value);

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(async () => {
      if (!job?.id) return;
      if (value === lastSaved.current) return;

      await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: value }),
      });

      lastSaved.current = value;
    }, 1200); // ⏱ debounce PRO
  }
  const previewFile =
    sortedFiles.find((f) => f.isDefault) || sortedFiles[0] || null;
  async function completePickup() {
    setShowConfirmPickup(false);

    const pickupRes = await fetch(`/api/jobs/${job.id}/pickup`, {
      method: "PATCH",
    });

    const pickupData = await pickupRes.json();

    if (!pickupRes.ok) {
      if (pickupData.error === "PAYMENT_REQUIRED") {
        setPaymentDialog({
          open: true,
          invoiceId: pickupData.invoiceId,
          invoiceNumber: pickupData.invoiceNumber,
          balance: pickupData.balance,
        });
        return;
      }

      alert(pickupData.error || "Unable to complete pickup.");
      return;
    }

    onClose();
  }
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

                <div>
                  <div className="text-m text-gray-400">Status</div>
                  <div className="font-medium">{job.status}</div>
                </div>
              </div>

              <div className="mt-4 px-6 pb-6">
                <div className="text-m font-semibold text-gray-700 mb-2">
                  Products
                </div>

                {items.length === 0 ? (
                  <div className="text-sm text-gray-500 italic">
                    No products in invoice
                  </div>
                ) : (
                  <div className="border rounded-lg divide-y bg-white">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-4 py-3 text-sm"
                      >
                        <div className="font-medium text-gray-900">
                          {item.name}
                        </div>

                        <div className="text-gray-600">Qty: {item.qty}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 px-6 pb-6">
                <h3 className="text-m font-semibold text-gray-700 mb-2">
                  Description
                </h3>

                <JobDescriptionEditor
                  value={description}
                  onChange={handleDescriptionChange}
                />
              </div>

              <div className="px-6 pb-6">
                <JobAttachments
                  jobId={job.id}
                  files={sortedFiles}
                  onDelete={(fileId) => {
                    setFiles((prev) => prev.filter((f) => f.id !== fileId));
                  }}
                  onUploaded={(newFiles) => {
                    setFiles(newFiles);
                  }}
                />
              </div>
            </div>

            {/* RIGHT */}
            <div className="col-span-4 bg-gray-50 p-6 flex flex-col gap-8">
              <div></div>

              <div className="px-6 py-5 grid grid-cols-1 gap-6">
                <div>
                  {previewFile ? (
                    <div className="w-full overflow-hidden ">
                      <img
                        src={previewFile.url}
                        alt="Proof preview"
                        className="w-full h-64 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center rounded-xl text-gray-400 text-sm rounded-xl border">
                      No proof uploaded
                    </div>
                  )}
                  {job.status === "Proofing" && (
                    <button
                      onClick={approveProof}
                      className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl transition"
                    >
                      Approve Proof
                    </button>
                  )}

                  {job.status === "Ready" && job.invoice?.invoiceNumber && (
                    <div className="mt-6 flex flex-col items-center gap-3">
                      <div className="text-sm font-medium text-gray-600">
                        Pickup Barcode
                      </div>

                      <Barcode
                        value={`INV-${job.invoice.invoiceNumber}`}
                        format="CODE128"
                        width={2}
                        height={70}
                        displayValue={true}
                      />

                      <button
                        onClick={() => window.print()}
                        className="mt-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm"
                      >
                        Print Barcode
                      </button>
                      <button
                        onClick={() => setShowConfirmPickup(true)}
                        className="mt-3 w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
                      >
                        Complete Pickup
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmPickupDialog
        open={showConfirmPickup}
        onClose={() => setShowConfirmPickup(false)}
        onConfirm={completePickup}
        invoiceNumber={job.invoice?.invoiceNumber}
      />

      <PaymentRequiredDialog
        open={paymentDialog.open}
        onClose={() =>
          setPaymentDialog({
            ...paymentDialog,
            open: false,
          })
        }
        invoiceId={paymentDialog.invoiceId}
        invoiceNumber={paymentDialog.invoiceNumber}
        balance={paymentDialog.balance}
      />
    </>
  );
}
