"use client";

import { Pencil, Trash2 } from "lucide-react";

export default function ProductOptionsList({ groups = [], onEdit, onDelete }) {
  if (groups.length === 0) {
    return (
      <div className="border rounded-xl bg-white p-10 text-center text-gray-500">
        No option groups yet.
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left p-4">Option Group</th>
            <th className="text-left p-4">Type</th>
            <th className="text-left p-4">Values</th>
            <th className="w-32"></th>
          </tr>
        </thead>

        <tbody>
          {groups.map((group, index) => (
            <tr
              key={group.id}
              className="border-b last:border-b-0 hover:bg-gray-50"
            >
              <td className="p-4">
                <div className="font-medium">{group.name || "Untitled"}</div>

                <div className="text-xs text-gray-500">{group.key || "-"}</div>
              </td>

              <td className="p-4 capitalize">{group.type}</td>

              <td className="p-4">{group.values?.length || 0} values</td>

              <td className="p-4">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(index)}
                    className="p-2 rounded hover:bg-gray-100"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() => onDelete(index)}
                    className="p-2 rounded text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
