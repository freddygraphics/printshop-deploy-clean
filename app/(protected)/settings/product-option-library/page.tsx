"use client";

import { useEffect, useState } from "react";
import OptionGroupCard from "@/components/products/ProductBuilder/sections/OptionGroupCard";
import { Pencil, Trash2 } from "lucide-react";
export default function ProductOptionLibraryPage() {
  const [groups, setGroups] = useState([]);
  const emptyGroup = {
    id: crypto.randomUUID(),
    name: "",
    key: "",
    type: "dropdown",
    values: [],
    visibleWhen: "",
    visibleValue: "",
  };

  const [editing, setEditing] = useState<any>(null);
  async function load() {
    const res = await fetch("/api/product-option-library");
    const data = await res.json();

    setGroups(data);
  }

  async function saveGroup() {
    const isNew = !groups.find((g: any) => g.id === editing.id);

    const res = await fetch("/api/product-option-library", {
      method: isNew ? "POST" : "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(editing),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Unable to save");
      return;
    }

    await load();

    setEditing(null);
  }
  async function deleteGroup(id: string) {
    const ok = window.confirm(
      "Are you sure you want to delete this option group?",
    );

    if (!ok) return;

    const res = await fetch(`/api/product-option-library?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Unable to delete");
      return;
    }

    await load();
  }
  async function duplicateGroup(group: any) {
    const copy = {
      ...group,
      id: undefined,
      name: `${group.name} Copy`,
      key: `${group.key}_copy_${Date.now()}`,
      values: group.values || [],
    };

    const res = await fetch("/api/product-option-library", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(copy),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Unable to duplicate");
      return;
    }

    await load();
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Product Option Library</h1>

          <p className="text-gray-500 mt-2">
            Reusable option groups for all products.
          </p>
        </div>

        <button
          onClick={() => setEditing({ ...emptyGroup })}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl"
        >
          + New Group
        </button>
      </div>

      {/* ===== EDITOR ===== */}

      {editing && (
        <div className="mb-8">
          <OptionGroupCard
            group={editing}
            groups={groups}
            expanded={true}
            onToggle={() => {}}
            onChange={setEditing}
            onDelete={() => setEditing(null)}
          />

          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={() => setEditing(null)}
              className="border rounded-lg px-5 py-2"
            >
              Cancel
            </button>

            <button
              onClick={saveGroup}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg"
            >
              Save to Library
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {groups.map((group: any) => (
          <div
            key={group.id}
            className="border rounded-xl p-5 bg-white shadow-sm"
          >
            <div className="flex justify-end mt-5">
              <button
                onClick={() => setEditing(structuredClone(group))}
                className="text-blue-600 text-sm font-medium"
              >
                Edit
              </button>
            </div>
            <h2 className="font-semibold text-lg">{group.name}</h2>

            <p className="text-sm text-gray-500 mt-1">{group.type}</p>

            <div className="mt-5 space-y-2">
              {(group.values || []).map((value: any) => (
                <div key={value.id} className="flex justify-between">
                  <span>{value.label}</span>

                  <span className="text-gray-500">${value.price}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditing(structuredClone(group))}
                className="border rounded-lg p-2 hover:bg-gray-50"
                title="Edit"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => duplicateGroup(group)}
                className="border rounded-lg p-2 hover:bg-gray-50"
                title="Duplicate"
              >
                Copy
              </button>

              <button
                onClick={() => deleteGroup(group.id)}
                className="border rounded-lg p-2 text-red-600 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
