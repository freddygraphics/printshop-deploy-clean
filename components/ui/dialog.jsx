"use client";

import * as Dialog from "@radix-ui/react-dialog";

export function AppDialog({ open = true, onOpenChange, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none">
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
