export function updateDocumentItem(items, index, fields) {
  if (!Array.isArray(items)) {
    throw new Error("Items must be an array.");
  }

  if (!Number.isInteger(index) || index < 0 || index >= items.length) {
    throw new Error("Invalid item index.");
  }

  const currentItem = items[index];

  const nextFields = {
    ...fields,
  };

  // Mantener name y description sincronizados
  if (Object.prototype.hasOwnProperty.call(fields, "name")) {
    nextFields.description = fields.name;
  }

  if (Object.prototype.hasOwnProperty.call(fields, "description")) {
    nextFields.name = fields.description;
  }

  // __commit es una instrucción, no debe guardarse dentro del item
  delete nextFields.__commit;

  const updatedItem = {
    ...currentItem,
    ...nextFields,

    options: {
      ...(currentItem.options || {}),
      ...(fields.options || {}),

      finish:
        fields.finish ??
        fields.options?.finish ??
        currentItem.finish ??
        currentItem.options?.finish ??
        null,

      design:
        fields.design ??
        fields.options?.design ??
        currentItem.design ??
        currentItem.options?.design ??
        null,

      sides:
        fields.sides ??
        fields.options?.sides ??
        currentItem.sides ??
        currentItem.options?.sides ??
        null,

      corners:
        fields.corners ??
        fields.options?.corners ??
        currentItem.corners ??
        currentItem.options?.corners ??
        null,
    },

    _expanded: fields.__commit === true ? false : currentItem._expanded,
  };

  return items.map((item, itemIndex) =>
    itemIndex === index ? updatedItem : item,
  );
}
