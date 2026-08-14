"use client";

export default function YardSign({ template, onChange }) {
  const yardSign = template.yardSign || {
    sizes: [],
    materials: [],
    printSides: [],
    stakes: [],
  };

  function updateYardSign(key, value) {
    onChange({
      ...template,
      yardSign: {
        ...yardSign,
        [key]: value,
      },
    });
  }

  function addOption(group, defaultItem) {
    updateYardSign(group, [...(yardSign[group] || []), defaultItem]);
  }

  function updateOption(group, index, key, value) {
    const updated = [...(yardSign[group] || [])];

    updated[index] = {
      ...updated[index],
      [key]:
        key === "width" || key === "height"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    };

    updateYardSign(group, updated);
  }

  function removeOption(group, index) {
    updateYardSign(
      group,
      (yardSign[group] || []).filter((_, i) => i !== index),
    );
  }

  return (
    <div className="space-y-8">
      {/* =========================================
          SIZES
      ========================================= */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Sizes</h2>

            <p className="text-sm text-gray-500 mt-1">
              Create the sizes available for this Yard Sign.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              addOption("sizes", {
                name: "",
                width: "",
                height: "",
              })
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            + Add Size
          </button>
        </div>

        <div className="p-6">
          {(yardSign.sizes || []).length === 0 ? (
            <div className="text-center text-gray-400 py-6">
              No sizes added.
            </div>
          ) : (
            <div className="space-y-4">
              {yardSign.sizes.map((item, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-sm mb-1">Name</label>

                    <input
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder='18" x 24"'
                      value={item.name || ""}
                      onChange={(e) =>
                        updateOption("sizes", index, "name", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Width</label>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full border rounded-lg px-3 py-2"
                      value={item.width ?? ""}
                      onChange={(e) =>
                        updateOption("sizes", index, "width", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Height</label>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full border rounded-lg px-3 py-2"
                      value={item.height ?? ""}
                      onChange={(e) =>
                        updateOption("sizes", index, "height", e.target.value)
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeOption("sizes", index)}
                    className="border border-red-200 text-red-600 px-3 py-2 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================================
          MATERIALS
      ========================================= */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Materials</h2>

            <p className="text-sm text-gray-500 mt-1">
              Create the materials available for Yard Sign products.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              addOption("materials", {
                name: "",
              })
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            + Add Material
          </button>
        </div>

        <div className="p-6">
          {(yardSign.materials || []).length === 0 ? (
            <div className="text-center text-gray-400 py-6">
              No materials added.
            </div>
          ) : (
            <div className="space-y-4">
              {yardSign.materials.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_220px] gap-4 items-end"
                >
                  <div>
                    <label className="block text-sm mb-1">Material</label>

                    <input
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="4mm Coroplast"
                      value={item.name || ""}
                      onChange={(e) =>
                        updateOption("materials", index, "name", e.target.value)
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeOption("materials", index)}
                    className="border border-red-200 text-red-600 px-3 py-2 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================================
          PRINTING
      ========================================= */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Printing</h2>

            <p className="text-sm text-gray-500 mt-1">
              Create printing options such as single or double sided.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              addOption("printSides", {
                name: "",
              })
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            + Add Printing
          </button>
        </div>

        <div className="p-6">
          {(yardSign.printSides || []).length === 0 ? (
            <div className="text-center text-gray-400 py-6">
              No printing options added.
            </div>
          ) : (
            <div className="space-y-4">
              {yardSign.printSides.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_220px] gap-4 items-end"
                >
                  <div>
                    <label className="block text-sm mb-1">
                      Printing Option
                    </label>

                    <input
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Double Sided"
                      value={item.name || ""}
                      onChange={(e) =>
                        updateOption(
                          "printSides",
                          index,
                          "name",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeOption("printSides", index)}
                    className="border border-red-200 text-red-600 px-3 py-2 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================================
          H-STAKES
      ========================================= */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">H-Stakes</h2>

            <p className="text-sm text-gray-500 mt-1">
              Create the H-Stake options available for Yard Sign products.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              addOption("stakes", {
                name: "",
              })
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            + Add Stake
          </button>
        </div>

        <div className="p-6">
          {(yardSign.stakes || []).length === 0 ? (
            <div className="text-center text-gray-400 py-6">
              No stake options added.
            </div>
          ) : (
            <div className="space-y-4">
              {yardSign.stakes.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_220px] gap-4 items-end"
                >
                  <div>
                    <label className="block text-sm mb-1">H-Stake</label>

                    <input
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Standard H-Stake"
                      value={item.name || ""}
                      onChange={(e) =>
                        updateOption("stakes", index, "name", e.target.value)
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeOption("stakes", index)}
                    className="border border-red-200 text-red-600 px-3 py-2 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
