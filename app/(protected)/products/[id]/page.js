"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

import ProductConfigurator from "@/components/products/ProductConfigurator";

export default function ProductOptionsPage() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [configuredItem, setConfiguredItem] = useState(null);

  const [loading, setLoading] = useState(true);
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    loadProduct();
  }, [id]);

  async function loadProduct() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/products/${id}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Product not found");
      }

      setProduct(data);
    } catch (err) {
      console.error("Error loading product:", err);

      setError(
        err instanceof Error ? err.message : "The product could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  const handleConfigurationChange = useCallback((item) => {
    setConfiguredItem(item);
  }, []);

  async function handleCreateQuote() {
    if (!configuredItem) {
      setError("Configure the product before creating the quote.");
      return;
    }

    const itemTotal = Number(configuredItem.total || 0);

    if (itemTotal <= 0) {
      setError("The selected configuration does not have a valid price.");
      return;
    }

    try {
      setCreatingQuote(true);
      setError("");

      const configuredProduct = configuredItem.product || product;

      const isApparel = configuredItem.options?.productType === "apparel";

      const quoteItem = {
        productId: isApparel
          ? product.id
          : configuredItem.productId || configuredProduct?.id || product.id,

        name:
          configuredItem.name ||
          configuredItem.description ||
          configuredProduct?.name ||
          product.name,

        description:
          configuredItem.description ||
          configuredItem.name ||
          configuredProduct?.name ||
          product.name,

        qty: Number(configuredItem.qty || 1),

        unitPrice: Number(configuredItem.unitPrice || 0),

        total: itemTotal,

        options: {
          ...(configuredItem.options || {}),

          dynamicOptions: {
            ...(configuredItem.options?.dynamicOptions || {}),
          },

          ...(isApparel
            ? {
                productType: "apparel",

                catalogProductId: product.id,

                apparelProductId:
                  configuredItem.options?.apparelProductId ||
                  configuredItem.productId ||
                  configuredProduct?.id ||
                  null,

                garmentSnapshot: {
                  id: configuredProduct?.id || null,
                  name: configuredProduct?.name || "",
                  brand: configuredProduct?.brand || "",
                  supplier: configuredProduct?.supplier || "",
                  supplierStyle: configuredProduct?.supplierStyle || "",
                  imageUrl: configuredProduct?.imageUrl || null,
                },
              }
            : {}),
        },
      };

      const taxRate = 6.625;
      const taxEnabled = true;

      const subtotal = itemTotal;
      const tax = taxEnabled ? subtotal * (taxRate / 100) : 0;
      const total = subtotal + tax;

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: null,
          status: "Draft",

          quoteDate: new Date().toISOString().split("T")[0],
          expiryDate: null,

          items: [quoteItem],

          subtotal,
          tax,
          total,

          taxEnabled,
          taxRate,

          paymentOption: "full",
          customerNotes: "",
        }),
      });

      const responseText = await response.text();

      let createdQuote = null;

      if (responseText) {
        try {
          createdQuote = JSON.parse(responseText);
        } catch {
          console.error("Quote API returned non-JSON:", responseText);
        }
      }

      if (!response.ok) {
        throw new Error(
          createdQuote?.error || `Could not create quote (${response.status})`,
        );
      }

      if (!createdQuote?.id) {
        throw new Error("The quote API did not return a valid quote.");
      }

      window.location.href = `/quotes/${createdQuote.id}`;
    } catch (err) {
      console.error("Error creating draft quote:", err);

      setCreatingQuote(false);

      setError(
        err instanceof Error ? err.message : "The quote could not be created.",
      );
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-center text-sm text-gray-500">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/products"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} />
          Back to Products
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/products"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} />
          Back to Products
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Product not found.
        </div>
      </main>
    );
  }

  const hasValidConfiguration =
    configuredItem && Number(configuredItem.total) > 0;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <Link
        href="/products"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-blue-600"
      >
        <ArrowLeft size={18} />
        Back to Products
      </Link>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ProductConfigurator
        product={product}
        onChange={handleConfigurationChange}
      />

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Ready to prepare a quote?
          </p>

          <p className="mt-1 text-sm text-gray-500">
            The configured product will be added automatically to a new quote.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateQuote}
          disabled={!hasValidConfiguration || creatingQuote}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <FileText size={18} />

          {creatingQuote ? "Preparing Quote..." : "Create Quote"}
        </button>
      </div>
    </main>
  );
}
