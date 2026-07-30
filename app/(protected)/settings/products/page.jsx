"use client";

export const dynamic = "force-dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Copy } from "lucide-react";
import ProductTemplateSelector from "@/components/ProductTemplateSelector";
import ProductModal from "@/components/ProductModal";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [cloningId, setCloningId] = useState(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedTemplateType, setSelectedTemplateType] = useState(null);

  const [success, setSuccess] = useState(""); // ⭐ mensaje éxito
  const router = useRouter();
  // ==========================================================
  // Cargar productos
  // ==========================================================
  const loadProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
        setFiltered(data);
      }
    } catch (err) {
      console.error("❌ Error loading products:", err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ==========================================================
  // Filtrar productos
  // ==========================================================
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(products);
      return;
    }

    const s = search.toLowerCase();
    setFiltered(products.filter((p) => p.name.toLowerCase().includes(s)));
  }, [search, products]);

  // ==========================================================
  // Abrir creación producto con template
  // ==========================================================
  function handleSelectTemplate(templateType) {
    setSelectedTemplateType(templateType);
    setShowTemplateSelector(false);
    setShowProductModal(true);
  }

  // ==========================================================
  // 🔥 Recibir producto guardado
  // ==========================================================
  const handleSaveProduct = async () => {
    setShowProductModal(false);

    setSuccess("✅ Producto guardado con éxito");
    setTimeout(() => setSuccess(""), 2500);

    await loadProducts();
  };

  async function handleCloneProduct(product) {
    const confirmed = confirm(
      `Clone "${product.name}"?\n\nA complete copy of this product will be created.`,
    );

    if (!confirmed) return;

    try {
      setCloningId(product.id);
      setSuccess("");

      const res = await fetch(`/api/products/${product.id}/clone`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not clone product");
      }

      setSuccess(`✅ "${product.name}" cloned successfully`);

      await loadProducts();

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (error) {
      console.error("Error cloning product:", error);
      alert(error.message);
    } finally {
      setCloningId(null);
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      {/* ÉXITO */}
      {success && (
        <p className="text-green-600 bg-green-100 border border-green-300 px-4 py-2 rounded mb-4 text-sm">
          {success}
        </p>
      )}

      {/* HEADER */}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1E293B]">Products</h1>

        <Link href="/settings/products/new">
          <button className="flex items-center gap-2 bg-[#0051A8] hover:bg-[#00418A] text-white px-4 py-2 rounded-lg text-sm font-medium shadow">
            <Plus size={18} />
            New Product
          </button>
        </Link>
      </div>

      {/* TARJETAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <SummaryCard title="Total Products" value={products.length} />
        <SummaryCard
          title="Templates"
          value={products.filter((p) => p.templateType).length}
        />

        <SummaryCard
          title="Without Template"
          value={products.filter((p) => !p.templateType).length}
        />
      </div>

      {/* SEARCH */}
      <div className="relative mb-5">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search products..."
          className="w-full border rounded-lg pl-10 pr-4 py-2 shadow-sm text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No products found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F5F7F9] border-b">
              <tr>
                <th className="p-3 text-left">Product</th>
                {/* OCULTO ⛔ */}
                {/* <th>SKU</th> */}
                {/* <th>Price</th> */}
                {/* <th>Template</th> */}
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {p.image && (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                      )}

                      <div>
                        <p className="font-medium">{p.name}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="flex justify-end gap-3">
                      <button
                        className="text-gray-600 hover:text-green-600"
                        title="Edit product"
                        onClick={() =>
                          router.push(`/settings/products/${p.id}/edit`)
                        }
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        className="text-gray-600 hover:text-purple-600 disabled:opacity-40"
                        title="Clone product"
                        disabled={cloningId === p.id}
                        onClick={() => handleCloneProduct(p)}
                      >
                        <Copy
                          size={18}
                          className={cloningId === p.id ? "animate-pulse" : ""}
                        />
                      </button>
                      <button
                        className="text-gray-600 hover:text-red-600"
                        onClick={() => {
                          if (confirm("Delete this product?")) {
                            fetch(`/api/products/${p.id}`, {
                              method: "DELETE",
                            }).then(() => loadProducts());
                          }
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SELECTOR DE TEMPLATE */}
      {showTemplateSelector && (
        <ProductTemplateSelector
          open={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          onSelect={handleSelectTemplate}
        />
      )}

      {/* MODAL PRODUCTO */}
      {showProductModal && (
        <ProductModal
          open={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          product={
            editingProduct
              ? editingProduct // ✏️ EDIT
              : { templateType: selectedTemplateType } // ➕ NEW
          }
          mode={editingProduct ? "edit" : "new"}
          onSave={handleSaveProduct}
        />
      )}
    </main>
  );
}

/* -------------------------------------------------------------- */

function SummaryCard({ title, value }) {
  return (
    <div className="bg-white shadow-sm border rounded-lg p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-[#0051A8] mt-1">{value}</p>
    </div>
  );
}
