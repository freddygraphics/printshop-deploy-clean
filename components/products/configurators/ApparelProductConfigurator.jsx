"use client";

import { useEffect, useState } from "react";
import { Search, ArrowLeft, Loader2 } from "lucide-react";

import ApparelConfigurator from "@/components/apparel/ApparelConfigurator";
import { searchDocumentProducts } from "@/lib/document-items/searchDocumentProducts";
import { createDocumentItem } from "@/lib/document-items/createDocumentItem";

function createTemporaryId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `apparel-${Date.now()}`;
}

export default function ApparelProductConfigurator({
  product,
  onChange,
  initialData = null,
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  const [selectedGarment, setSelectedGarment] = useState(
    initialData?.apparelProduct ||
      initialData?.product ||
      initialData?.options?.apparelProduct ||
      null,
  );

  const [garmentInitialData, setGarmentInitialData] = useState(
    initialData || null,
  );

  useEffect(() => {
    if (selectedGarment) return;

    const query = search.trim();

    if (query.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        setError("");

        const foundProducts = await searchDocumentProducts({
          query,
          catalog: "apparel",
          signal: controller.signal,
        });

        setResults(Array.isArray(foundProducts) ? foundProducts : []);
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("Error searching SanMar apparel:", err);
          setResults([]);
          setError("Unable to search SanMar apparel.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [search, selectedGarment]);

  async function handleSelectGarment(result) {
    try {
      setError("");

      /*
       * Usa la misma función que QuoteEditor.
       * Esto carga el producto SanMar completo con colors y variants.
       */
      const createdItem = await createDocumentItem(result);

      const garment = createdItem?.product || result;

      if (!garment) {
        throw new Error("The selected garment could not be loaded.");
      }

      setSelectedGarment(garment);

      setGarmentInitialData({
        ...createdItem,

        id: createTemporaryId(),

        productId: garment.id,
        product: garment,

        name: garment.name || product?.name || "Apparel",
        description: garment.name || product?.name || "Apparel",

        qty: Number(createdItem?.qty || 1),
        unitPrice: Number(createdItem?.unitPrice || 0),
        total: Number(createdItem?.total || 0),

        options: {
          ...(createdItem?.options || {}),

          productType: "apparel",

          catalogProductId: product?.id || null,

          apparelProductId: garment.id,

          // Guardar producto SanMar completo
          apparelProduct: garment,

          supplier: garment.supplier,
          supplierStyle: garment.supplierStyle,
          brand: garment.brand,
        },

        _expanded: true,
      });

      setSearch("");
      setResults([]);
    } catch (err) {
      console.error("Error selecting SanMar garment:", err);

      setError(
        err instanceof Error
          ? err.message
          : "The selected garment could not be loaded.",
      );
    }
  }

  function handleConfiguredApparel(item) {
    if (!selectedGarment) return;

    const itemName =
      item.description || item.name || selectedGarment.name || product.name;

    onChange?.({
      ...item,

      id: initialData?.id || createTemporaryId(),

      /*
       * Este productId debe apuntar al producto SanMar real para que,
       * al abrirlo dentro del quote, InlineProductEditor pueda cargar
       * otra vez ApparelConfigurator con colors y variants.
       */
      productId: selectedGarment.id,
      product: selectedGarment,

      name: itemName,
      description: itemName,

      qty: Number(item.qty || 1),
      unitPrice: Number(item.unitPrice || 0),
      subtotal: Number(item.subtotal ?? item.total ?? 0),
      total: Number(item.total ?? 0),

      customFields:
        item.customFields ||
        selectedGarment.customFields ||
        selectedGarment.template?.fields ||
        null,

      options: {
        ...(item.options || {}),

        productType: "apparel",

        // Producto genérico creado en Settings
        catalogProductId:
          product?.id ?? initialData?.options?.catalogProductId ?? null,

        // Prenda real seleccionada de SanMar
        apparelProductId: selectedGarment.id,

        // IMPORTANTE:
        // Guardamos el producto completo para poder reconstruir
        // el configurador cuando volvamos a editar el Invoice.
        apparelProduct: selectedGarment,

        supplier: selectedGarment.supplier,
        supplierStyle: selectedGarment.supplierStyle,
        brand: selectedGarment.brand,
      },

      discountType: null,
      discountValue: null,
      discountReason: "",

      _expanded: false,
    });
  }

  if (selectedGarment) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {selectedGarment.imageUrl && (
              <div className="h-20 w-20 overflow-hidden rounded-xl border bg-gray-50">
                <img
                  src={selectedGarment.imageUrl}
                  alt={selectedGarment.name}
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                {selectedGarment.brand || "SanMar"}
              </p>

              <h2 className="text-xl font-semibold text-gray-900">
                {selectedGarment.name}
              </h2>

              {selectedGarment.supplierStyle && (
                <p className="mt-1 text-sm text-gray-500">
                  Style {selectedGarment.supplierStyle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedGarment(null);
              setGarmentInitialData(null);
              setSearch("");
              setResults([]);
              onChange?.(null);
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Change garment
          </button>
        </div>

        <ApparelConfigurator
          product={selectedGarment}
          initialData={garmentInitialData}
          mode="product"
          onChange={handleConfiguredApparel}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
      <div className="mb-6 border-b border-gray-200 pb-5">
        <h2 className="text-2xl font-semibold text-gray-900">
          Select SanMar Apparel
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Search by brand, style number or garment name.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="relative">
        <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search brand, style or garment..."
          className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {isSearching && (
          <Loader2
            size={18}
            className="absolute right-3 top-3.5 animate-spin text-blue-600"
          />
        )}
      </div>

      {search.trim().length > 0 && search.trim().length < 2 && (
        <p className="mt-2 text-xs text-gray-500">
          Enter at least two characters.
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-4 max-h-[440px] overflow-y-auto rounded-xl border border-gray-200">
          {results.map((result) => (
            <button
              key={`${result.productType || "apparel"}-${result.id}`}
              type="button"
              onClick={() => handleSelectGarment(result)}
              className="flex w-full items-center gap-4 border-b border-gray-100 px-4 py-4 text-left transition last:border-0 hover:bg-gray-50"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                {result.imageUrl ? (
                  <img
                    src={result.imageUrl}
                    alt={result.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                    No image
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">{result.name}</p>

                <p className="mt-1 text-sm font-medium text-blue-600">
                  {result.brand || "SanMar"}
                  {result.supplierStyle
                    ? ` · Style ${result.supplierStyle}`
                    : ""}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {result.category || "Apparel"}
                  {result._count?.variants != null
                    ? ` · ${result._count.variants} variants`
                    : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {!isSearching &&
        search.trim().length >= 2 &&
        results.length === 0 &&
        !error && (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center">
            <p className="font-medium text-gray-700">No garments found</p>

            <p className="mt-1 text-sm text-gray-500">
              Try a brand name, style number or another garment name.
            </p>
          </div>
        )}
    </div>
  );
}
