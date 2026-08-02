"use client";

export default function DocumentHeader({ title, actions }) {
  return (
    <div className="flex w-full items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-700">{title}</h1>

      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
