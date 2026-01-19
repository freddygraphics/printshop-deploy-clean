"use client";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function PayRedirectPage() {
  const { token } = useParams();

  useEffect(() => {
    async function startPayment() {
      const res = await fetch("/api/payments/square/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert("Unable to start payment");
      }
    }

    startPayment();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Redirecting to secure payment…</p>
    </div>
  );
}
