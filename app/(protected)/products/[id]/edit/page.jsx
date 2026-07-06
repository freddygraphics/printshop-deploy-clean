"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import ProductBuilder from "@/components/products/ProductBuilder";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [template, setTemplate] = useState(null);

  useEffect(() => {
    loadProduct();
  }, [id]);

  async function loadProduct() {
    try {
      // -----------------------------
      // PRODUCTO
      // -----------------------------
      const res = await fetch(`/api/products/${id}`);

      if (!res.ok) {
        throw new Error("Product not found");
      }

      const productData = await res.json();

      setProduct(productData);

      // -----------------------------
      // TEMPLATE
      // -----------------------------
      if (productData.templateId) {
        const templateRes = await fetch(
          `/api/templates/${productData.templateId}`,
        );

        if (templateRes.ok) {
          const templateData = await templateRes.json();

          setTemplate(templateData);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSave(updatedProduct) {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProduct),
      });

      if (!res.ok) {
        throw new Error("Error updating product");
      }

      router.push("/products");
    } catch (err) {
      console.error(err);
      alert("Error updating product.");
    }
  }

  if (!product) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <ProductBuilder
        mode="edit"
        existingData={product}
        template={template}
        onSave={handleSave}
      />
    </div>
  );
}
