"use client";

import { Search, Trash2 } from "lucide-react";
import InlineProductEditor from "@/components/InlineProductEditor";
import { buildOptionSummary } from "@/lib/document-items/buildOptionSummary";

export default function DocumentProductsSection({
  showCreateJobButton = true,
  invoiceId,
  checkingJob,
  jobInfo,
  showAddCard,
  setShowAddCard,
  setShowCreateJobModal,

  productCatalog,
  setProductCatalog,
  productSearch,
  setProductSearch,
  productResults,
  setProductResults,
  isSearchingProducts,
  handleSelectProduct,

  manualDesc,
  setManualDesc,
  manualQtyInput,
  setManualQtyInput,
  setManualQty,
  manualUnitInput,
  setManualUnitInput,
  setManualUnit,
  manualTotal,
  addManualItem,

  items,
  removeItem,
  handleToggleItemExpanded,
  getItemChangeHandler,
}) {
  return (
    <div className="w-full">
      {/* PRODUCTS HEADER */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Products</h2>
        </div>

        <div className="flex items-center gap-3">
          {showCreateJobButton && (
            <button
              disabled={!invoiceId || checkingJob || jobInfo?.exists}
              onClick={() => {
                if (!jobInfo?.exists) {
                  setShowCreateJobModal(true);
                }
              }}
              className={`px-5 py-2 rounded-lg text-sm font-medium ${
                !invoiceId || checkingJob
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : jobInfo?.exists
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-white border border-blue-600 text-blue-600 hover:bg-blue-50"
              }`}
            >
              {jobInfo?.exists ? "Job already created" : "+ Create Job"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddCard((current) => !current)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow text-sm font-medium"
          >
            + Add New Item
          </button>
        </div>
      </div>

      {/* PRODUCTS CARD */}
      <div className="mt-2 rounded-xl bg-white px-5 py-2 shadow-md">
        <div className="py-6 space-y-10">
          {/* ADD ITEM CARD */}
          {showAddCard && (
            <div className="bg-gray-50 border rounded-xl p-5 shadow-sm relative">
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* CATALOG SELECTOR */}
                <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProductCatalog("products");
                      setProductSearch("");
                      setProductResults([]);
                    }}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                      productCatalog === "products"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Products
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProductCatalog("apparel");
                      setProductSearch("");
                      setProductResults([]);
                    }}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                      productCatalog === "apparel"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    SanMar Apparel
                  </button>
                </div>

                {/* ADD ITEM ROW */}
                <div className="grid grid-cols-12 gap-4 items-end">
                  {/* SEARCH */}
                  <div className="col-span-3 relative">
                    <label className="text-xs font-semibold text-gray-500">
                      Search
                    </label>

                    <div className="relative mt-1">
                      <Search
                        className="absolute left-3 top-3 text-gray-400"
                        size={16}
                      />

                      <input
                        className="border rounded-lg pl-9 pr-3 py-2.5 w-full"
                        placeholder={
                          productCatalog === "apparel"
                            ? "Search brand, style or garment..."
                            : "Search products..."
                        }
                        value={productSearch}
                        onChange={(event) =>
                          setProductSearch(event.target.value)
                        }
                      />

                      {isSearchingProducts && (
                        <p className="mt-2 text-xs text-gray-500">
                          Searching...
                        </p>
                      )}
                    </div>

                    {productResults.length > 0 && (
                      <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[340px] max-h-[320px] overflow-y-auto overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                        {productResults.map((product) => (
                          <button
                            key={`${product.productType}-${product.id}`}
                            type="button"
                            onClick={() => handleSelectProduct(product)}
                            className="w-full border-b border-gray-100 px-4 py-3 text-left transition last:border-0 hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              {product.productType === "apparel" && (
                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                                  {product.imageUrl ? (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.name}
                                      className="h-full w-full object-contain"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                      No image
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="truncate font-medium text-gray-900">
                                  {product.name}
                                </p>

                                {product.productType === "apparel" && (
                                  <>
                                    <p className="mt-0.5 text-xs font-medium text-blue-600">
                                      {product.brand || "SanMar"} · Style{" "}
                                      {product.supplierStyle}
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                      {product.category || "Apparel"} ·{" "}
                                      {product._count?.variants || 0} variants
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* DESCRIPTION */}
                  <div className="col-span-3">
                    <label className="text-xs font-semibold text-gray-500">
                      Description
                    </label>

                    <input
                      className="mt-1 border rounded-lg px-3 py-2.5 w-full"
                      placeholder="Description"
                      value={manualDesc}
                      onChange={(event) => setManualDesc(event.target.value)}
                    />
                  </div>

                  {/* QUANTITY */}
                  <div className="col-span-1">
                    <label className="text-xs font-semibold text-gray-500">
                      Qty
                    </label>

                    <input
                      inputMode="numeric"
                      className="mt-1 border rounded-lg px-3 py-2.5 w-full text-right"
                      value={manualQtyInput}
                      onChange={(event) => {
                        const value = event.target.value;

                        if (!/^\d*$/.test(value)) {
                          return;
                        }

                        setManualQtyInput(value);
                        setManualQty(Number(value || 0));
                      }}
                    />
                  </div>

                  {/* UNIT PRICE */}
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500">
                      Unit Price
                    </label>

                    <input
                      inputMode="decimal"
                      className="mt-1 border rounded-lg px-3 py-2.5 w-full text-left"
                      value={manualUnitInput}
                      onChange={(event) => {
                        const value = event.target.value;

                        if (!/^\d*\.?\d*$/.test(value)) {
                          return;
                        }

                        setManualUnitInput(value);
                        setManualUnit(Number(value || 0));
                      }}
                    />
                  </div>

                  {/* TOTAL */}
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500">
                      Total
                    </label>

                    <input
                      readOnly
                      className="mt-1 border rounded-lg px-3 py-2.5 w-full bg-gray-100 font-semibold text-right"
                      value={manualTotal === 0 ? "0" : manualTotal.toFixed(2)}
                    />
                  </div>

                  {/* ADD MANUAL ITEM */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={addManualItem}
                      className="h-[42px] w-[42px] bg-green-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center shadow"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ITEMS LIST */}
          <div>
            {items.length === 0 ? (
              <p className="text-gray-500">No products added yet.</p>
            ) : (
              items.map((item, index) => {
                const isManual = !item.productId;
                const displayQty = isManual ? item.qty : 1;

                return (
                  <div
                    key={item.id}
                    className={`p-5 mb-1 shadow-sm ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute top-2 right-4 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {!item._expanded ? (
                      <div
                        className="cursor-pointer"
                        onClick={() => handleToggleItemExpanded(index)}
                      >
                        <div className="grid grid-cols-[30%_2fr_150px_200px_150px] gap-4 p-4 bg-white-50 border-gray-300 rounded-lg">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {item.name}
                            </p>

                            {buildOptionSummary(item) && (
                              <p className="text-sm text-gray-600 mt-1">
                                {buildOptionSummary(item)}
                              </p>
                            )}
                          </div>

                          <div />

                          <div>
                            <p className="text-sm text-gray-500">Qty</p>
                            <p className="font-bold">{displayQty}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Unit Price</p>

                            <p className="font-semibold">
                              ${Number(item.unitPrice).toLocaleString()}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Total</p>

                            <p className="font-bold">
                              ${Number(item.total).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <InlineProductEditor
                        product={item.product || null}
                        data={item}
                        onChange={getItemChangeHandler(index)}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
