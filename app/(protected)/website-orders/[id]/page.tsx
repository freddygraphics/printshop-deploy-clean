"use client";

import { formatOrderNumber } from "@/lib/order-number";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Package,
  User,
  MapPin,
  Store,
  CreditCard,
} from "lucide-react";

type OrderItem = {
  productId?: number;
  productName?: string;
  image?: string;
  qty?: number;
  price?: number;
  options?: Array<{
    optionKey?: string;
    optionName?: string;
    valueKey?: string;
    valueLabel?: string;
    price?: number;
    priceType?: string;
  }>;
};

type WebsiteOrder = {
  id: number;
  status: string;
  priority?: string | null;
  notes?: string | null;
  createdAt: string;

  client?: {
    id: number;
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  } | null;

  customFields?: {
    source?: string;

    customer?: {
      fullName?: string;
      businessName?: string;
      email?: string;
      phone?: string;
    };

    shipping?: {
      trackingNumber?: string;
      trackingUrl?: string;
    };

    fulfillment?: {
      method?: "pickup" | "shipping";
      address?: string;
      address2?: string;
      city?: string;
      state?: string;
      zip?: string;
    };

    items?: OrderItem[];

    pricing?: {
      subtotal?: number;
      shippingFee?: number;
      salesTax?: number;
      total?: number;
    };

    squarePayment?: {
      id?: string;
      status?: string;
      receiptUrl?: string;
      orderId?: string;
    };

    artworkStatus?: string;
  } | null;
};

