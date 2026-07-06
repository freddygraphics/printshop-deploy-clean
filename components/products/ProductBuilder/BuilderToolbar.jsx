"use client";

export default function BuilderToolbar({ sections, onToggleSection }) {
  return (
    <div className="rounded-xl border bg-white p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Template Builder</h2>

          <p className="text-sm text-gray-500 mt-1">
            Configure which sections are available for this product template.
          </p>
        </div>

        <button className="bg-blue-600 text-white px-5 py-2 rounded-lg">
          Save Template
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(sections).map(([key, enabled]) => (
          <label
            key={key}
            className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => onToggleSection(key)}
            />

            <span className="capitalize">{key}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
