"use client";

import { useEffect, useState } from "react";

export default function OptionLibraryModal({ open, onClose, onSelect }) {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (!open) return;

    fetch("/api/product-option-library")
      .then((r) => r.json())
      .then(setGroups);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[700px] max-h-[80vh] overflow-auto">
        <div className="border-b p-5 flex justify-between">
          <h2 className="font-semibold text-xl">Option Library</h2>

          <button onClick={onClose}>✕</button>
        </div>

        <div className="p-6 space-y-4">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => {
                onSelect({
                  ...group,

                  fields: group.fields || [],

                  values: undefined,
                });

                onClose();
              }}
              className="border rounded-xl p-4 cursor-pointer hover:border-blue-500"
            >
              <div className="font-semibold">{group.name}</div>

              <div className="text-sm text-gray-500">{group.type}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
