"use client";

import { useState, useEffect, useRef } from "react";
import { MoreVertical, Trash2, Download } from "lucide-react";
import JobFileUpload from "@/components/JobFileUpload";

export default function JobAttachments({
  jobId,
  files = [],
  onDelete,
  onUploaded,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
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
                  <div className="flex items-center gap-2 font-medium">
                    {file.name}

                    {file.isDefault && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Añadido {new Date(file.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div
                className="relative"
                ref={openMenu === file.id ? menuRef : null}
              >
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
                      onClick={async () => {
                        const res = await fetch(
                          `/api/job-files/${file.id}/default`,
                          {
                            method: "PUT",
                          },
                        );

                        if (!res.ok) return;

                        // 🔥 actualizar estado local
                        const updatedFiles = files
                          .map((f) =>
                            f.id === file.id
                              ? { ...f, isDefault: true }
                              : { ...f, isDefault: false },
                          )
                          .sort((a, b) => (b.isDefault ? 1 : -1));

                        onUploaded?.(updatedFiles);
                        setOpenMenu(null);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Make Default
                    </button>

                    <button
                      onClick={async () => {
                        const res = await fetch(`/api/job-files/${file.id}`, {
                          method: "DELETE",
                        });

                        if (!res.ok) return;

                        onDelete?.(file.id); // 👈 clave
                        setOpenMenu(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      Delete
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
