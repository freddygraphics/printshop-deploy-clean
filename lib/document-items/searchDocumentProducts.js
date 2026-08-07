export async function searchDocumentProducts({
  query,
  catalog = "products",
  signal,
}) {
  const cleanQuery = String(query || "").trim();

  if (cleanQuery.length < 2) {
    return [];
  }

  const endpoint =
    catalog === "apparel"
      ? `/api/apparel/search?q=${encodeURIComponent(cleanQuery)}&limit=20`
      : `/api/products/search?q=${encodeURIComponent(cleanQuery)}`;

  const response = await fetch(endpoint, {
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Product search failed");
  }

  const data = await response.json();

  let results = [];

  // =====================================================
  // SANMAR APPAREL
  // =====================================================
  if (catalog === "apparel") {
    results = Array.isArray(data?.products)
      ? data.products.map((product) => ({
          ...product,
          productType: "apparel",
        }))
      : [];

    return results;
  }

  // =====================================================
  // NORMAL PRODUCTS
  // =====================================================
  results = Array.isArray(data)
    ? data.map((product) => ({
        ...product,
        productType: product.productType || "product",
      }))
    : [];

  const normalizedQuery = cleanQuery.toLowerCase();

  return results;
}
