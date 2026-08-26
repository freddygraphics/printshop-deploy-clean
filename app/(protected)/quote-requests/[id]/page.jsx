import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function QuoteRequestDetailPage({ params }) {
  const { id } = params;

  const request = await prisma.quoteRequest.findUnique({
    where: {
      id,
    },
    include: {
      product: true,
    },
  });

  if (!request) {
    notFound();
  }

  const options =
    request.options && typeof request.options === "object"
      ? request.options
      : {};

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/quote-requests"
            className="mb-3 inline-block text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            ← Back to Quote Requests
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">Quote Request</h1>

          <p className="mt-1 text-sm text-gray-500">Request ID: {request.id}</p>
        </div>

        <StatusBadge status={request.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* MAIN */}
        <div className="space-y-6 lg:col-span-2">
          {/* CUSTOMER */}
          <div className="rounded-xl border border-[#ededed] bg-white p-6">
            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Customer
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem label="Name" value={request.name} />

              <DetailItem
                label="Business Name"
                value={request.businessName || "Not provided"}
              />

              <DetailItem label="Email" value={request.email} />

              <DetailItem
                label="Phone"
                value={request.phone || "Not provided"}
              />
            </div>
          </div>

          {/* PRODUCT + OPTIONS */}
          <div className="rounded-xl border border-[#ededed] bg-white p-6">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Product Details
            </h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Product" value={request.productName} />

              <DetailItem label="Quantity" value={String(request.qty || 1)} />

              {request.options?.dynamicOptions &&
                Object.entries(request.options.dynamicOptions).map(
                  ([key, value]) => (
                    <DetailItem
                      key={key}
                      label={formatLabel(key)}
                      value={formatOptionValue(value)}
                    />
                  ),
                )}
            </div>

            {(!request.options?.dynamicOptions ||
              Object.keys(request.options.dynamicOptions).length === 0) && (
              <p className="mt-5 text-sm text-gray-500">
                No product options were submitted.
              </p>
            )}
          </div>

          {/* NOTES */}
          <div className="rounded-xl border border-[#ededed] bg-white p-6">
            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Customer Notes
            </h2>

            {request.notes ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {request.notes}
              </p>
            ) : (
              <p className="text-sm text-gray-500">No notes were submitted.</p>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[#ededed] bg-white p-6">
            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Request Details
            </h2>

            <div className="space-y-5">
              <DetailItem label="Status" value={request.status} />

              <DetailItem
                label="Submitted"
                value={new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(request.createdAt)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    NEW: "bg-blue-50 text-blue-700",
    REVIEWING: "bg-yellow-50 text-yellow-700",
    QUOTED: "bg-purple-50 text-purple-700",
    APPROVED: "bg-green-50 text-green-700",
    REJECTED: "bg-red-50 text-red-700",
    CLOSED: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

function formatLabel(value) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}
function formatOptionValue(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
