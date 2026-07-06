"use client";

import { OptionEngine } from "@/lib/product-builder/OptionEngine";
import FieldRenderer from "@/components/field-renderer/FieldRenderer";

export default function ConfigurableTemplateEditor({
  optionGroups = [],
  value = {},
  onChange,
}) {
  if (!optionGroups.length) return null;
  console.log("OPTION GROUPS");
  console.log(JSON.stringify(optionGroups, null, 2));

  console.log("CURRENT VALUES");
  console.log(value);
  const engine = new OptionEngine(optionGroups);
  function updateValue(key, newValue) {
    onChange({
      ...value,
      [key]: newValue,
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {engine.getVisibleGroups(value).map((group) => {
        return (
          <div
            key={group.id}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {group.name}
            </label>

            <FieldRenderer
              field={group}
              value={value[group.key]}
              onChange={(newValue) => updateValue(group.key, newValue)}
            />
          </div>
        );
      })}
    </div>
  );
}
