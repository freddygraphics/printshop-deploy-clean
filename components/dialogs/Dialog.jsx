"use client";

import { X } from "lucide-react";

export default function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-md",
  showCloseButton = true,
}) {
  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className={`
            w-full
            ${maxWidth}
            rounded-2xl
            border
            border-gray-200
            bg-white
            shadow-[0_20px_60px_rgba(0,0,0,.18)]
            animate-in
            fade-in
            zoom-in-95
            duration-200
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-5">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              {title}
            </h2>

            {showCloseButton && (
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-5">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex justify-end gap-3 rounded-b-2xl border-t bg-gray-50 px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
