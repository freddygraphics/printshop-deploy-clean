"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import ProductTemplateSelector from "@/components/ProductTemplateSelector";
import ProductBuilder from "@/components/products/ProductBuilder/index";

export default function NewProductPage() {
  const router = useRouter();

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [category, setCategory] = useState("standard");
  const [relatedService, setRelatedService] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [productCategories, setProductCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
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

      // Limpiar y cerrar
      setNewCategoryName("");
      setShowNewCategory(false);
    } catch (error) {
      console.error("Error creating product category:", error);
      alert("Could not create category.");
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleSave(product) {
    try {
      const payload = {
        ...product,
        category: category === "standard" ? null : category,
        relatedService: relatedService || null,

        categoryId: productCategoryId ? Number(productCategoryId) : null,

        templateId: selectedTemplate.id,
        templateSlug: selectedTemplate.slug,
      };

      console.log("PRODUCT PAYLOAD:", payload);

      const res = await fetch("/api/products/from-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error saving product");
        return;
      }

      router.push("/settings/products");
    } catch (err) {
      console.error(err);
      alert("Unexpected error");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
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
        <ProductTemplateSelector
          embedded
          onSelect={(template) => {
            console.log("SELECTED TEMPLATE", template);
            setSelectedTemplate(template);
          }}
        />
      ) : (
        <>
          <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2">
              {/* PRODUCT TYPE */}
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

              {/* RELATED SERVICE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Related Service
                </label>

                <select
                  value={relatedService}
                  onChange={(event) => setRelatedService(event.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">No Related Service</option>
                  <option value="print-newark-nj">Printing</option>
                  <option value="signs-newark-nj">Signs</option>
                  <option value="apparel-newark-nj">Apparel</option>
                  <option value="design-newark-nj">Design</option>
                </select>

                <p className="mt-2 text-xs text-gray-500">
                  This determines which service page displays this product.
                </p>
              </div>
              {/* PRODUCT CATEGORY */}
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
                      placeholder="Example: Flyers & Brochures"
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
                  This organizes the product inside the website catalog.
                </p>
              </div>
            </div>
          </section>
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
