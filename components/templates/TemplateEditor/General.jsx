"use client";

export default function General({ template, onChange }) {
  function update(key, value) {
    onChange({
      ...template,
      [key]: value,
    });
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-xl font-semibold mb-6">General Information</h2>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 font-medium">Template Name</label>

          <input
            className="w-full border rounded-lg p-3"
            value={template.name || ""}
            onChange={(e) => update("name", e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Slug</label>

          <input
            className="w-full border rounded-lg p-3"
            value={template.slug || ""}
            onChange={(e) => update("slug", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="block mb-2 font-medium">Description</label>

        <textarea
          rows={4}
          className="w-full border rounded-lg p-3"
          value={template.description || ""}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>
    </div>
  );
}
