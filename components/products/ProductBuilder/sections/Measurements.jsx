"use client";

export default function Measurements({ value = {}, onChange }) {
  const data = {
    enabled: value.enabled ?? false,

    width: {
      enabled: value.width?.enabled ?? true,
      label: value.width?.label || "Width",
      default: value.width?.default || "",
    },

    height: {
      enabled: value.height?.enabled ?? true,
      label: value.height?.label || "Height",
      default: value.height?.default || "",
    },
  };

  function update(next) {
    onChange({
      ...data,
      ...next,
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Measurements</h2>
        <p className="text-sm text-gray-500">
          Enable width and height fields for custom size pricing.
        </p>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={data.enabled}
          onChange={(e) =>
            update({
              enabled: e.target.checked,
            })
          }
        />

        <span className="text-sm font-medium">Enable Custom Size</span>
      </label>

      {data.enabled && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* WIDTH */}
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium">Width</h3>

            <div>
              <label className="text-xs text-gray-500">Label</label>
              <input
                className="w-full border rounded-lg p-2"
                value={data.width.label}
                onChange={(e) =>
                  update({
                    width: {
                      ...data.width,
                      label: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div></div>

            <div>
              <label className="text-xs text-gray-500">Default</label>
              <input
                type="number"
                className="w-full border rounded-lg p-2"
                placeholder="Default width"
                value={data.width.default}
                onChange={(e) =>
                  update({
                    width: {
                      ...data.width,
                      default:
                        e.target.value === "" ? "" : Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>

          {/* HEIGHT */}
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium">Height</h3>

            <div>
              <label className="text-xs text-gray-500">Label</label>
              <input
                className="w-full border rounded-lg p-2"
                value={data.height.label}
                onChange={(e) =>
                  update({
                    height: {
                      ...data.height,
                      label: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div></div>

            <div>
              <label className="text-xs text-gray-500">Default</label>
              <input
                type="number"
                className="w-full border rounded-lg p-2"
                placeholder="Default height"
                value={data.height.default}
                onChange={(e) =>
                  update({
                    height: {
                      ...data.height,
                      default:
                        e.target.value === "" ? "" : Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
