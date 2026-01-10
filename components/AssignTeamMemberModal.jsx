"use client";

import { useEffect, useRef } from "react";

export default function AssignTeamMemberModal({
  title = "Assign Team Member",
  users = [],
  selectedUser,
  onSelect,
  onClose,
}) {
  const modalRef = useRef(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div
        ref={modalRef}
        className="bg-white w-full max-w-md rounded-xl shadow-lg"
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* LIST */}
        <div className="max-h-80 overflow-y-auto">
          {users.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              No team members available
            </p>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  onSelect(user);
                  onClose();
                }}
                className={`w-full px-6 py-3 flex items-center gap-3 text-left hover:bg-gray-50 ${
                  selectedUser?.id === user.id ? "bg-blue-50" : ""
                }`}
              >
                {/* AVATAR */}
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700">
                  {user.name.charAt(0)}
                </div>

                {/* NAME */}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.role || "Team Member"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
