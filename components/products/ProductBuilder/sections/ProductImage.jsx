"use client";

import { useRef, useState } from "react";
import { Upload, Image as ImageIcon, Trash2, Star, Plus } from "lucide-react";

export default function ProductImage({
  value,
  images = [],
  onChange,
  onImagesChange,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const normalizedImages = images.map((item, index) => ({
    ...item,
    position: item.position ?? index,
  }));

  async function upload(files) {
    const selectedFiles = Array.from(files || []);

    if (!selectedFiles.length) return;

    try {
      setUploading(true);

      const uploaded = [];

      for (const file of selectedFiles) {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/upload/product-image", {
          method: "POST",
          body: form,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }

        uploaded.push({
          url: data.url,
          position: normalizedImages.length + uploaded.length,
          isPrimary: false,
        });
      }

      let nextImages = [...normalizedImages, ...uploaded];

      // Primera imagen = principal automáticamente
      if (!value && nextImages.length > 0) {
        nextImages = nextImages.map((item, index) => ({
          ...item,
          isPrimary: index === 0,
        }));

        onChange(nextImages[0].url);
      }

      onImagesChange(nextImages);
    } catch (error) {
      console.error(error);
      alert(error.message || "Upload failed");
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function setPrimary(index) {
    const selected = normalizedImages[index];

    if (!selected) return;

    const nextImages = normalizedImages.map((item, i) => ({
      ...item,
      isPrimary: i === index,
    }));

    onImagesChange(nextImages);
    onChange(selected.url);
  }

  function removeImage(index) {
    const removed = normalizedImages[index];

    let nextImages = normalizedImages
      .filter((_, i) => i !== index)
      .map((item, i) => ({
        ...item,
        position: i,
      }));

    if (removed?.url === value) {
      if (nextImages.length > 0) {
        nextImages = nextImages.map((item, i) => ({
          ...item,
          isPrimary: i === 0,
        }));

        onChange(nextImages[0].url);
      } else {
        onChange("");
      }
    }

    onImagesChange(nextImages);
  }

  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Product Images</h2>

          <p className="text-sm text-gray-500">
            Add multiple images for this product
          </p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <Plus size={16} />

          {uploading ? "Uploading..." : "Add"}
        </button>
      </div>

      {/* MAIN IMAGE */}

      {value ? (
        <div className="relative mb-4">
          <img
            src={value}
            alt=""
            className="w-full aspect-square object-cover rounded-xl border"
          />

          <div className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md text-xs font-semibold shadow">
            <Star size={13} className="fill-current" />
            Main Image
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-gray-50 mb-4"
        >
          <ImageIcon size={42} className="text-gray-400" />

          <span className="text-gray-500">Upload Product Images</span>

          <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
            <Upload size={18} />
            Select Images
          </div>
        </button>
      )}

      {/* GALLERY */}

      {normalizedImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {normalizedImages.map((item, index) => {
            const isPrimary = item.url === value;

            return (
              <div
                key={item.id || `${item.url}-${index}`}
                className={`relative rounded-lg border-2 overflow-hidden ${
                  isPrimary ? "border-blue-600" : "border-gray-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setPrimary(index)}
                  className="block w-full"
                  title="Set as main image"
                >
                  <img
                    src={item.url}
                    alt=""
                    className="w-full aspect-square object-cover"
                  />
                </button>

                {isPrimary && (
                  <div className="absolute top-1 left-1 bg-blue-600 text-white rounded p-1">
                    <Star size={12} className="fill-current" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-white text-red-600 rounded p-1 shadow hover:bg-red-50"
                  title="Delete image"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => upload(e.target.files)}
      />
    </div>
  );
}
