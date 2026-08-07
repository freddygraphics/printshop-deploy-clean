"use client";

import RaffleTicketCalculator from "@/components/RaffleTicketCalculator";

export default function RaffleTicketProductConfigurator({
  product,
  onChange,
  initialData = null,
}) {
  return (
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
      onChange={(item) => {
        const itemName = item.description || item.name || product.name;

        onChange?.({
          ...item,

          productId: product.id,
          product,

          name: itemName,
          description: itemName,

          qty: Number(item.qty || item.quantity || 1),
          quantity: Number(item.quantity || item.qty || 1),

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
  );
}
