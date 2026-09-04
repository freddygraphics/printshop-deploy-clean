"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PickupPage() {
  const { token } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  async function loadPickup() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/pickup/${token}`, {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result?.message || result?.error || "Invalid pickup code",
        );
      }

      setData(result);
    } catch (error) {
      console.error("❌ PICKUP LOAD ERROR:", error);

      setError(error.message || "Unable to validate pickup code.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;

    loadPickup();
  }, [token]);

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white border rounded-2xl shadow-sm px-8 py-10 text-center">
          <div className="text-lg font-semibold">Checking pickup code...</div>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR
  // ============================================

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>

          <h1 className="text-xl font-bold text-gray-900">
            Invalid Pickup Code
          </h1>

          <p className="mt-3 text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // ============================================
  // CUSTOMER VIEW
  // ============================================

  if (!data?.staff) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center text-3xl">
            ✓
          </div>

          <h1 className="mt-5 text-2xl font-bold text-[#1D2959]">
            {data?.pickedUp ? "Order Picked Up" : "Your Order is Ready"}
          </h1>

          {data?.pickedUp ? (
            <p className="mt-4 text-gray-600">
              This pickup code has already been used.
            </p>
          ) : (
            <>
              <p className="mt-4 text-gray-600 leading-7">
                Your order is ready for pickup at Freddy Graphics.
              </p>

              <div className="mt-6 bg-[#F5F7FB] border rounded-xl p-5">
                <p className="font-semibold text-[#1D2959]">
                  Please show this QR code to our staff
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  A Freddy Graphics team member will verify your order when you
                  arrive.
                </p>
              </div>
            </>
          )}

          <div className="mt-7 text-sm text-gray-500 leading-6">
            <strong className="text-gray-800">Freddy Graphics LLC</strong>
            <br />
            78 Fillmore St, 2nd Floor
            <br />
            Newark, NJ 07105
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // STAFF VIEW
  // ============================================

  const job = data.job;

  const balance = Number(job?.invoice?.balance || 0);

  const hasBalance = balance > 0.01;

  const delivered = data.pickedUp || job?.status === "Delivered";

  async function confirmPickup() {
    if (confirming) return;

    const confirmed = window.confirm(
      `Confirm pickup for Job #${job.jobNumber}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setConfirming(true);

      const res = await fetch(`/api/pickup/${token}`, {
        method: "POST",
      });

      const result = await res.json();

      if (!res.ok) {
        if (result?.error === "PAYMENT_REQUIRED") {
          alert(
            `Payment required. Balance: $${Number(result.balance || 0).toFixed(
              2,
            )}`,
          );

          return;
        }

        throw new Error(result?.message || result?.error || "Pickup failed");
      }

      await loadPickup();
    } catch (error) {
      console.error("❌ CONFIRM PICKUP ERROR:", error);

      alert(error.message || "Unable to complete pickup.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border rounded-2xl shadow-sm overflow-hidden">
        {/* STAFF HEADER */}

        <div className="bg-[#1D2959] text-white px-6 py-5">
          <p className="text-xs uppercase tracking-wider opacity-70">
            Freddy Graphics Staff
          </p>

          <h1 className="text-2xl font-bold mt-1">Pickup Verification</h1>
        </div>

        <div className="p-6">
          {/* JOB */}

          <div className="text-center border-b pb-5">
            <p className="text-sm text-gray-500">Job</p>

            <h2 className="text-3xl font-bold text-gray-900">
              #{job.jobNumber}
            </h2>

            <p className="mt-2 font-semibold">{job.client?.name}</p>

            {job.client?.company && (
              <p className="text-sm text-gray-500">{job.client.company}</p>
            )}
          </div>

          {/* INVOICE */}

          <div className="grid grid-cols-2 gap-4 py-5 border-b">
            <div>
              <p className="text-xs uppercase text-gray-400 font-semibold">
                Invoice
              </p>

              <p className="font-bold mt-1">#{job.invoice?.invoiceNumber}</p>
            </div>

            <div className="text-right">
              <p className="text-xs uppercase text-gray-400 font-semibold">
                Status
              </p>

              <p className="font-bold mt-1">{job.status}</p>
            </div>
          </div>

          {/* BALANCE */}

          <div className="py-6 text-center">
            <p className="text-sm text-gray-500">Invoice Balance</p>

            <p
              className={`text-3xl font-bold mt-1 ${
                hasBalance ? "text-red-600" : "text-green-600"
              }`}
            >
              ${balance.toFixed(2)}
            </p>

            <p
              className={`mt-2 text-sm font-semibold ${
                hasBalance ? "text-red-600" : "text-green-700"
              }`}
            >
              {hasBalance ? "Payment required before pickup" : "Paid in Full"}
            </p>
          </div>

          {/* DELIVERED */}

          {delivered && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-green-700">
              <div className="font-bold">✓ Order Delivered</div>

              {job.pickedUpAt && (
                <div className="text-sm mt-1">
                  {new Date(job.pickedUpAt).toLocaleString()}
                </div>
              )}

              {job.pickedUpBy && (
                <div className="text-sm mt-1">By {job.pickedUpBy}</div>
              )}
            </div>
          )}

          {/* PAYMENT REQUIRED */}

          {!delivered && hasBalance && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-700">
              <div className="font-bold">Payment Required</div>

              <p className="text-sm mt-1">
                Collect the outstanding balance before releasing this order.
              </p>
            </div>
          )}

          {/* CONFIRM */}

          {!delivered && !hasBalance && (
            <button
              type="button"
              onClick={confirmPickup}
              disabled={confirming}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3.5 rounded-xl font-semibold transition"
            >
              {confirming ? "Confirming..." : "Confirm Pickup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
