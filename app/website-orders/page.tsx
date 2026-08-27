"use client";

import { formatOrderNumber } from "@/lib/order-number";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, ChevronRight, Package } from "lucide-react";

type WebsiteOrder = {
  id: number;
  status: string;
  priority?: string | null;
  createdAt: string;

  client?: {
    id: number;
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;

  customFields?: {
    source?: string;

    fulfillment?: {
      method?: "pickup" | "shipping";
    };

    pricing?: {
      subtotal?: number;
      shippingFee?: number;
      salesTax?: number;
      total?: number;
    };

    items?: Array<{
      productName?: string;
      qty?: number;
      price?: number;
    }>;

    squarePayment?: {
      id?: string;
      status?: string;
    };
  } | null;
};

export default function WebsiteOrdersPage() {
  const [orders, setOrders] = useState<WebsiteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/website-orders", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Could not load website orders.");
        }

        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error ? err.message : "Could not load website orders.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <ShoppingBag size={28} className="text-[#1D2959]" />

              <h1 className="text-3xl font-semibold text-gray-900">
                Website Orders
              </h1>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Orders paid through freddygraphics.com
            </p>
          </div>

          <div className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600">
            {orders.length} Orders
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-8">
            Loading orders...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <Package size={44} className="mx-auto text-gray-300" />

            <h2 className="mt-4 text-xl font-semibold">
              No website orders yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Paid website orders will appear here automatically.
            </p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-4">Order</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Products</th>
                    <th className="px-5 py-4">Fulfillment</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4"></th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => {
                    const customFields = order.customFields || {};

                    const items = customFields.items || [];

                    const pricing = customFields.pricing || {};

                    const fulfillment = customFields.fulfillment;

                    const payment = customFields.squarePayment;

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-[#1D2959]">
                              #{formatOrderNumber(order.id)}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">
                            {order.client?.name || "-"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {order.client?.email || ""}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-800">
                            {items.length}{" "}
                            {items.length === 1 ? "Product" : "Products"}
                          </p>

                          {items[0]?.productName && (
                            <p className="mt-1 max-w-[240px] truncate text-xs text-gray-500">
                              {items[0].productName}
                              {items.length > 1
                                ? ` +${items.length - 1} more`
                                : ""}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
                            {fulfillment?.method || "pickup"}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-semibold text-gray-900">
                          ${Number(pricing.total || 0).toFixed(2)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              payment?.status === "COMPLETED"
                                ? "bg-green-50 text-green-700"
                                : "bg-yellow-50 text-yellow-700"
                            }`}
                          >
                            {payment?.status || "UNKNOWN"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {order.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/website-orders/${order.id}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:border-[#1D2959] hover:text-[#1D2959]"
                          >
                            <ChevronRight size={18} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}



