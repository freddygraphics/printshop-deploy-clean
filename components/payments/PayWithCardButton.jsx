"use client";

export default function PayWithCardButton({ invoiceId, amount }) {
  async function payWithCard() {
    console.log("CLICK PAY", invoiceId, amount);

    const res = await fetch("/api/payments/square/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId,
        amount,
        label: `Invoice #${invoiceId}`,
      }),
    });

    console.log("FETCH STATUS", res.status);

    const data = await res.json();
    console.log("SQUARE RESPONSE", data);

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Payment error");
    }
  }

  return (
    <button
      onClick={payWithCard}
      className="w-full bg-black text-white py-3 rounded-xl text-lg"
    >
      Pay with Card
    </button>
  );
}
