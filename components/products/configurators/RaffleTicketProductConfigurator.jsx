"use client";

import RaffleTicketCalculator from "@/components/RaffleTicketCalculator";

export default function RaffleTicketProductConfigurator({
  product,
  onChange,
  initialData = null,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
      <RaffleTicketCalculator
        product={product}
        initialData={
          initialData || {
            productId: product.id,
            product,
            name: product.name,
            description: product.name,
            qty: 1,
            unitPrice: 0,
            total: 0,
            options: product.defaultOptions || {},
          }
        }
        onAdd={(item) => {
          const itemName = item.description || item.name || product.name;

          onChange?.({
            ...item,

            productId: product.id,
            product,

            name: itemName,
            description: itemName,

            qty: Number(item.qty || 1),
            unitPrice: Number(item.unitPrice || 0),
            subtotal: Number(item.total || 0),
            total: Number(item.total || 0),

            options: {
              ...(product.defaultOptions || {}),
              ...(item.options || {}),
              templateType: "raffle-tickets",
            },

            _expanded: false,
          });
        }}
      />
    </div>
  );
}
