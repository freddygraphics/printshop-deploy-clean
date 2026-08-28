"use client";
const AVAILABLE_TRUCK_FONTS = [
  "Arial Bold",
  "Block",
  "Burnerd",
  "Marker",
  "Script",
  "Stencil",
  "Balloon",
  "Britain",
  "Times",
];
const DEFAULT_VINYL_COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Black", value: "#231F20" },
  { name: "Red", value: "#FF0000" },
  { name: "Blue", value: "#10069F" },
  { name: "Cool Blue", value: "#009FE3" },
  { name: "Navy", value: "#080866" },
  { name: "Green", value: "#008A17" },
  { name: "Hunter", value: "#00520D" },
  { name: "Yellow", value: "#FFE500" },
  { name: "Orange", value: "#FF9200" },
  { name: "Maroon", value: "#A90000" },
  { name: "Charcoal", value: "#666666" },
];
export default function TruckLetteringProduct({ product, update }) {
  const savedConfig = product.truckLettering || {};

  const config = {
    enabled: true,
    previewType: "truck-lettering",
    lines: 1,
    lineSettings: [],
    availableFonts: [
      "Arial Bold",
      "Block",
      "Burnerd",
      "Marker",
      "Script",
      "Stencil",
      "Balloon",
      "Britain",
      "Times",
    ],
    availableLetterHeights: [1.5, 2, 2.5, 3, 3.5, 4],
    maxWidth: 24,

    ...savedConfig,

    colors: DEFAULT_VINYL_COLORS,
  };

  const lines = Number(config.lines || 1);

  const availableLetterHeights = config.availableLetterHeights || [
    1.5, 2, 2.5, 3, 3.5, 4,
  ];

  function updateConfig(values) {
    update({
      truckLettering: {
        ...config,
        ...values,
      },
    });
  }

  function getDefaultHeight(index, numberOfLines) {
    if (numberOfLines === 1) {
      return 3;
    }

    if (numberOfLines === 2) {
      return index === 0 ? 3.5 : 3;
    }

    if (numberOfLines === 3) {
      if (index === 0) return 3.5;
      if (index === 1) return 2;
      return 3;
    }

    return 3;
  }

  function getDefaultPlaceholder(index, numberOfLines) {
    if (numberOfLines === 1) {
      return "USDOT 1234567";
    }

    if (numberOfLines === 2) {
      return index === 0 ? "Company Name" : "USDOT 1234567";
    }

    if (index === 0) {
      return "Company Name";
    }

    if (index === 1) {
      return "City, State";
    }

    return "USDOT 1234567";
  }

  function changeLines(value) {
    const numberOfLines = Number(value);

    const lineSettings = Array.from({ length: numberOfLines }, (_, index) => ({
      id: `line${index + 1}`,
      label: `Line ${index + 1}`,
      placeholder: getDefaultPlaceholder(index, numberOfLines),
      required: true,
      letterHeight: getDefaultHeight(index, numberOfLines),
    }));

    updateConfig({
      previewType: "truck-lettering",
      lines: numberOfLines,
      lineSettings,
    });
  }

  function updateLine(index, values) {
    const lineSettings = [...(config.lineSettings || [])];

    const currentLine = lineSettings[index] || {
      id: `line${index + 1}`,
      label: `Line ${index + 1}`,
      placeholder: "",
      required: true,
      letterHeight: getDefaultHeight(index, lines),
    };

    lineSettings[index] = {
      ...currentLine,
      ...values,
    };

    updateConfig({
      previewType: "truck-lettering",
      lineSettings,
    });
  }

  function toggleFont(font) {
    const currentFonts = config.availableFonts || [];

    const exists = currentFonts.includes(font);

    updateConfig({
      availableFonts: exists
        ? currentFonts.filter((item) => item !== font)
        : [...currentFonts, font],
    });
  }

  function addColor() {
    const name = prompt("Color name:");

    if (!name?.trim()) return;

    const value = prompt("Hex color:", "#000000");

    if (!value?.trim()) return;

    updateConfig({
      colors: [
        ...(config.colors || []),
        {
          name: name.trim(),
          value: value.trim(),
        },
      ],
    });
  }

  function removeColor(index) {
    const colors = [...(config.colors || [])];

    colors.splice(index, 1);

    updateConfig({
      colors,
    });
  }

  function addLetterHeight() {
    const value = prompt("Letter height in inches:", "3");

    if (!value) return;

    const numberValue = Number(value);

    if (Number.isNaN(numberValue) || numberValue <= 0) {
      alert("Enter a valid letter height.");
      return;
    }

    if (availableLetterHeights.includes(numberValue)) {
      alert("That letter height already exists.");
      return;
    }

    updateConfig({
      availableLetterHeights: [...availableLetterHeights, numberValue].sort(
        (a, b) => a - b,
      ),
    });
  }

  function removeLetterHeight(value) {
    updateConfig({
      availableLetterHeights: availableLetterHeights.filter(
        (height) => height !== value,
      ),
    });
  }

  function getPreviewFontSize(letterHeight) {
    const height = Number(letterHeight || 3);

    return `${Math.max(18, height * 14)}px`;
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Truck Lettering Configuration
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Configure line sizes, fonts, colors and maximum width for truck
          lettering products.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* LEFT SIDE */}

        <div className="space-y-8">
          {/* NUMBER OF LINES */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Number of Lines
            </label>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => changeLines(number)}
                  className={`h-11 rounded-lg border text-sm font-medium transition ${
                    lines === number
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {number} {number === 1 ? "Line" : "Lines"}
                </button>
              ))}
            </div>
          </div>

          {/* LINE SETTINGS */}

          <div className="space-y-4">
            {Array.from({
              length: lines,
            }).map((_, index) => {
              const setting = config.lineSettings?.[index] || {
                id: `line${index + 1}`,
                label: `Line ${index + 1}`,
                placeholder: getDefaultPlaceholder(index, lines),
                required: true,
                letterHeight: getDefaultHeight(index, lines),
              };

              return (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-4 text-sm font-semibold text-gray-900">
                    Line {index + 1}
                  </div>

                  <div className="space-y-4">
                    {/* PLACEHOLDER */}

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Placeholder
                      </label>

                      <input
                        type="text"
                        value={setting.placeholder || ""}
                        onChange={(event) =>
                          updateLine(index, {
                            placeholder: event.target.value,
                          })
                        }
                        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* LETTER HEIGHT */}

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Letter Height
                      </label>

                      <select
                        value={
                          setting.letterHeight || getDefaultHeight(index, lines)
                        }
                        onChange={(event) =>
                          updateLine(index, {
                            letterHeight: Number(event.target.value),
                          })
                        }
                        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        {availableLetterHeights.map((height) => (
                          <option key={height} value={height}>
                            {height}" Letter Height
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* REQUIRED */}

                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={setting.required !== false}
                        onChange={(event) =>
                          updateLine(index, {
                            required: event.target.checked,
                          })
                        }
                        className="h-4 w-4"
                      />
                      Required
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MAXIMUM WIDTH */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Maximum Width
            </label>

            <p className="mb-3 text-xs text-gray-500">
              Maximum overall width allowed for each line.
            </p>

            <div className="relative max-w-xs">
              <input
                type="number"
                min="1"
                step="0.5"
                value={config.maxWidth || 24}
                onChange={(event) =>
                  updateConfig({
                    maxWidth: Number(event.target.value),
                  })
                }
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                in
              </span>
            </div>
          </div>

          {/* AVAILABLE LETTER HEIGHTS */}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Available Letter Heights
                </h3>

                <p className="text-xs text-gray-500">
                  Standard letter heights customers can use.
                </p>
              </div>

              <button
                type="button"
                onClick={addLetterHeight}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
              >
                + Add Height
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableLetterHeights.map((height) => (
                <div
                  key={height}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <span className="text-sm font-medium text-gray-800">
                    {height}"
                  </span>

                  <button
                    type="button"
                    onClick={() => removeLetterHeight(height)}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* FONTS */}

          <div>
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Available Fonts
              </h3>

              <p className="text-xs text-gray-500">
                Select the fonts customers can choose on the website.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_TRUCK_FONTS.map((font) => {
                const selected = (config.availableFonts || []).includes(font);

                return (
                  <button
                    key={font}
                    type="button"
                    onClick={() => toggleFont(font)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-3 text-left transition ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm font-medium">{font}</span>

                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                        selected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLORS */}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Vinyl Colors
                </h3>

                <p className="text-xs text-gray-500">
                  Vinyl colors customers can select.
                </p>
              </div>

              <button
                type="button"
                onClick={addColor}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
              >
                + Add Color
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(config.colors || []).map((color, index) => (
                <div
                  key={`${color.name}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded-full border border-gray-300"
                      style={{
                        backgroundColor: color.value,
                      }}
                    />

                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {color.name}
                      </div>

                      <div className="text-xs text-gray-500">{color.value}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeColor(index)}
                    className="text-xs font-medium text-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Website Preview
          </label>

          <div className="flex min-h-[380px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 p-8">
            <div className="flex min-h-[260px] w-full max-w-lg flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-white px-6 py-8">
              <div className="mb-6 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Maximum Width {config.maxWidth || 24}"
              </div>

              {Array.from({
                length: lines,
              }).map((_, index) => {
                const setting = config.lineSettings?.[index] || {};

                const height =
                  setting.letterHeight || getDefaultHeight(index, lines);

                return (
                  <div
                    key={index}
                    className="my-1 w-full truncate text-center font-black uppercase text-black"
                    style={{
                      fontSize: getPreviewFontSize(height),
                      lineHeight: 1,
                    }}
                  >
                    {setting.placeholder || getDefaultPlaceholder(index, lines)}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Preview reflects the relative letter height of each line. Actual
            decal width will depend on the customer's text and selected font.
          </p>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Preview Type
            </div>

            <div className="mt-1 text-sm font-medium text-gray-900">
              truck-lettering
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
