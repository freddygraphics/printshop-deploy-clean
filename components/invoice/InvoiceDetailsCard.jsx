"use client";

export default function InvoiceDetailsCard({
  selectedClient,
  status,
  team,
  issuedAt,
  setIssuedAt,
  expiryDate,
  setExpiryDate,
  updateDates,
  onOpenCustomerModal,
  onOpenAssignModal,
}) {
  const roles = [
    {
      label: "Sales Rep",
      key: "salesRep",
    },
    {
      label: "Production Manager",
      key: "productionManager",
    },
    {
      label: "Project Manager",
      key: "projectManager",
    },
  ];

  const statusClasses =
    status === "Paid"
      ? "bg-green-100 text-green-700"
      : status === "Partially Paid"
        ? "bg-yellow-100 text-yellow-700"
        : status === "Overdue"
          ? "bg-red-100 text-red-700"
          : status === "Void"
            ? "bg-gray-200 text-gray-600"
            : "bg-blue-100 text-blue-700";

  return (
    <div className="mx-auto mb-10 rounded-xl border bg-white shadow-md">
      {/* HEADER */}
      <div className="flex items-center justify-between rounded-t-xl border-b bg-gray-50 px-6 py-4">
        <h2 className="text-xl font-bold">Invoice Details</h2>

        <button
          type="button"
          onClick={onOpenCustomerModal}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white shadow hover:bg-blue-700"
        >
          {selectedClient ? "Change Customer" : "+ Add Customer"}
        </button>
      </div>

      {/* CONTENT */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* CUSTOMER */}
          <div className="space-y-4">
            <h4 className="text-xl font-bold text-gray-900">Customer</h4>

            {selectedClient ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-[#91969C]">
                    Customer
                  </p>

                  <p className="text-xl font-semibold text-gray-900">
                    {selectedClient.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#91969C]">
                    Business Name
                  </p>

                  <p className="text-xl font-semibold text-gray-900">
                    {selectedClient.company || "Primary Contact"}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">No customer selected</p>
            )}
          </div>

          {/* STATUS */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-gray-900">Status</h4>

            <span
              className={`inline-block px-3 py-1 text-lg font-semibold ${statusClasses}`}
            >
              {status}
            </span>
          </div>

          {/* TEAM ASSIGNMENTS */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-gray-900">
              Team Assignments
            </h4>

            {roles.map((role) => {
              const assignedMember = team?.[role.key];

              return (
                <div
                  key={role.key}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm text-gray-700">{role.label}</p>

                    {assignedMember && (
                      <p className="text-xs text-gray-500">
                        {assignedMember.name}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenAssignModal(role.key)}
                    className="text-blue-600 hover:text-blue-800"
                    aria-label={`Assign ${role.label}`}
                  >
                    ✏️
                  </button>
                </div>
              );
            })}
          </div>

          {/* DATES */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Dates</h4>

            <div>
              <p className="text-xs text-gray-500">Invoice Date</p>

              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-4 py-2.5"
                value={issuedAt}
                onChange={(event) => setIssuedAt(event.target.value)}
                onBlur={updateDates}
              />
            </div>

            <div>
              <p className="text-xs text-gray-500">Due Date</p>

              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-4 py-2.5"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                onBlur={updateDates}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
