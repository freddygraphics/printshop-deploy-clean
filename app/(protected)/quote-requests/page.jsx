import Link from "next/link";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function QuoteRequestsPage() {
  const requests = await prisma.quoteRequest.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>

        <p className="mt-1 text-sm text-gray-500">
          Requests submitted from your website.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#ededed] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FBFBFB]">
              <tr className="border-b border-[#ededed]">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Customer
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Product
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Date
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-14 text-center text-sm text-gray-500"
                  >
                    No quote requests yet.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-[#ededed] last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        {request.name}
                      </div>

                      <div className="mt-1 text-sm text-gray-500">
                        {request.email}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-700">
                      {request.productName}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={request.status} />
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(request.createdAt)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/quote-requests/${request.id}`}
                        className="inline-flex items-center rounded-lg border border-[#ededed] px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}
