"use client";

import { Trash2, Search } from "lucide-react";
import InlineProductEditor from "@/components/InlineProductEditor";
import CustomerSearchModal from "@/components/CustomerSearchModal";
import { useEffect, useRef, useState } from "react";
import AssignTeamMemberModal from "@/components/AssignTeamMemberModal";
import CreateJobModal from "@/components/CreateJobModal";

export default function QuoteEditor({ mode = "new", quoteId: editQuoteId = null }) {
  // ----------------------------------------
  // CUSTOMER (antes client)
  // ----------------------------------------
  const [selectedClient, setSelectedClient] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // ----------------------------------------
  // PRODUCT SEARCH
  // ----------------------------------------
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedHash, setLastSavedHash] = useState(null);

  // ----------------------------------------
  // ITEMS
  // ----------------------------------------
  const [items, setItems] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);

  // ----------------------------------------
  // QUOTE FIELDS
  // ----------------------------------------
  const [quoteDate, setQuoteDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expiryDate, setExpiryDate] = useState("");

  const [taxRate, setTaxRate] = useState(6.625);
  const [paymentOption, setPaymentOption] = useState("full");

  const [status, setStatus] = useState("Pending");
  const [customerNotes, setCustomerNotes] = useState("");

  const [quoteId, setQuoteId] = useState(null);
  const [quoteNumber, setQuoteNumber] = useState(null);

  const [showCreateJobModal, setShowCreateJobModal] = useState(false);

  // ----------------------------------------
  // MANUAL ITEM FIELDS
  // ----------------------------------------
  const [manualDesc, setManualDesc] = useState("");
  const [manualQty, setManualQty] = useState(1);
  const [manualUnit, setManualUnit] = useState(0);
  const [manualTotal, setManualTotal] = useState(0);

  // -----------------------------
  // TEAM ASSIGNMENTS
  // -----------------------------
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeRole, setActiveRole] = useState(null);

  const [team, setTeam] = useState({
    salesRep: null,
    productionManager: null,
    projectManager: null,
  });

  // SUMMARY BUILDER
  const buildOptionSummary = (item) => {
    const fields = [];
    if (item.qty) fields.push(`Qty: ${item.qty}`);
    if (item.finish) fields.push(`Finish: ${item.finish}`);
    if (item.design) fields.push(`Design: ${item.design}`);
    if (item.sides) fields.push(`Sides: ${item.sides}`);
    if (item.corners) fields.push(`Corners: ${item.corners}`);
    return fields.join(" • ");
  };

  // ======================================================
  // ✅ LOAD QUOTE (EDIT MODE) - SOLO UNO (sin duplicar)
  // ======================================================
  useEffect(() => {
    if (mode !== "edit" || !editQuoteId) return;

    const loadQuote = async () => {
      try {
        const res = await fetch(`/api/quotes/${editQuoteId}`);
        const data = await res.json();

        setQuoteId(data.id);
        setQuoteNumber(data.quoteNumber);
        setSelectedClient(data.client);
        setStatus(data.status);
        setQuoteDate(data.quoteDate?.split("T")[0] || "");
        setExpiryDate(data.validUntil ? data.validUntil.split("T")[0] : "");
        setCustomerNotes(data.customerNotes || "");

        // 🔥 FIX: ENRIQUECER ITEMS CON PRODUCT REAL (para que InlineProductEditor muestre config)
        const enrichedItems = await Promise.all(
          (data.items || []).map(async (i) => {
            let productData = null;

            if (i.productId) {
              const pRes = await fetch(`/api/products/${i.productId}`);
              productData = await pRes.json();
            }

            const defaults = productData?.defaultOptions || {};

            return {
              id: crypto.randomUUID(),
              productId: i.productId || null,

              // ✅ ESTO ES LO CRÍTICO: el editor necesita el producto completo
              product: productData,

              // display
              name: productData?.name || i.description || "Item",

              qty: i.qty || 1,
              unitPrice: i.unitPrice || 0,
              total: i.total || 0,

              // ✅ si el quoteItem guardó customFields/options, respétalos.
              // si no existen, usa los del producto/template
              customFields:
                i.customFields ||
                productData?.customFields ||
                productData?.template?.fields ||
                null,

              options:
                i.options ||
                productData?.defaultOptions ||
                productData?.template?.options ||
                [],

              finish: i.finish || defaults.finish || "",
              design: i.design || defaults.design || "",
              sides: i.sides || defaults.sides || "",
              corners: i.corners || defaults.corners || "",

              _expanded: true,
            };
          })
        );

        setItems(enrichedItems);
      } catch (err) {
        console.error("❌ Error loading quote", err);
      }
    };

    loadQuote();
  }, [mode, editQuoteId]);

  // ----------------------------------------
  // PRODUCT AUTOCOMPLETE
  // ----------------------------------------
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (productSearch.length < 2) return setProductResults([]);

      const res = await fetch(`/api/products/search?q=${productSearch}`);
      const data = await res.json();

      setProductResults(Array.isArray(data) ? data : []);
    }, 300);

    return () => clearTimeout(delay);
  }, [productSearch]);

  // ----------------------------------------
  // CALCULOS
  // ----------------------------------------
  const subtotal = items.reduce((t, i) => t + (i.total || 0), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  // ----------------------------------------
  // SAVE QUOTE (AUTOSAVE)
  // ----------------------------------------
  const buildQuoteHash = () => {
    return JSON.stringify({
      customerId: selectedClient?.id || null,
      quoteDate,
      expiryDate,
      status,
      
      customerNotes,
      items,
      subtotal,
      tax,
      total,
      paymentOption,
    });
  };

  const autoSaveQuote = async () => {
    if (!quoteId || !selectedClient || isSaving) return;

    const currentHash = buildQuoteHash();
    if (currentHash === lastSavedHash) return;

    setIsSaving(true);

    try {
      await fetch(`/api/quotes/${quoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedClient.id,
          quoteDate,
          expiryDate,
          status,
         
          customerNotes,
          items,
          subtotal,
          tax,
          total,
          paymentOption,
        }),
      });

      setLastSavedHash(currentHash);
    } catch (err) {
      console.error("❌ Auto-save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!quoteId) return;

    const delay = setTimeout(() => {
      autoSaveQuote();
    }, 800);

    return () => clearTimeout(delay);
  }, [items, status, quoteDate, expiryDate, customerNotes, quoteId]);

  // ----------------------------------------
  // SELECT PRODUCT
  // ----------------------------------------
  const handleSelectProduct = async (p) => {
    const res = await fetch(`/api/products/${p.id}`);
    const full = await res.json();
    const defaults = full.defaultOptions || {};

    const newLine = {
      id: crypto.randomUUID(),
      productId: full.id,

      // ✅ PASAR PRODUCT COMPLETO PARA CONFIGURAR
      product: full,

      name: full.name,
      qty: 1,
      unitPrice: 0,
      total: 0,

      customFields: full.customFields || full.template?.fields || null,
      options: full.defaultOptions || full.template?.options || [],

      finish: defaults.finish || "",
      design: defaults.design || "",
      sides: defaults.sides || "",
      corners: defaults.corners || "",

      _expanded: true,
    };

    setItems((prev) => [...prev, newLine]);
    setProductSearch("");
    setProductResults([]);
    setShowAddCard(false);
  };

  // ----------------------------------------
  // ADD MANUAL ITEM
  // ----------------------------------------
  const addManualItem = () => {
    if (!manualDesc.trim()) return alert("Enter description");

    const newLine = {
      id: crypto.randomUUID(),
      productId: null,
      product: null, // manual no tiene product

      name: manualDesc,
      qty: Number(manualQty),
      unitPrice: Number(manualUnit),
      total: Number(manualTotal) || Number(manualQty) * Number(manualUnit),

      customFields: null,
      options: [],

      _expanded: false,
      finish: "",
      design: "",
      sides: "",
      corners: "",
    };

    setItems((prev) => [...prev, newLine]);

    setManualDesc("");
    setManualQty(1);
    setManualUnit(0);
    setManualTotal(0);
    setShowAddCard(false);
  };

  // ----------------------------------------
  // UPDATE ITEM
  // ----------------------------------------
  const updateItem = (index, fields) => {
    const updated = [...items];
    const merged = { ...updated[index], ...fields };

    merged.total =
      fields.total !== undefined
        ? fields.total
        : (merged.qty || 1) * (merged.unitPrice || 0);

    updated[index] = merged;
    setItems(updated);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // ======================================================
  // ACTIONS MENU (igual a tu código)
  // ======================================================
  function QuoteActionsMenu() {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setOpen(false);
        }
      };

      if (open) document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border bg-white hover:bg-gray-100"
        >
          ⋯
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg z-50">
            <button
  onClick={async () => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/convert`, {
        method: "POST",
      });

      if (res.status === 409) {
        alert("This quote already has an invoice");
        return;
      }

      if (!res.ok) throw new Error();

      const invoice = await res.json();

      // 🔥 ESTE ES EL FIX
      window.location.href = `/invoices/${invoice.id}`;
    } catch (err) {
      console.error(err);
      alert("Error converting quote");
    }
  }}
