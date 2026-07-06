"use client";

export default function FieldRenderer({ field, value, onChange }) {
  // 🔥 Compatibilidad:
  // Sistema viejo -> field.options
  // Sistema nuevo -> field.values
  const options = field.values || [];

  switch (field.type) {
    case "radio":
      return (
        <div className="space-y-2">
          {options.map((option) => {
            const optionValue = option.key;

            return (
              <label
                key={option.id || optionValue}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name={field.key}
                  value={optionValue}
                  checked={value === optionValue}
                  onChange={(e) => onChange(e.target.value)}
                />

                {option.label}
              </label>
            );
          })}
        </div>
      );

    case "select":
      return (
        <select
          className="w-full border rounded-lg px-3 py-2"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select...</option>

          {options.map((option) => {
            const optionValue = option.key;

            return (
              <option key={option.id || optionValue} value={optionValue}>
                {option.label}
              </option>
            );
          })}
        </select>
      );

    case "checkbox":
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      );

    case "text":
      return (
        <input
          className="w-full border rounded-lg px-3 py-2"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number":
      return (
        <input
          type="number"
          className="w-full border rounded-lg px-3 py-2"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      );

    case "textarea":
      return (
        <textarea
          className="w-full border rounded-lg px-3 py-2"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    default:
      return null;
  }
}
