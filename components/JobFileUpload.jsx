"use client";

import { useRef } from "react";

export default function JobFileUpload({ jobId, onUploaded }) {
  const inputRef = useRef(null);

  async function handleUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append("jobId", jobId);

    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    const res = await fetch("/api/jobs/files", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      alert("Error uploading files");
      return;
    }

    const data = await res.json();

    // 🔄 notificar al padre para refrescar lista
    onUploaded?.(data.files);

    // reset input
    inputRef.current.value = "";
  }

  return (
    <input
      ref={inputRef}
      type="file"
      multiple
      accept="image/*"
      onChange={handleUpload}
      className="absolute inset-0 opacity-0 cursor-pointer"
    />
  );
}
