"use client";

export default function ProductTemplateCard({ template, onSelect }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-[#E9EDF1] p-5 hover:shadow-lg transition flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          {template.name}
        </h2>
        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
      </div>

      <button
        onClick={onSelect}
        className="mt-4 bg-[#0EA5E9] text-white font-medium py-2 rounded-md hover:bg-[#0284C7] transition"
      >
        ➕ Create Product
      </button>
    </div>
  );
}
