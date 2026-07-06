"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import OptionGroupCard from "./OptionGroupCard";
import OptionLibraryModal from "../library/OptionLibraryModal";

export default function OptionGroups({ groups = [], onChange }) {
  const [openLibrary, setOpenLibrary] = useState(false);
  const [expanded, setExpanded] = useState(0);
  function addGroup() {
    const newGroup = {
      id: crypto.randomUUID(),
      name: "",
      fields: [],
    };

    onChange([...groups, newGroup]);

    setExpanded(groups.length);
  }

  function updateGroup(index, updated) {
    const copy = [...groups];

    copy[index] = updated;

    onChange(copy);
  }

  function removeGroup(index) {
    onChange(groups.filter((_, i) => i !== index));
  }

  return (
    <div className="bg-white border rounded-xl">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-lg font-semibold">Product Options</h2>

          <p className="text-sm text-gray-500 mt-1">
            Create configurable options for this product.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            onClick={() => setOpenLibrary(true)}
          >
            📚 Library
          </button>

          <button
            onClick={addGroup}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            <Plus size={18} />
            Add Group
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {groups.map((group, index) => (
          <OptionGroupCard
            expanded={expanded === index}
            onToggle={() => setExpanded(expanded === index ? -1 : index)}
            key={group.id}
            group={group}
            groups={groups}
            onChange={(updated) => updateGroup(index, updated)}
            onDelete={() => removeGroup(index)}
          />
        ))}
        <OptionLibraryModal
          open={openLibrary}
          onClose={() => setOpenLibrary(false)}
          onSelect={(group) => {
            onChange([
              ...groups,
              {
                ...group,

                id: crypto.randomUUID(),

                fields: group.fields || [],
              },
            ]);
          }}
        />
      </div>
    </div>
  );
}
