export function validateFields(optionGroups, values) {
  const errors = {};

  optionGroups.forEach((group) => {
    (group.fields || []).forEach((field) => {
      if (!field.required) return;

      const value = values[field.key];

      const empty =
        value === "" ||
        value === null ||
        value === undefined ||
        value === false;

      if (empty) {
        errors[field.key] = `${field.label} is required`;
      }
    });
  });

  return errors;
}
