"use client";

import { documentText } from "@/components/document/documentStyles";

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
    <div className="w-full rounded-xl border bg-white shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between rounded-t-xl border-b bg-gray-50 px-6 py-4">
        <h2 className={documentText.title}>{title}</h2>

        {headerActions && (
          <div className="flex items-center gap-4">{headerActions}</div>
        )}
      </div>

      {/* CONTENT */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* CUSTOMER */}
          <div className="space-y-4">
            <h4 className={documentText.sectionTitle}>Customer</h4>

            {selectedClient ? (
              <>
                <div>
                  <p className={documentText.label}>Customer</p>

                  <p className={documentText.value}>{selectedClient.name}</p>
                </div>

                <div>
                  <p className={documentText.label}>Business Name</p>

                  <p className={documentText.value}>
                    {selectedClient.company || "Primary Contact"}
                  </p>
                </div>
              </>
            ) : (
              <p className={documentText.secondary}>No customer selected</p>
            )}
          </div>

          {/* STATUS */}
          <div className="space-y-4">
            <h4 className={documentText.sectionTitle}>Status</h4>

            {statusContent}
          </div>

          {/* TEAM ASSIGNMENTS */}
          <div className="space-y-4">
            <h4 className={documentText.sectionTitle}>Team Assignments</h4>

            {roles.map((role) => {
              const assignedMember = team?.[role.key];

              return (
                <div
                  key={role.key}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className={documentText.text}>{role.label}</p>

                    {assignedMember && (
                      <p className={documentText.caption}>
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
            <h4 className={documentText.sectionTitle}>Dates</h4>

            <div>
              <p className={documentText.caption}>{primaryDateLabel}</p>

              <input
                type="date"
                className="mt-1 h-[38px] w-full rounded-md border border-gray-300 bg-white px-3 text-[14px]"
                value={primaryDate || ""}
                onChange={(event) => onPrimaryDateChange?.(event.target.value)}
                onBlur={onDatesBlur}
              />
            </div>

            <div>
              <p className={documentText.caption}>{secondaryDateLabel}</p>

              <input
                type="date"
                className="mt-1 h-[38px] w-full rounded-md border border-gray-300 bg-white px-3 text-[14px]"
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
