export function removeDocumentItem(items, index) {
  if (!Array.isArray(items)) {
    return [];
  }

  if (index < 0 || index >= items.length) {
    return items;
  }

  return items.filter((_, itemIndex) => itemIndex !== index);
}

export function toggleDocumentItemExpanded(items, index) {
  if (!Array.isArray(items)) {
    return [];
  }

  if (index < 0 || index >= items.length) {
    return items;
  }

  return items.map((item, itemIndex) => {
    if (itemIndex !== index) {
      return {
        ...item,
        _expanded: false,
      };
    }

    return {
      ...item,
      _expanded: !item._expanded,
    };
  });
}
