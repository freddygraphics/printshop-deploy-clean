"use client";

import { useRef } from "react";
import { Upload, Image as ImageIcon, Trash2 } from "lucide-react";

export default function ProductImage({ value, onChange }) {
  const inputRef = useRef(null);

  async function upload(file) {
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload/product-image", {
      method: "POST",
      body: form,
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Upload failed");
      return;
    }

    onChange(data.url);
  }

  return (
    <div className="bg-white border rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Product Image</h2>

      {value ? (
        <div className="space-y-4">
          <img
            src={value}
            alt=""
            className="w-full aspect-square object-cover rounded-xl border"
          />

          <div className="flex gap-3">
            <button
              onClick={() => inputRef.current.click()}
              className="flex-1 border rounded-lg py-2 hover:bg-gray-50"
            >
              Change Image
            </button>

            <button
              onClick={() => onChange("")}
              className="px-4 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current.click()}
          className="w-full aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-gray-50"
        >
          <ImageIcon size={42} className="text-gray-400" />

          <span className="text-gray-500">Upload Product Image</span>

          <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
            <Upload size={18} />
            Select Image
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />
    </div>
  );
}
