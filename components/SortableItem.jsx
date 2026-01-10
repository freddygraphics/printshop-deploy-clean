"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableItem({ id, order }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}
      {...attributes} {...listeners}
      className="bg-white border border-border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing">
      <p className="font-semibold">{order.client_name}</p>
      <p className="text-sm text-gray-600">{order.notes || "Sin notas"}</p>
      <p className="text-xs text-gray-400 mt-1">
        Total: ${order.total_price ? Number(order.total_price).toFixed(2) : "0.00"}
      </p>
    </div>
  );
}
