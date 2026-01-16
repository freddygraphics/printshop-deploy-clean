"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PickupPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/pickup/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setData(data);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (error)
    return <div className="p-10 text-center text-red-600">{error}</div>;

  const { job, balance } = data;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 space-y-5">
        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">Job #{job.jobNumber}</h1>
          <p className="text-gray-500">{job.client?.name}</p>
          <p className="text-sm text-gray-500">
            Invoice #{job.invoice?.invoiceNumber}
          </p>
        </div>

        {/* STATUS */}
        <div className="text-center">
          <span className="px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
            {job.status}
          </span>
        </div>

        {/* BALANCE */}
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">Balance</p>
          <p
            className={`text-xl font-bold ${
              balance > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            ${balance.toFixed(2)}
          </p>
        </div>

        {/* ACTION */}
        {job.status !== "Delivered" && balance === 0 && (
          <button
            onClick={async () => {
              const res = await fetch(`/api/pickup/${token}`, {
                method: "POST",
              });
              const updated = await res.json();
              if (res.ok) {
                alert("✅ Job marked as Delivered");
                location.reload();
              } else {
                alert(updated.error);
              }
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
          >
            Mark as Delivered
          </button>
        )}

        {balance > 0 && (
          <div className="text-center text-red-600 font-semibold">
            ❌ Payment required before pickup
          </div>
        )}

        {job.status === "Delivered" && (
          <div className="text-center text-green-700 font-semibold">
            📦 Delivered on {new Date(job.pickedUpAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