>
  Convert to Invoice
</button>



            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              onClick={() => {
                setOpen(false);
                alert("Create Copy (next step)");
              }}
            >
              Create Copy
            </button>

            <div className="border-t my-1" />

           <button
  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
  onClick={async () => {
    setOpen(false);

    if (!quoteId) return;

    const confirmDelete = confirm(
      "Are you sure you want to void this quote? This action cannot be undone."
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete quote");

      // 👉 regresar a la lista
      window.location.href = "/quotes";
    } catch (err) {
      console.error("❌ Void quote error:", err);
      alert("Error voiding quote");
    }
  }}
>
  Void
</button>

          </div>
        )}
      </div>
    );
  }

  // ======================================================
  // RENDER UI (TU UI COMPLETA)
  // ======================================================
  return (
    <main className="min-h-screen bg-[#F5F7F9] py-12 px-4 space-y-10">
      <div className="mx-auto max-w-[1240px] mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-700">
          QT #{quoteNumber ?? ""}
        </h1>

        <QuoteActionsMenu />
      </div>

      {/* CARD 1 — QUOTE DETAILS */}
      <div className="mx-auto max-w-[1240px] bg-white border rounded-xl shadow-md">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-3">
           
            <h2 className="text-xl font-bold">Quote Details</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm">
              {isSaving ? (
                <span className="text-yellow-600 font-medium">Saving…</span>
              ) : (
                <span className="text-green-600 font-medium">Saved</span>
              )}
            </div>

            <button
              onClick={() => setShowCustomerModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow"
            >
              {selectedClient ? "Change Customer" : "+ Add Customer"}
            </button>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* CUSTOMER */}
            <div className="space-y-4">
              <h4 className="text-base font-semibold text-black-700">Customer</h4>

              {selectedClient ? (
                <>
                  <div className="flex items-center gap-3">
                    
                    <div>
                      <p className="text-base font-semibold text-black-700">
                        {selectedClient.name}
                      </p>
                      <p className="text-sm text-#9DA6AF-500">Customer</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                   
                    <div>
                      <p className="text-base font-semibold text-black-700">
                        {selectedClient.company || "Primary Contact"}
                      </p>
                      <p className="text-sm text-#9DA6AF-500">Primary Contact</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-black-400">No customer selected</p>
              )}
            </div>

            {/* STATUS */}
            <div className="space-y-4">
              <h4 className="text-dase font-semibold text-black-700">Status</h4>

              <div>
                <p className="text-xs text-black-500">Status</p>
                <select
                  className="mt-1 border rounded-lg px-4 py-2.5 w-full"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Converted to Invoice">Converted to Invoice</option>
                </select>
              </div>

              <div>
                <p className="text-xs text-black-500">Ordered / Invoiced</p>
                <p className="text-sm font-semibold text-black-800">No / No</p>
              </div>
            </div>

            {/* TEAM ASSIGNMENTS */}
            <div className="space-y-4">
              <h4 className="text-dase font-bold text-black-700">
                Team Assignments
              </h4>

              {[
                { label: "Sales Rep", key: "salesRep" },
                { label: "Production Manager", key: "productionManager" },
                { label: "Project Manager", key: "projectManager" },
              ].map((role) => (
                <div key={role.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-black-700">{role.label}</p>
                    {team[role.key] && (
                      <p className="text-xs text-black-500">
                        {team[role.key].name}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setActiveRole(role.key);
                      setShowAssignModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✏️
                  </button>
                </div>
              ))}
            </div>

            {/* DATES */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Dates</h4>

              <div>
                <p className="text-xs text-gray-500">Quote Date</p>
                <input
                  type="date"
                  className="mt-1 border rounded-lg px-4 py-2.5 w-full"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                />
              </div>

              <div>
                <p className="text-xs text-gray-500">Due Date</p>
                <input
                  type="date"
                  className="mt-1 border rounded-lg px-4 py-2.5 w-full"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="mx-auto max-w-[1240px] bg-white border rounded-xl shadow-md">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-3">
           
            <h2 className="text-xl font-bold">Products</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateJobModal(true)}
              className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 px-5 py-2 rounded-lg shadow-sm text-sm font-medium"
            >
              + Create Job
            </button>

            <button
              onClick={() => setShowAddCard(!showAddCard)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow text-sm font-medium"
            >
              + Add New Item
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-10">
          {/* ADD ITEM CARD */}
          {showAddCard && (
            <div className="bg-gray-50 border rounded-xl p-5 shadow-sm relative">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setShowAddCard(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* PRODUCT SEARCH */}
                <div className="relative">
                  <label className="text-sm font-semibold">Search</label>
                  <div className="relative mt-1">
                    <Search
                      className="absolute left-3 top-3 text-gray-400"
                      size={18}
                    />
                    <input
                      className="border rounded-lg pl-10 px-3 py-2.5 w-full"
                      placeholder="Search..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  {productResults.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border rounded-xl shadow max-h-56 overflow-y-auto mt-2">
                      {productResults.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSelectProduct(p)}
                        >
                          <p className="font-medium">{p.name}</p>
                          <p className="text-sm text-gray-500">
                            ${p.price || p.basePrice}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* MANUAL ITEM */}
                <div>
                  <label className="text-sm font-semibold">Description</label>
                  <input
                    className="mt-1 border rounded-lg px-3 py-2.5 w-full"
                    value={manualDesc}
                    onChange={(e) => setManualDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Qty</label>
                  <input
                    type="number"
                    className="mt-1 border rounded-lg px-3 py-2.5 w-full"
                    value={manualQty}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setManualQty(v);
                      setManualTotal(v * manualUnit);
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Unit Price</label>
                  <input
                    type="number"
                    className="mt-1 border rounded-lg px-3 py-2.5 w-full"
                    value={manualUnit}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setManualUnit(v);
                      setManualTotal(v * manualQty);
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Total</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      className="border rounded-lg px-3 py-2.5 w-full"
                      value={manualTotal}
                      onChange={(e) => setManualTotal(Number(e.target.value))}
                    />
                    <button
                      onClick={addManualItem}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow"
                    >
                      ✓ Add
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
const isConfigurable = !isManual;
const displayQty = isManual ? item.qty : 1;


                return (
                  <div
                    key={item.id}
                    className="border rounded-xl p-4 mb-6 shadow-sm "
                  >
                    <div className=" relative">
                     

                      <button
                        onClick={() => removeItem(index)}
                        className="absolute top-2 right-4 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {!item._expanded ? (
 <div
  className="cursor-pointer"
  onClick={() => updateItem(index, { _expanded: true })}
>

                        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-gray-300 rounded-lg">

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
                            <p className="font-bold text-emerald-600">
                              ${Number(item.total).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                 ) : isConfigurable ? (
  <InlineProductEditor
    product={item.product}
    data={item}
    onChange={(fields) => updateItem(index, fields)}
  />
) : (
  // 🧾 MANUAL ITEM EDITOR
  <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
    <div>
      <label className="text-xs text-gray-500">Description</label>
      <input
        className="border rounded px-2 py-1 w-full"
        value={item.name}
        onChange={(e) =>
          updateItem(index, { name: e.target.value })
        }
      />
    </div>

    <div>
      <label className="text-xs text-gray-500">Qty</label>
      <input
        type="number"
        className="border rounded px-2 py-1 w-full"
        value={item.qty}
        onChange={(e) =>
          updateItem(index, { qty: Number(e.target.value) })
        }
      />
    </div>

    <div>
      <label className="text-xs text-gray-500">Unit</label>
      <input
        type="number"
        className="border rounded px-2 py-1 w-full"
        value={item.unitPrice}
        onChange={(e) =>
          updateItem(index, { unitPrice: Number(e.target.value) })
        }
      />
    </div>

    <div>
      <label className="text-xs text-gray-500">Total</label>
      <input
        type="number"
        className="border rounded px-2 py-1 w-full"
        value={item.total}
        onChange={(e) =>
          updateItem(index, { total: Number(e.target.value) })
        }
      />
    </div>

    <div className="col-span-4 text-right">
      <button
        className="text-blue-600 text-sm"
        onClick={() => updateItem(index, { _expanded: false })}
      >
        Done
      </button>
    </div>
  </div>
)}

                  </div>
                );
              })
            )}
          </div>

          {/* CUSTOMER NOTES */}
          <div>
            <label className="text-sm font-semibold">Customer Notes</label>
            <textarea
              className="mt-1 border rounded-lg px-4 py-2.5 w-full min-h-[160px]"
              placeholder="Notes visible on the PDF…"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TOTALS */}
      <div className="mx-auto max-w-[1280px] text-right space-y-2">
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>Tax: ${tax.toFixed(2)}</p>
        <p className="text-2xl font-bold">Total: ${total.toFixed(2)}</p>
      </div>

      {/* CUSTOMER MODAL */}
      {showCustomerModal && (
        <CustomerSearchModal
          onSelect={async (customer) => {
            setSelectedClient(customer);
            setShowCustomerModal(false);

            // ✅ EDIT MODE: no crees otro quote
            if (mode === "edit") return;

            // ✅ NEW MODE: si ya existe quoteId, no crear otro
            if (quoteId) return;

    const res = await fetch("/api/quotes", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    clientId: customer.id,
    quoteDate,
    expiryDate,
    status,
    items,          // 🔥 AHORA SÍ
    subtotal,
    tax,
    total,
    paymentOption,
  }),
});


            const data = await res.json();

            if (!res.ok || data?.error) {
              console.error("❌ Create quote error:", data);
              alert("Error creating quote");
              return;
            }

            setQuoteId(data.id);
            setQuoteNumber(data.quoteNumber);
          }}
          onClose={() => setShowCustomerModal(false)}
        />
      )}

      {showAssignModal && (
        <AssignTeamMemberModal
          title={`Assign ${activeRole}`}
          users={[
            { id: 1, name: "Freddy", role: "Sales" },
            { id: 2, name: "Juan", role: "Production" },
            { id: 3, name: "Maria", role: "Manager" },
          ]}
          selectedUser={team[activeRole]}
          onSelect={(user) => setTeam((prev) => ({ ...prev, [activeRole]: user }))}
          onClose={() => setShowAssignModal(false)}
        />
      )}

      {showCreateJobModal && (
        <CreateJobModal
          quote={{ quoteNumber }}
          items={items}
          team={team}
          onCreate={async () => {
            if (!quoteId) {
              alert("Quote must be saved before creating a Job");
              return;
            }

            try {
              const res = await fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quoteId }),
              });

              if (res.status === 409) {
                alert("This Quote already has a Job");
                return;
              }

              if (!res.ok) throw new Error("Failed to create Job");

              await res.json();
              setShowCreateJobModal(false);
              window.location.href = "/production";
            } catch (err) {
              console.error("❌ Create Job error:", err);
              alert("Error creating Job");
            }
          }}
          onClose={() => setShowCreateJobModal(false)}
        />
      )}
    </main>
  );
}
