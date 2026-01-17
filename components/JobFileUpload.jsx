"use client";
import { useState } from "react";

export default function JobFileUpload({ jobId, onUploaded }) {
  const [loading, setLoading] = useState(false);

  async function upload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`/api/jobs/${jobId}/files`, {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    onUploaded?.(data);

    setLoading(false);
    e.target.value = ""; // reset input
  }

  return (
    <label className="cursor-pointer text-xs text-blue-600 hover:underline">
      📎 Attach file
      <input
        type="file"
        hidden
        accept=".pdf,.jpg,.jpeg,.png,.zip,.ai,.psd"
        onChange={upload}
      />
    </label>
  );
}
