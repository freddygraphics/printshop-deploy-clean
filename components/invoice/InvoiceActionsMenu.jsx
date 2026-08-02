"use client";

import { useEffect, useRef, useState } from "react";

export default function InvoiceActionsMenu({
  isVoid,
  canVoid,
  publicInvoiceLink,
  onRecordPayment,
  onVoid,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleCopyPaymentLink = async () => {
    if (!publicInvoiceLink) {
      alert("Public invoice link not ready yet");
      return;
    }

    try {
      await navigator.clipboard.writeText(publicInvoiceLink);

      alert("Public invoice link copied ✅");
      setOpen(false);
    } catch (error) {
      console.error("Error copying payment link:", error);

      alert("Could not copy the payment link.");
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white hover:bg-gray-100"
        aria-label="Invoice actions"
      >
        ⋯
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border bg-white shadow-lg">
          {!isVoid && (
            <button
              type="button"
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              onClick={() => {
                setOpen(false);
                onRecordPayment();
              }}
            >
              Record Payment
            </button>
          )}

          <button
            type="button"
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            onClick={handleCopyPaymentLink}
          >
            Copy Payment Link
          </button>

          {canVoid && (
            <>
              <div className="my-1 border-t" />

              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                onClick={() => {
                  setOpen(false);
                  onVoid();
                }}
              >
                Void
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
