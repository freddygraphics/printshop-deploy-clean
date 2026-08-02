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

export function closeDocumentItemEditor(items, index) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, itemIndex) =>
    itemIndex === index
      ? {
          ...item,
          _expanded: false,
        }
      : item,
  );
}

export function expandDocumentItem(items, index) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, itemIndex) => ({
    ...item,
    _expanded: itemIndex === index,
  }));
}
