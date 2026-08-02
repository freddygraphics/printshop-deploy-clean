"use client";

export default function DocumentDetailsCard({
  title,
  selectedClient,
  statusContent,
  team,
  primaryDateLabel,
  primaryDate,
  onPrimaryDateChange,
  secondaryDateLabel,
  secondaryDate,
  onSecondaryDateChange,
  onDatesBlur,
  headerActions,
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

  return (
    <div className="w-full rounded-xl border bg-white shadow-md">
      {/* HEADER */}
      <div className="flex items-center justify-between rounded-t-xl border-b bg-gray-50 px-6 py-4">
        <h2 className="text-xl font-bold">{title}</h2>

        {headerActions && (
          <div className="flex items-center gap-4">{headerActions}</div>
        )}
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

            {statusContent}
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
                    onClick={() => onOpenAssignModal?.(role.key)}
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
              <p className="text-xs text-gray-500">{primaryDateLabel}</p>

              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-4 py-2.5"
                value={primaryDate || ""}
                onChange={(event) => onPrimaryDateChange?.(event.target.value)}
                onBlur={onDatesBlur}
              />
            </div>

            <div>
              <p className="text-xs text-gray-500">{secondaryDateLabel}</p>

              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-4 py-2.5"
                value={secondaryDate || ""}
                onChange={(event) =>
                  onSecondaryDateChange?.(event.target.value)
                }
                onBlur={onDatesBlur}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
