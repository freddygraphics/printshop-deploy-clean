"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import ProductTemplateSelector from "@/components/ProductTemplateSelector";
import ProductBuilder from "@/components/products/ProductBuilder/index";

import { getRelatedServiceFromCategorySlug } from "@/lib/productCategoryServiceMap";

export default function NewProductPage() {
  const router = useRouter();

  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Product Type
  const [category, setCategory] = useState("standard");

  // Product Category
  const [productCategoryId, setProductCategoryId] = useState("");
  const [productCategories, setProductCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // New Category
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // ==========================================
  // LOAD PRODUCT CATEGORIES
  // ==========================================
  useEffect(() => {
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
      } catch (error) {
        console.error("Error loading product categories:", error);
        setProductCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    }

    loadProductCategories();
  }, []);

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

      // Seleccionar automáticamente la nueva categoría
      setProductCategoryId(String(data.id));

      // Limpiar formulario
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
  // SAVE PRODUCT
  // ==========================================
  async function handleSave(product) {
    try {
      if (!selectedTemplate) {
        alert("Select a product template first.");
        return;
      }

      // Buscar la categoría seleccionada
      const selectedProductCategory = productCategories.find(
        (item) => String(item.id) === String(productCategoryId),
      );

      const categorySlug = selectedProductCategory?.slug || null;

      // Convertir Product Category
      // al Related Service viejo automáticamente
      const resolvedRelatedService = getRelatedServiceFromCategorySlug(
        selectedCategory?.slug,
      );

      const numericTemplateId = Number(selectedTemplate?.id);

      const templateSlug =
        selectedTemplate?.slug ||
        selectedTemplate?.templateType ||
        selectedTemplate?.type ||
        product?.templateType ||
        null;

      const payload = {
        ...product,

        // ======================================
        // PRODUCT TYPE
        // Controla qué configurador se utiliza
        // ======================================
        category: category === "standard" ? null : category,

        // ======================================
        // PRODUCT CATEGORY
        // Print / Sticker / Car Decal
        // ======================================
        categoryId: productCategoryId ? Number(productCategoryId) : null,

        // ======================================
        // RELATED SERVICE
        // Automático. Ya no aparece en UI.
        // Se mantiene por compatibilidad.
        // ======================================
        relatedService: resolvedRelatedService,

        templateId:
          Number.isInteger(numericTemplateId) && numericTemplateId > 0
            ? numericTemplateId
            : null,

        templateSlug,
        templateType: templateSlug,
      };

      console.log("PRODUCT CREATE PAYLOAD:", payload);

      console.log("PRODUCT CATEGORY:", {
        id: productCategoryId,
        name: selectedProductCategory?.name,
        slug: categorySlug,
        relatedService: resolvedRelatedService,
      });

      const res = await fetch("/api/products/from-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();

      let data = null;

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error("API returned non-JSON response:", responseText);
        }
      }

      if (!res.ok) {
        alert(data?.error || `Error saving product (${res.status})`);
        return;
      }

      router.push("/settings/products");
      router.refresh();
    } catch (err) {
      console.error("Unexpected product creation error:", err);

      alert(err instanceof Error ? err.message : "Unexpected error");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* ====================================== */}
      {/* BACK */}
      {/* ====================================== */}

      <div className="mb-8">
        <Link
          href="/settings/products"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Back to Products
        </Link>
      </div>

      {!selectedTemplate ? (
        // ======================================
        // TEMPLATE SELECTOR
        // ======================================
        <ProductTemplateSelector
          embedded
          onSelect={(template) => {
            console.log("SELECTED TEMPLATE:", template);

            setSelectedTemplate(template);

            // Intentar seleccionar Product Type
            // automáticamente según el template
            const slug = template?.slug?.toLowerCase() || "";

            if (slug === "stickers" || slug === "sticker") {
              setCategory("stickers");
            } else if (slug === "apparel") {
              setCategory("apparel");
            } else if (slug === "raffle-tickets" || slug === "raffle-ticket") {
              setCategory("raffle-tickets");
            } else if (slug === "truck-lettering") {
              setCategory("truck-lettering");
            } else {
              setCategory("standard");
            }
          }}
        />
      ) : (
        <>
          {/* ====================================== */}
          {/* PRODUCT SETTINGS */}
          {/* ====================================== */}

          <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2">
              {/* ================================== */}
              {/* PRODUCT TYPE */}
              {/* ================================== */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Product Type
                </label>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="standard">Standard Product</option>

                  <option value="stickers">Stickers</option>

                  <option value="apparel">Apparel</option>

                  <option value="raffle-tickets">Raffle Tickets</option>

                  <option value="truck-lettering">Truck Lettering</option>
                </select>

                <p className="mt-2 text-xs text-gray-500">
                  This determines which configurator opens when the product is
                  selected.
                </p>
              </div>

              {/* ================================== */}
              {/* PRODUCT CATEGORY */}
              {/* ================================== */}

              <div>
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

                {/* NEW CATEGORY */}

                {showNewCategory && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(event) =>
                        setNewCategoryName(event.target.value)
                      }
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
            </div>
          </section>

          {/* ====================================== */}
          {/* PRODUCT BUILDER */}
          {/* ====================================== */}

          <ProductBuilder
            template={selectedTemplate}
            mode="new"
            productType={category}
            onSave={handleSave}
          />
        </>
      )}
    </main>
  );
}
