"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TapToPayPage({ params }) {
  const router = useRouter();
  const id = params.id;

  useEffect(() => {
    async function startPayment() {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();

      if (!res.ok) {
        alert("Invoice not found");
        return;
      }

      const cents = Math.round(data.total * 100);
      const notes = encodeURIComponent(`Invoice ${data.id} – Freddy Graphics LLC`);

      const deepLink = `square-commerce://payment/create?amount=${cents}&currency=USD&notes=${notes}`;

      // Intentar abrir Square POS
      window.location.href = deepLink;

      // Si Square no abre, mostrar mensaje
      setTimeout(() => {
        alert("If nothing opened, make sure Square POS is installed.");
      }, 1200);
    }

    startPayment();
  }, [id]);

  return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-lg text-gray-700">
        Opening Square POS…
      </p>
    </div>
  );
}
