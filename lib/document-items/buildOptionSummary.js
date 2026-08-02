export function buildOptionSummary(item) {
  if (!item?.options) {
    return "";
  }

  const fields = [];

  // =====================================================
  // QUANTITY
  // =====================================================
  if (item.qty) {
    fields.push(`Qty: ${item.qty}`);
  }

  // =====================================================
  // DIMENSIONS
  // =====================================================
  if (item.options.width) {
    fields.push(`Width: ${item.options.width}`);
  }

  if (item.options.height) {
    fields.push(`Height: ${item.options.height}`);
  }

  if (item.options.unit) {
    fields.push(`Unit: ${item.options.unit}`);
  }

  // =====================================================
  // APPAREL
  // =====================================================
  if (item.options.color) {
    const colorName =
      typeof item.options.color === "object"
        ? item.options.color.name ||
          item.options.color.colorName ||
          item.options.color.code
        : item.options.color;

    if (colorName) {
      fields.push(`Color: ${colorName}`);
    }
  }

  if (Array.isArray(item.options.sizes) && item.options.sizes.length > 0) {
    const sizes = item.options.sizes
      .filter((size) => Number(size?.qty || 0) > 0)
      .map((size) => `${size.size}: ${size.qty}`)
      .join(", ");

    if (sizes) {
      fields.push(`Sizes: ${sizes}`);
    }
  }

  // =====================================================
  // COMMON OPTIONS
  // =====================================================
  if (item.options.finish) {
    fields.push(`Finish: ${item.options.finish}`);
  }

  if (item.options.design) {
    fields.push(`Design: ${item.options.design}`);
  }

  if (item.options.sides) {
    fields.push(`Sides: ${item.options.sides}`);
  }

  if (item.options.corners) {
    fields.push(`Corners: ${item.options.corners}`);
  }

  // =====================================================
  // DYNAMIC OPTIONS
  // =====================================================
  if (
    item.options.dynamicOptions &&
    typeof item.options.dynamicOptions === "object"
  ) {
    Object.entries(item.options.dynamicOptions).forEach(([key, value]) => {
      if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        value !== false
      ) {
        fields.push(`${key}: ${formatOptionValue(value)}`);
      }
    });
  }

  return fields.join(" • ");
}

function formatOptionValue(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object" && value !== null) {
    return value.name || value.label || value.value || JSON.stringify(value);
  }

  return String(value);
}
