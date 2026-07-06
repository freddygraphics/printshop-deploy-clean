"use client";

export default function SaveBar({ onSave, saving }) {
  return (
    <div className="sticky bottom-0 bg-white border rounded-xl p-4 flex justify-end">
      <button
        onClick={onSave}
        disabled={saving}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Template"}
      </button>
    </div>
  );
}
