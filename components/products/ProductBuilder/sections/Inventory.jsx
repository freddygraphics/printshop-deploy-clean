"use client";

export default function Inventory({ value = {}, onChange }) {
  function update(field, fieldValue) {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  }

  return (
    <div className="bg-white border rounded-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>

        <p className="text-sm text-gray-500 mt-1">
          Configure inventory settings for this product.
        </p>
      </div>

      {/* Body */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Track Inventory */}
        <div className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <p className="font-medium">Track Inventory</p>
            <p className="text-sm text-gray-500">
              Reduce stock automatically when selling.
            </p>
          </div>

          <input
            type="checkbox"
            checked={value.trackStock || false}
            onChange={(e) => update("trackStock", e.target.checked)}
            className="w-5 h-5"
          />
        </div>

        {/* Allow Backorders */}
        <div className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <p className="font-medium">Allow Backorders</p>
            <p className="text-sm text-gray-500">
              Allow sales when stock reaches zero.
            </p>
          </div>

          <input
            type="checkbox"
            checked={value.allowBackorders || false}
            onChange={(e) => update("allowBackorders", e.target.checked)}
            className="w-5 h-5"
          />
        </div>

        {/* Current Stock */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Current Stock
          </label>

          <input
            type="number"
            value={value.currentStock ?? 0}
            onChange={(e) => update("currentStock", Number(e.target.value))}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>

        {/* Minimum Stock */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Minimum Stock
          </label>

          <input
            type="number"
            value={value.minimumStock ?? 0}
            onChange={(e) => update("minimumStock", Number(e.target.value))}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>

        {/* Reorder Quantity */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Reorder Quantity
          </label>

          <input
            type="number"
            value={value.reorderQuantity ?? 0}
            onChange={(e) => update("reorderQuantity", Number(e.target.value))}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>

        {/* Warehouse */}
        <div>
          <label className="block text-sm font-medium mb-2">Warehouse</label>

          <input
            type="text"
            value={value.warehouse || ""}
            onChange={(e) => update("warehouse", e.target.value)}
            placeholder="Main Warehouse"
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>
      </div>
    </div>
  );
}
