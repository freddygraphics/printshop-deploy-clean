"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then(setProduct);
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();

    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });

    router.push("/products");
  }

  if (!product) return null;

  return (
    <form onSubmit={handleSave} className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Edit Product</h1>

      <input
        className="input"
        value={product.name}
        onChange={(e) => setProduct({ ...product, name: e.target.value })}
      />

      <button className="btn-primary">Save Changes</button>
    </form>
  );
}
