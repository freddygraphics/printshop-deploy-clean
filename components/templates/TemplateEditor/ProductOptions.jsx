"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { normalizeOptionGroups } from "@/lib/product-builder/normalizeOptionGroups";
import ProductOptionsList from "./ProductOptionsList";
import OptionGroupCard from "@/components/products/ProductBuilder/sections/OptionGroupCard";
import OptionLibraryModal from "@/components/products/ProductBuilder/library/OptionLibraryModal";

export default function ProductOptions({ template, onChange }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [openLibrary, setOpenLibrary] = useState(false);

  const groups = normalizeOptionGroups(template.optionGroups || []);

  function updateGroups(newGroups) {
    onChange({
      ...template,
      optionGroups: normalizeOptionGroups(newGroups),
    });
  }

  function addGroup() {
    const newGroup = {
      id: crypto.randomUUID(),
      name: "",
      key: "",
      type: "select",
      values: [],
      visibleWhen: "",
      visibleValue: "",
    };

    updateGroups([...groups, newGroup]);

    setEditingIndex(groups.length);
  }

  function updateGroup(index, updated) {
    const copy = [...groups];
    copy[index] = updated;
    updateGroups(copy);
  }

  function deleteGroup(index) {
    updateGroups(groups.filter((_, i) => i !== index));

    if (editingIndex === index) {
      setEditingIndex(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Product Options</h2>

            <p className="text-sm text-gray-500 mt-1">
              Configure the available options for this product template.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setOpenLibrary(true)}
              className="border rounded-lg px-4 py-2"
            >
              📚 Library
            </button>

            <button
              onClick={addGroup}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center gap-2"
            >
              <Plus size={18} />
              New Group
            </button>
          </div>
        </div>
      </div>

      {groups.map((group, index) => (
        <OptionGroupCard
          key={group.id}
          group={group}
          groups={groups}
          expanded={editingIndex === index}
          onToggle={() =>
            setEditingIndex(editingIndex === index ? null : index)
          }
          onChange={(updated) => updateGroup(index, updated)}
          onDelete={() => deleteGroup(index)}
        />
      ))}

      <OptionLibraryModal
        open={openLibrary}
        onClose={() => setOpenLibrary(false)}
        onSelect={(group) => {
          updateGroups([
            ...groups,
            {
              ...group,
              id: crypto.randomUUID(),
            },
          ]);

          setOpenLibrary(false);
        }}
      />
    </div>
  );
}
