"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";

export function DropdownMenu({ trigger, children }) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>{trigger}</Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          className="
            z-50 min-w-[180px]
            bg-white border rounded-md shadow-lg p-1
          "
        >
          {children}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

export function DropdownItem({ children, onClick }) {
  return (
    <Dropdown.Item
      onClick={onClick}
      className="
        px-3 py-2 text-sm
        cursor-pointer rounded
        hover:bg-gray-100
        focus:outline-none
      "
    >
      {children}
    </Dropdown.Item>
  );
}
