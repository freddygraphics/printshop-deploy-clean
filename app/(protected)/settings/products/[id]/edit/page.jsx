"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import ProductBuilder from "@/components/products/ProductBuilder";

import { getRelatedServiceFromCategorySlug } from "@/lib/productCategoryServiceMap";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [productCategoryId, setProductCategoryId] = useState("");
  const [productCategories, setProductCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [product, setProduct] = useState(null);
  const [template, setTemplate] = useState(null);

  // ==========================================
  // LOAD PRODUCT CATEGORIES
  // ==========================================
  useEffect(() => {
    loadProductCategories();
  }, []);

  async function loadProductCategories() {
    try {
      setLoadingCategories(true);

      const res = await fetch("/api/product-categories", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error loading categories");
      }

      setProductCategories(
        Array.isArray(data) ? data.filter((item) => item.active) : [],
      );
    } catch (err) {
      console.error("Error loading product categories:", err);
      setProductCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }

  // ==========================================
  // CREATE PRODUCT CATEGORY
  // ==========================================
  async function createProductCategory() {
    const name = newCategoryName.trim();

    if (!name) return;

    try {
      setCreatingCategory(true);

      const res = await fetch("/api/product-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Could not create category.");
        return;
      }

      setProductCategories((current) => [...current, data]);

      // Seleccionar automáticamente la categoría nueva
      setProductCategoryId(String(data.id));

      setNewCategoryName("");
      setShowNewCategory(false);
    } catch (error) {
      console.error("Error creating product category:", error);
      alert("Could not create category.");
    } finally {
      setCreatingCategory(false);
    }
  }

  // ==========================================
  // LOAD PRODUCT
  // ==========================================
  useEffect(() => {
    if (!id) return;

    loadProduct();
  }, [id]);

  async function loadProduct() {
    try {
      // ------------------------------------------
      // PRODUCT
      // ------------------------------------------
      const res = await fetch(`/api/products/${id}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Product not found");
      }

      const productData = await res.json();

      setProduct(productData);

      setProductCategoryId(
        productData.categoryId ? String(productData.categoryId) : "",
      );

      // ------------------------------------------
      // TEMPLATE
      // ------------------------------------------
      if (productData.templateId) {
        const templateRes = await fetch(
          `/api/templates/${productData.templateId}`,
          {
            cache: "no-store",
          },
        );

        if (templateRes.ok) {
          const templateData = await templateRes.json();
          setTemplate(templateData);
        }
      }
    } catch (err) {
      console.error("Error loading product:", err);
    }
  }

  // ==========================================
  // SAVE PRODUCT
  // ==========================================
  async function handleSave(updatedProduct) {
    console.log("🔥 HANDLE SAVE CALLED");
    console.log("➡ updatedProduct:", updatedProduct);

    try {
      const selectedProductCategory = productCategories.find(
        (item) => String(item.id) === String(productCategoryId),
      );

      const categorySlug = selectedProductCategory?.slug || null;

      const resolvedRelatedService = getRelatedServiceFromCategorySlug(
        selectedCategory?.slug,
      );

      console.log("➡ Product Category:", {
        id: productCategoryId,
        name: selectedProductCategory?.name,
        slug: categorySlug,
        relatedService: resolvedRelatedService,
      });

      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...updatedProduct,

          // Product Category
          categoryId: productCategoryId ? Number(productCategoryId) : null,

          // Related Service se calcula automáticamente
          relatedService: resolvedRelatedService,

          // Mantener visible en website cuando
          // pertenece a una categoría configurada
          showOnWebsite: Boolean(resolvedRelatedService),
        }),
      });

      const contentType = res.headers.get("content-type");

      let data;

      if (contentType?.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();

        throw new Error(text || `Server error (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Error updating product");
      }

      router.push("/settings/products");
      router.refresh();
    } catch (err) {
      console.error("Error updating product:", err);

      alert(err instanceof Error ? err.message : "Error updating product.");
    }
  }

  // ==========================================
  // LOADING
  // ==========================================
  if (!product) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* ====================================== */}
      {/* PRODUCT CATEGORY */}
      {/* ====================================== */}

      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="max-w-xl">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-700">
              Product Category
            </label>

            <button
              type="button"
              onClick={() => {
                setShowNewCategory((current) => !current);

                setNewCategoryName("");
              }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              {showNewCategory ? "Cancel" : "+ New Category"}
            </button>
          </div>

          <select
            value={productCategoryId}
            onChange={(event) => setProductCategoryId(event.target.value)}
            disabled={loadingCategories}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">
              {loadingCategories
                ? "Loading categories..."
                : "No Product Category"}
            </option>

            {productCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          {/* ================================== */}
          {/* NEW CATEGORY */}
          {/* ================================== */}

          {showNewCategory && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    createProductCategory();
                  }
                }}
                placeholder="Example: Print"
                autoFocus
                className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={createProductCategory}
                disabled={creatingCategory || !newCategoryName.trim()}
                className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingCategory ? "Creating..." : "Create"}
              </button>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500">
            Organizes the product inside the website catalog.
          </p>
        </div>
      </section>

      {/* ====================================== */}
      {/* PRODUCT BUILDER */}
      {/* ====================================== */}

      <ProductBuilder
        mode="edit"
        existingData={product}
        template={template}
        productType={product.category || "standard"}
        onSave={handleSave}
      />
    </div>
  );
}
