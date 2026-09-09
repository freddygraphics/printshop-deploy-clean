"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, PackageOpen } from "lucide-react";

type SupplierProduct = {
  id: number;
  productId: string;
  name: string | null;
  category: string | null;
  subCategory: string | null;
  image: string | null;
  variantCount: number;
};

export default function HubProductsPage() {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/hub/catalog", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Unable to load Hub catalog");
        }

        setProducts(data.products || []);
      } catch (error) {
        console.error("Hub catalog load error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return products;

    return products.filter((product) => {
      return (
        product.productId.toLowerCase().includes(q) ||
        product.name?.toLowerCase().includes(q) ||
        product.category?.toLowerCase().includes(q) ||
        product.subCategory?.toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Hub Products</h1>

        <p className="mt-1 text-sm text-gray-500">
          Search and configure products from Hub / HPG.
        </p>
      </div>

      <div className="rounded-xl border border-[#ededed] bg-white p-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, ID or category..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-400"
          />
        </div>

        <div className="mt-3 text-sm text-gray-500">
          {loading
            ? "Loading products..."
            : `${filteredProducts.length} products`}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[#ededed] bg-white p-10 text-center text-sm text-gray-500">
          Loading Hub catalog...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-[#ededed] bg-white p-12 text-center">
          <PackageOpen size={36} className="mx-auto mb-3 text-gray-300" />

          <p className="font-medium text-gray-700">No products found</p>

          <p className="mt-1 text-sm text-gray-500">Try another search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-xl border border-[#ededed] bg-white transition hover:shadow-sm"
            >
              <div className="flex h-[220px] items-center justify-center bg-[#FBFBFB] p-5">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name || product.productId}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <PackageOpen size={44} className="text-gray-300" />
                )}
              </div>

              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-gray-400">
                    #{product.productId}
                  </span>

                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                    {product.variantCount} variants
                  </span>
                </div>

                <h2 className="line-clamp-2 min-h-[48px] text-base font-semibold text-gray-900">
                  {product.name || `Hub Product ${product.productId}`}
                </h2>

                {(product.category || product.subCategory) && (
                  <p className="mt-2 line-clamp-1 text-sm text-gray-500">
                    {[product.category, product.subCategory]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}

                <Link
                  href={`/products/hub/${product.productId}`}
                  className="mt-4 flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Configure Product
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
