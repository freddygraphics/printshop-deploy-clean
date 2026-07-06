"use client";

export default function SaveBar({ mode, product, templateType, onSave }) {
  async function handleClick() {
    if (!onSave) return;

    await onSave(product);
  }

  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={handleClick}
        className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      >
        {mode === "edit" ? "Update Product" : "Save Product"}
      </button>
    </div>
  );
}
