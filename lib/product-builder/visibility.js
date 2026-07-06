export function isFieldVisible(field, values) {
  console.log("FIELD", field.name);
  console.log("VISIBLE WHEN", field.visibleWhen);
  console.log("VISIBLE VALUE", field.visibleValue);
  console.log("CURRENT VALUE", values[field.visibleWhen]);
  if (!field.visibleWhen) return true;

  const selected = values[field.visibleWhen];

  if (selected == null) return false;

  // Si es string
  if (typeof selected === "string") {
    return (
      selected === field.visibleValue ||
      selected.replace(/\s/g, "") === field.visibleValue
    );
  }

  // Si FieldRenderer devuelve objeto
  if (typeof selected === "object") {
    return (
      selected.key === field.visibleValue ||
      selected.label === field.visibleValue
    );
  }

  return false;
}
