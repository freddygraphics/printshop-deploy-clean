"use client";

import { X } from "lucide-react";
import Dialog from "./Dialog";

export default function UnsavedChangesDialog({
  open,
  onClose,
  onSaveDraft,
  onDiscard,
  isSaving = false,
  documentType = "quote",
}) {
  const documentName = documentType === "invoice" ? "invoice" : "quote";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title=""
      maxWidth="max-w-2xl"
      showCloseButton={false}
    >
      <div className="relative">
        {/* Top actions */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-900 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="rounded-full bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-950 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save as Draft"}
            </button>

            <button
              type="button"
              onClick={onDiscard}
              disabled={isSaving}
              className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Discard
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pb-3">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-950">
            Discard these changes?
          </h2>

          <p className="mt-8 text-sm leading-6 text-gray-700">
            If you don't save this {documentName} as a draft, your changes will
            be lost.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
