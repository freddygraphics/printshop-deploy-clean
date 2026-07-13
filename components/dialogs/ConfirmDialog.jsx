"use client";

import Dialog from "./Dialog";
import {
  AlertTriangle,
  Trash2,
  PackageCheck,
  FileWarning,
  ShieldAlert,
} from "lucide-react";

const ICONS = {
  warning: AlertTriangle,
  delete: Trash2,
  pickup: PackageCheck,
  invoice: FileWarning,
  danger: ShieldAlert,
};

const COLORS = {
  red: {
    bg: "bg-red-100",
    text: "text-red-600",
    button: "bg-red-600 hover:bg-red-700",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-600",
    button: "bg-green-600 hover:bg-green-700",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  amber: {
    bg: "bg-amber-100",
    text: "text-amber-600",
    button: "bg-amber-600 hover:bg-amber-700",
  },
};

export default function ConfirmDialog({
  open,
  onClose,

  // NUEVO
  onPrimaryAction,
  onSecondaryAction,

  title,
  description,

  primaryText = "Confirm",
  secondaryText = "Cancel",

  color = "blue",
  icon = "warning",

  children,
}) {
  const Icon = ICONS[icon] || AlertTriangle;
  const style = COLORS[color] || COLORS.blue;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="max-w-lg"
      footer={
        <>
          <button
            onClick={onSecondaryAction ?? onClose}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            {secondaryText}
          </button>

          <button
            onClick={onPrimaryAction}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium text-white transition ${style.button}`}
          >
            {primaryText}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full ${style.bg}`}
        >
          <Icon className={`h-7 w-7 ${style.text}`} />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

          {description && (
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {description}
            </p>
          )}

          {children && <div className="mt-5">{children}</div>}
        </div>
      </div>
    </Dialog>
  );
}
