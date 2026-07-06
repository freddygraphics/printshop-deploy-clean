export function normalizeOptionGroups(groups = []) {
  if (!Array.isArray(groups)) return [];

  return groups.map((group) => {
    // formato viejo: group.fields[0].options
    if (Array.isArray(group.fields) && group.fields.length > 0) {
      const field = group.fields[0];

      return {
        id: group.id || crypto.randomUUID(),
        name: field.name || group.name || "",
        key: field.key || "",
        type: field.type || "select",
        values: (field.options || field.values || []).map((v) => ({
          id: v.id || crypto.randomUUID(),
          key: v.key || v.value || v.label || "",
          label: v.label || v.key || "",
          price: Number(v.price || 0),
          priceType: v.priceType || "fixed",
          default: Boolean(v.default),
        })),
        visibleWhen: field.visibleWhen || group.visibleWhen || "",
        visibleValue: field.visibleValue || group.visibleValue || "",
      };
    }

    // formato nuevo
    return {
      id: group.id || crypto.randomUUID(),
      name: group.name || "",
      key: group.key || "",
      type: group.type || "select",
      values: (group.values || []).map((v) => ({
        id: v.id || crypto.randomUUID(),
        key: v.key || v.value || v.label || "",
        label: v.label || v.key || "",
        price: Number(v.price || 0),
        priceType: v.priceType || "fixed",
        default: Boolean(v.default),
      })),
      visibleWhen: group.visibleWhen || "",
      visibleValue: group.visibleValue || "",
    };
  });
}
