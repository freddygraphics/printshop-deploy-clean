export const CATEGORY_SERVICE_MAP = {
  print: "print-newark-nj",
  sticker: "print-newark-nj",
  "car-decal": "signs-newark-nj",
  signs: "signs-newark-nj",
};

export function getRelatedServiceFromCategorySlug(slug) {
  if (!slug) return null;

  return CATEGORY_SERVICE_MAP[slug] || null;
}
