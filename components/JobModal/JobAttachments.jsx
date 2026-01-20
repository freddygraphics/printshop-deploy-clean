"use client";

import { useState } from "react";
import { MoreVertical, Trash2, Download } from "lucide-react";
import JobFileUpload from "@/components/JobFileUpload";

export default function JobAttachments({
  jobId,
  files = [],
  onDelete,
  onUploaded,
}) {
  const [openMenu, setOpenMenu] = useState(null);

  return (
    <div className="mt-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          📎 Adjuntos
        </div>

        <button className="relative text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 overflow-hidden">
          Añadir
          <JobFileUpload
            jobId={jobId}
            onUploaded={(newFiles) => {
              console.log("Subidos:", newFiles);
              onUploaded?.(newFiles); // 👈 ESTO FALTABA
            }}
          />
        </button>
      </div>

      {/* FILE LIST */}
      <div className="space-y-2">
        {files.map((file) => {
          const isImage = file.type?.startsWith("image");

          return (
            <div
              key={file.id}
              className="flex items-center justify-between border rounded-md p-2 bg-white hover:bg-gray-50"
            >
              {/* LEFT */}
              <div className="flex items-center gap-3">
                {/* THUMB */}
                {isImage ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-12 h-12 rounded object-cover border"
                    onError={(e) => {
                      e.currentTarget.src = "/image-placeholder.png";
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded border flex items-center justify-center text-xs font-semibold bg-gray-100">
                    {file.name.split(".").pop()?.toUpperCase()}
                  </div>
                )}

                {/* INFO */}
                <div className="text-sm">
                  <div className="font-medium">{file.name}</div>
                  <div className="text-xs text-gray-400">
                    Añadido {new Date(file.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="relative">
                <button
                  onClick={() =>
                    setOpenMenu(openMenu === file.id ? null : file.id)
                  }
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <MoreVertical size={16} />
                </button>

                {/* MENU */}
                {openMenu === file.id && (
                  <div className="absolute right-0 mt-1 w-32 bg-white border rounded shadow z-10">
                    <a
                      href={file.url}
                      target="_blank"
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      <Download size={14} /> Descargar
                    </a>

                    <button
                      onClick={() => onDelete(file.id)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
