"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";

// Columnas del Production Board
const COLUMNS = [
  { id: "Design", title: "Design" },
  { id: "Proofing", title: "Proofing" },
  { id: "Production", title: "Production" },
  { id: "WaitingForPickup", title: "Waiting for pickup" },
  { id: "Hold", title: "Hold" },
  { id: "Finished", title: "Finished" },
];

// Formatear fecha corta
function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function OrdersBoardPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState(null);

  // ---------------------------------------------------------------------------
  // Cargar órdenes iniciales
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);

        // Esperamos que /api/orders/board devuelva algo como:
        // [
        //   { id, status, priority, clientName, productName, dueDate, customFields, ... }
        // ]
        const res = await fetch("/api/orders/board");
        if (!res.ok) throw new Error("Error al cargar órdenes");

        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las órdenes.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  // Ordenar órdenes por prioridad dentro de cada columna (opcional)
  function getOrdersByStatus(status) {
    return orders
      .filter((o) => o.status === status)
      .sort((a, b) => {
        const orderPriority = (p) => {
          if (!p) return 2;
          const val = p.toLowerCase();
          if (val === "low") return 3;
          if (val === "normal") return 2;
          if (val === "high") return 1;
          if (val === "rush") return 0;
          return 2;
        };
        return orderPriority(a.priority) - orderPriority(b.priority);
      });
  }

  // ---------------------------------------------------------------------------
  // Drag & Drop
  // ---------------------------------------------------------------------------
  function handleDragStart(e, orderId) {
    e.dataTransfer.setData("text/plain", String(orderId));
    // Para que visualmente se vea que está siendo arrastrado en algunos navegadores
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOverColumn(e) {
    // Necesario para permitir el drop
    e.preventDefault();
  }

  async function handleDropOnColumn(e, newStatus) {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("text/plain");
    if (!orderId) return;

    // Buscar la orden
    const idNum = Number(orderId);
    const existing = orders.find((o) => o.id === idNum);
    if (!existing || existing.status === newStatus) return;

    // Guardar copia para rollback si falla
    const prevOrders = [...orders];

    // Actualización optimista
    setOrders((current) =>
      current.map((o) =>
        o.id === idNum
          ? {
              ...o,
              status: newStatus,
            }
          : o
      )
    );

    try {
      setMoving(true);
      setError(null);

      // Llamada a la API para guardar el cambio en la BD
      const res = await fetch("/api/orders/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: idNum,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al actualizar el estado de la orden");
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo mover la orden, se revirtió el cambio.");
      // Rollback
      setOrders(prevOrders);
    } finally {
      setMoving(false);
    }
  }

  // Etiqueta de prioridad
  function PriorityBadge({ priority }) {
    if (!priority) return null;
    const value = priority.toLowerCase();
    let label = priority;
    let cls = "bg-slate-200 text-slate-700";

    if (value === "rush") {
      label = "Rush";
      cls = "bg-red-100 text-red-700";
    } else if (value === "high") {
      label = "High";
      cls = "bg-orange-100 text-orange-700";
    } else if (value === "normal") {
      label = "Normal";
      cls = "bg-emerald-100 text-emerald-700";
    } else if (value === "low") {
      label = "Low";
      cls = "bg-slate-100 text-slate-700";
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
      >
        {label}
      </span>
    );
  }

  // Card de cada orden
  function OrderCard({ order }) {
    return (
      <div
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-3 cursor-move hover:shadow-md transition-shadow"
        draggable
        onDragStart={(e) => handleDragStart(e, order.id)}
      >
        <div className="flex justify-between items-start gap-2 mb-1">
          <div className="font-semibold text-sm text-slate-800">
            #{order.id} {order.productName ? `· ${order.productName}` : ""}
          </div>
          <PriorityBadge priority={order.priority} />
        </div>

        {order.clientName && (
          <div className="text-xs text-slate-500 mb-1">
            Cliente:{" "}
            <span className="font-medium text-slate-700">
              {order.clientName}
            </span>
          </div>
        )}

        {order.customFields?.size && (
          <div className="text-xs text-slate-500">
            Tamaño:{" "}
            <span className="text-slate-700">{order.customFields.size}</span>
          </div>
        )}

        {order.dueDate && (
          <div className="text-xs text-slate-500 mt-1">
            Entrega:{" "}
            <span className="font-medium text-slate-700">
              {formatDate(order.dueDate)}
            </span>
          </div>
        )}

        {order.notes && (
          <div className="mt-1 text-xs text-slate-500 line-clamp-2">
            {order.notes}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Production Board
          </h1>
          <p className="text-xs text-slate-500">
            Arrastra las órdenes entre columnas para actualizar el estado.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {moving && (
            <span className="animate-pulse">Guardando cambios...</span>
          )}
          {loading && <span>Cargando órdenes...</span>}
        </div>
      </div>

      {error && (
        <div className="px-6 py-2 text-xs text-red-600 bg-red-50 border-b border-red-200">
          {error}
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-x-auto bg-slate-100">
        <div className="min-w-max flex gap-4 px-4 py-4">
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              className="w-72 flex flex-col bg-slate-50 rounded-xl border border-slate-200"
              onDragOver={handleDragOverColumn}
              onDrop={(e) => handleDropOnColumn(e, column.id)}
            >
              {/* Header columna */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-100 rounded-t-xl">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {column.title}
                </span>
                <span className="text-[11px] text-slate-500 bg-slate-200/70 rounded-full px-2 py-0.5">
                  {getOrdersByStatus(column.id).length}
                </span>
              </div>

              {/* Listado de cards */}
              <div className="flex-1 px-2 pt-2 pb-3 overflow-y-auto">
                {getOrdersByStatus(column.id).map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}

                {!loading && getOrdersByStatus(column.id).length === 0 && (
                  <div className="text-[11px] text-slate-400 text-center mt-4">
                    Sin órdenes en esta etapa.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