export default function WebsiteOrderDetailPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [savingTracking, setSavingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [trackingSaved, setTrackingSaved] = useState(false);

  const [updatingArtwork, setUpdatingArtwork] = useState(false);
  const [artworkError, setArtworkError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");
  async function updateStatus(newStatus: string) {
    if (!order) return;

    try {
      setUpdatingStatus(true);
      setStatusError("");

      const response = await fetch(`/api/website-orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not update status.");
      }

      setOrder((current) =>
        current
          ? {
              ...current,
              status: data.order.status,
            }
          : current,
      );
    } catch (err) {
      console.error("Status update error:", err);

      setStatusError(
        err instanceof Error ? err.message : "Could not update status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  }
  const params = useParams<{ id: string }>();

  const id = params?.id ?? "";

  const [order, setOrder] = useState<WebsiteOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function saveTracking() {
    if (!order) return;

    try {
      setSavingTracking(true);
      setTrackingError("");
      setTrackingSaved(false);

      const response = await fetch(`/api/website-orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackingNumber,
          trackingUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not save tracking information.");
      }

      setOrder((current) =>
        current
          ? {
              ...current,
              customFields: {
                ...(current.customFields || {}),
                shipping: {
                  trackingNumber,
                  trackingUrl,
                },
              },
            }
          : current,
      );

      setTrackingSaved(true);
    } catch (err) {
      setTrackingError(
        err instanceof Error
          ? err.message
          : "Could not save tracking information.",
      );
    } finally {
      setSavingTracking(false);
    }
  }

  async function updateArtworkStatus(newArtworkStatus: string) {
    if (!order) return;

    try {
      setUpdatingArtwork(true);
      setArtworkError("");

      const response = await fetch(`/api/website-orders/${order.id}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          artworkStatus: newArtworkStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not update artwork status.");
      }

      setOrder((current) => {
        if (!current) return current;

        return {
          ...current,

          customFields: {
            ...(current.customFields || {}),
            artworkStatus: newArtworkStatus,
          },
        };
      });
    } catch (err) {
      console.error("Artwork status update error:", err);

      setArtworkError(
        err instanceof Error ? err.message : "Could not update artwork status.",
      );
    } finally {
      setUpdatingArtwork(false);
    }
  }
  useEffect(() => {
    if (!id) return;

    async function loadOrder() {
      try {
        const response = await fetch(`/api/website-orders/${id}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Could not load website order.");
        }

        setOrder(data.order);

        const shipping = data.order?.customFields?.shipping || {};

        setTrackingNumber(shipping.trackingNumber || "");

        setTrackingUrl(shipping.trackingUrl || "");
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error ? err.message : "Could not load website order.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] px-6 py-8">
        <div className="mx-auto max-w-6xl">Loading order...</div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error || "Order not found."}
          </div>
        </div>
      </main>
    );
  }

  const customFields = order.customFields || {};

  const items = customFields.items || [];

  const pricing = customFields.pricing || {};

  const fulfillment = customFields.fulfillment || {};

  const payment = customFields.squarePayment || {};

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/website-orders"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#1D2959]"
        >
          <ArrowLeft size={18} />
          Back to Website Orders
        </Link>

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <Package size={28} className="text-[#1D2959]" />

              <h1 className="text-3xl font-semibold text-gray-900">
                Website Order #{formatOrderNumber(order.id)}
              </h1>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Created {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-3">
            <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              {payment.status || "UNKNOWN"}
            </span>

            <select
              value={order.status}
              disabled={updatingStatus}
              onChange={(event) => updateStatus(event.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#1D2959] outline-none focus:border-[#1D2959] disabled:opacity-50"
            >
              <option value="Design">Design</option>

              <option value="Production">Production</option>

              <option value="Ready">Ready</option>

              <option value="Shipped">Shipped</option>

              <option value="Completed">Completed</option>

              <option value="Cancelled">Cancelled</option>
            </select>
            {statusError && (
              <p className="text-sm font-medium text-red-600">{statusError}</p>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* CUSTOMER */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <User size={22} className="text-[#1D2959]" />

                <h2 className="text-xl font-semibold text-gray-900">
                  Customer
                </h2>
              </div>

              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <p>
                  <span className="font-semibold">Name:</span>{" "}
                  {order.client?.name || customFields.customer?.fullName || "-"}
                </p>

                <p>
                  <span className="font-semibold">Business:</span>{" "}
                  {order.client?.company ||
                    customFields.customer?.businessName ||
                    "-"}
                </p>

                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  {order.client?.email || customFields.customer?.email || "-"}
                </p>

                <p>
                  <span className="font-semibold">Phone:</span>{" "}
                  {order.client?.phone || customFields.customer?.phone || "-"}
                </p>
              </div>
            </section>

            {/* FULFILLMENT */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Fulfillment
              </h2>

              {fulfillment.method === "shipping" ? (
                <div className="mt-5 flex gap-3">
                  <MapPin size={22} className="mt-0.5 text-[#1D2959]" />

                  <div className="text-sm text-gray-600">
                    <p className="font-semibold text-gray-900">Shipping</p>

                    <p className="mt-2">{fulfillment.address}</p>

                    {fulfillment.address2 && <p>{fulfillment.address2}</p>}

                    <p>
                      {fulfillment.city}, {fulfillment.state} {fulfillment.zip}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex gap-3">
                  <Store size={22} className="text-[#1D2959]" />

                  <div>
                    <p className="font-semibold">Pickup</p>

                    <p className="mt-1 text-sm text-gray-500">
                      Customer will pick up the completed order.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* PRODUCTS */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-gray-900">Products</h2>

              <div className="mt-5 space-y-6">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0"
                  >
                    <div className="flex gap-4">
                      {item.image && (
                        <div className="h-24 w-24 shrink-0 overflow-hidden bg-gray-100">
                          <img
                            src={item.image}
                            alt={item.productName || "Product"}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold text-[#1D2959]">
                              {item.productName}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              Quantity: {item.qty}
                            </p>
                          </div>

                          <p className="font-semibold text-gray-900">
                            ${Number(item.price || 0).toFixed(2)}
                          </p>
                        </div>

                        {item.options && item.options.length > 0 && (
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {item.options.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className="rounded-md bg-gray-50 px-3 py-2 text-sm"
                              >
                                <span className="font-semibold text-gray-700">
                                  {option.optionName}:
                                </span>{" "}
                                <span className="text-gray-600">
                                  {option.valueLabel}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT SIDE */}
          <aside className="space-y-6">
            {/* PAYMENT */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <CreditCard size={22} className="text-[#1D2959]" />

                <h2 className="text-xl font-semibold text-gray-900">
                  Payment Summary
                </h2>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>

                  <span>${Number(pricing.subtotal || 0).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>
                    {fulfillment.method === "shipping" ? "Shipping" : "Pickup"}
                  </span>

                  <span>
                    {Number(pricing.shippingFee || 0) === 0
                      ? "FREE"
                      : `$${Number(pricing.shippingFee || 0).toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Sales Tax</span>

                  <span>${Number(pricing.salesTax || 0).toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total Paid</span>

                    <span className="text-2xl font-bold text-[#1D2959]">
                      ${Number(pricing.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm font-semibold text-green-700">
                <CheckCircle2 size={18} />
                Payment {payment.status || "UNKNOWN"}
              </div>

              {payment.receiptUrl && (
                <a
                  href={payment.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block rounded-md border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-[#1D2959] hover:bg-gray-50"
                >
                  View Square Receipt
                </a>
              )}
            </section>

            {/* SQUARE */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Square</h2>

              <div className="mt-4 space-y-3 text-xs text-gray-500">
                <div>
                  <p className="font-semibold text-gray-700">Payment ID</p>

                  <p className="mt-1 break-all">{payment.id || "-"}</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-700">Square Order ID</p>

                  <p className="mt-1 break-all">{payment.orderId || "-"}</p>
                </div>
              </div>
            </section>

            {/* ARTWORK */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Artwork Status
              </h2>

              <select
                value={customFields.artworkStatus || "DESIGN_REQUIRED"}
                disabled={updatingArtwork}
                onChange={(event) => updateArtworkStatus(event.target.value)}
                className="mt-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#1D2959] outline-none focus:border-[#1D2959] disabled:opacity-50"
              >
                <option value="DESIGN_REQUIRED">Design Required</option>

                <option value="WAITING_FOR_ARTWORK">Waiting for Artwork</option>

                <option value="ARTWORK_RECEIVED">Artwork Received</option>

                <option value="APPROVED">Artwork Approved</option>
              </select>

              {artworkError && (
                <p className="mt-2 text-sm font-medium text-red-600">
                  {artworkError}
                </p>
              )}
            </section>
            {fulfillment.method === "shipping" && (
              <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Shipping Tracking
                </h2>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Tracking Number
                    </label>

                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(event) =>
                        setTrackingNumber(event.target.value)
                      }
                      placeholder="Enter tracking number"
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1D2959]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Tracking URL
                    </label>

                    <input
                      type="url"
                      value={trackingUrl}
                      onChange={(event) => setTrackingUrl(event.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1D2959]"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={savingTracking}
                    onClick={saveTracking}
                    className="w-full rounded-lg bg-[#1D2959] px-4 py-3 text-sm font-semibold text-white hover:bg-[#DF8500] disabled:opacity-50"
                  >
                    {savingTracking ? "Saving..." : "Save Tracking"}
                  </button>

                  {trackingSaved && (
                    <p className="text-sm font-medium text-green-600">
                      Tracking saved.
                    </p>
                  )}

                  {trackingError && (
                    <p className="text-sm font-medium text-red-600">
                      {trackingError}
                    </p>
                  )}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}





