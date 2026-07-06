"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Settings2,
} from "lucide-react";
import OptionValuesList from "./OptionValuesList";
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}
export default function OptionGroupCard({
  group,
  groups = [],
  expanded = true,
  onToggle = () => {},
  onChange,
  onDelete,
}) {
  function update(field, value) {
    onChange({
      ...group,
      [field]: value,
    });
  }

  function addValue() {
    onChange({
      ...group,
      values: [
        ...(group.values || []),
        {
          id: crypto.randomUUID(),
          key: "",
          label: "",
          price: 0,
          priceType: "fixed",
          default: false,
        },
      ],
    });
  }

  function updateValue(index, field, value) {
    const values = [...(group.values || [])];

    const updatedValue = {
      ...values[index],
      [field]: value,
    };

    if (field === "label") {
      updatedValue.key = slugify(value);
    }

    values[index] = updatedValue;

    onChange({
      ...group,
      values,
    });
  }

  function removeValue(index) {
    onChange({
      ...group,
      values: (group.values || []).filter((_, i) => i !== index),
    });
  }

  function setDefault(index) {
    const values = (group.values || []).map((value, i) => ({
      ...value,
      default: i === index,
    }));

    onChange({
      ...group,
      values,
    });
  }

  const dependencyGroup = groups.find((g) => g.key === group.visibleWhen);
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <div className="border rounded-xl bg-white">
      <div
        onClick={expanded !== undefined ? onToggle : undefined}
        className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-t-xl border-b"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}

          <div>
            <h3 className="font-semibold text-gray-900">
              {group.name || "New Option Group"}
            </h3>

            <p className="text-sm text-gray-500">
              {(group.values || []).length} values • {group.type || "radio"}
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
        >
          <Trash2 size={18} />
        </button>
      </div>
      {expanded && (
        <>
          <div className="border-b bg-white px-6 py-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Group Name
            </label>

            <input
              value={group.name || ""}
              onChange={(e) => {
                const name = e.target.value;

                onChange({
                  ...group,
                  name,
                  key: slugify(name),
                });
              }}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Frame Included"
            />
          </div>
          <div className="bg-white">
            <OptionValuesList
              values={group.values || []}
              updateValue={updateValue}
              removeValue={removeValue}
              setDefault={setDefault}
            />
          </div>
          <div className="border-t px-6 py-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Settings2 size={16} />

              {showAdvanced ? "Hide Advanced Settings" : "Advanced Settings"}
            </button>
          </div>
          <div className="flex justify-between items-center px-5 py-4 border-t bg-gray-50">
            <button
              type="button"
              onClick={addValue}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
            >
              <Plus size={18} />
              Add Value
            </button>
            {showAdvanced && (
              <div className="border-t bg-gray-50 px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Type
                    </label>

                    <select
                      value={group.type || "radio"}
                      onChange={(e) => update("type", e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                    >
                      <option value="radio">Radio</option>
                      <option value="select">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Show When
                    </label>

                    <select
                      value={group.visibleWhen || ""}
                      onChange={(e) =>
                        onChange({
                          ...group,
                          visibleWhen: e.target.value,
                          visibleValue: "",
                        })
                      }
                      className="w-full rounded-lg border px-3 py-2"
                    >
                      <option value="">Always Visible</option>

                      {groups
                        .filter((g) => g.id !== group.id)
                        .map((g) => (
                          <option key={g.id} value={g.key}>
                            {g.name || g.key}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Equals
                    </label>

                    <select
                      value={group.visibleValue || ""}
                      onChange={(e) => update("visibleValue", e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                      disabled={!group.visibleWhen}
                    >
                      <option value="">Select value</option>

                      {(dependencyGroup?.values || []).map((v) => (
                        <option key={v.id || v.key} value={v.key || v.label}>
                          {v.label || v.key}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            <span className="text-sm text-gray-500">
              {(group.values || []).length} values
            </span>
          </div>
        </>
      )}
    </div>
  );
}
