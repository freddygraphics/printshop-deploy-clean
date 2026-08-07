"use client";

import DocumentProductsSection from "@/components/document/DocumentProductsSection";
import DocumentDetailsCard from "@/components/document/DocumentDetailsCard";
import { createManualDocumentItem } from "@/lib/document-items/createManualDocumentItem";
import { updateDocumentItem } from "@/lib/document-items/updateDocumentItem";
import DocumentTotalsSection from "@/components/document/DocumentTotalsSection";
import {
  removeDocumentItem,
  toggleDocumentItemExpanded,
} from "@/lib/document-items/documentItemActions";
import DocumentHeader from "@/components/document/DocumentHeader";
import DocumentEditorLayout from "@/components/document/DocumentEditorLayout";
import CustomerSearchModal from "@/components/CustomerSearchModal";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuotePersistence } from "@/hooks/useQuotePersistence";
import AssignTeamMemberModal from "@/components/AssignTeamMemberModal";
import CreateJobModal from "@/components/CreateJobModal";
import { searchDocumentProducts } from "@/lib/document-items/searchDocumentProducts";
import { createDocumentItem } from "@/lib/document-items/createDocumentItem";
import UnsavedChangesDialog from "@/components/dialogs/UnsavedChangesDialog";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
export default function QuoteEditor({
  mode = "new",
  quoteId: editQuoteId = null,
}) {
  // ----------------------------------------
  // CUSTOMER (antes client)
  // ----------------------------------------
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // ----------------------------------------
  // PRODUCT SEARCH
  // ----------------------------------------
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [productCatalog, setProductCatalog] = useState("products");
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  const savingRef = useRef(false);
  const quoteHydratedRef = useRef(false);

  // ----------------------------------------
  // ITEMS
  // ----------------------------------------
  const [items, setItems] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);

  // ----------------------------------------
  // QUOTE FIELDS
  // ----------------------------------------
  const [quoteDate, setQuoteDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [expiryDate, setExpiryDate] = useState("");

  const [taxRate, setTaxRate] = useState(6.625);
  const [paymentOption, setPaymentOption] = useState("full");

  const [status, setStatus] = useState(mode === "new" ? "Draft" : "Pending");
  const [customerNotes, setCustomerNotes] = useState("");

  const [quoteId, setQuoteId] = useState(null);
  const [quoteNumber, setQuoteNumber] = useState(null);

  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const { saveItems, scheduleAutosave, persistQuote } = useQuotePersistence({
    quoteId,
  });

  // ----------------------------------------
  // MANUAL ITEM FIELDS
  // ----------------------------------------
  const [manualDesc, setManualDesc] = useState("");

  const [manualQtyInput, setManualQtyInput] = useState("1");
  const [manualQty, setManualQty] = useState(1);

  const [manualUnitInput, setManualUnitInput] = useState("0");
  const [manualUnit, setManualUnit] = useState(0);

  const manualTotal = manualQty * manualUnit;
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

  // ======================================================
  // LOAD EXISTING QUOTE
  // ======================================================
  useEffect(() => {
    const numericQuoteId = Number(editQuoteId);

    if (
      mode !== "edit" ||
      !Number.isInteger(numericQuoteId) ||
      numericQuoteId <= 0
    ) {
      return;
    }

    let active = true;

    async function loadQuote() {
      try {
        quoteHydratedRef.current = false;

        const res = await fetch(`/api/quotes/${numericQuoteId}`, {
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            data?.error ||
              data?.details ||
              `Could not load quote (${res.status})`,
          );
        }

        if (!data?.id) {
          throw new Error("The quote API returned invalid data.");
        }

        const enrichedItems = await Promise.all(
          (data.items || []).map(async (item) => {
            let productData = null;

            const itemOptions =
              item.options &&
              typeof item.options === "object" &&
              !Array.isArray(item.options)
                ? item.options
                : {};

            const productType = String(itemOptions.productType || "")
              .trim()
              .toLowerCase();

            const isApparel = productType === "apparel";

            // Producto normal de la tabla Product
            if (item.productId) {
              const productResponse = await fetch(
                `/api/products/${item.productId}`,
                {
                  cache: "no-store",
                },
              );

              if (productResponse.ok) {
                productData = await productResponse.json();
              }
            }

            // Producto SanMar guardado dentro de options
            if (isApparel && itemOptions.apparelProductId) {
              const apparelResponse = await fetch(
                `/api/apparel/${itemOptions.apparelProductId}`,
                {
                  cache: "no-store",
                },
              );

              if (apparelResponse.ok) {
                const apparelData = await apparelResponse.json();

                if (apparelData?.product) {
                  productData = {
                    ...apparelData.product,

                    category: "apparel",
                    productType: "apparel",

                    colors: Array.isArray(apparelData.colors)
                      ? apparelData.colors
                      : [],

                    variants: Array.isArray(apparelData.variants)
                      ? apparelData.variants
                      : [],

                    sizes: Array.isArray(apparelData.sizes)
                      ? apparelData.sizes
                      : [],

                    inventory: Array.isArray(apparelData.inventory)
                      ? apparelData.inventory
                      : [],

                    images: Array.isArray(apparelData.images)
                      ? apparelData.images
                      : [],

                    printLocations: Array.isArray(apparelData.printLocations)
                      ? apparelData.printLocations
                      : [],

                    pricing: apparelData.pricing || null,
                  };
                }
              }
            }
            return {
              ...item,

              product: productData,

              options: {
                ...(item.options || {}),
              },

              _expanded: false,
            };
          }),
        );

        if (!active) return;

        setQuoteId(Number(data.id));
        setQuoteNumber(data.quoteNumber ?? null);
        setSelectedClient(data.client || null);

        setQuoteDate(
          data.quoteDate
            ? String(data.quoteDate).slice(0, 10)
            : new Date().toISOString().slice(0, 10),
        );

        setExpiryDate(
          data.validUntil ? String(data.validUntil).slice(0, 10) : "",
        );

        setStatus(data.status || "Draft");
        setCustomerNotes(data.customerNotes || "");
        setItems(enrichedItems);

        quoteHydratedRef.current = true;
        markSaved();

        console.log("QUOTE HYDRATED:", {
          id: data.id,
          quoteNumber: data.quoteNumber,
          status: data.status,
          items: enrichedItems.length,
        });
      } catch (error) {
        quoteHydratedRef.current = false;

        console.error("❌ Error loading quote:", error);

        alert(error instanceof Error ? error.message : "Could not load quote.");
      }
    }

    loadQuote();

    return () => {
      active = false;
    };
  }, [mode, editQuoteId]);
  // ----------------------------------------
  // PRODUCT AUTOCOMPLETE
  // ----------------------------------------
  useEffect(() => {
    const controller = new AbortController();

    const delay = setTimeout(async () => {
      const query = productSearch.trim();

      if (query.length < 2) {
        setProductResults([]);
        setIsSearchingProducts(false);
        return;
      }

      try {
        setIsSearchingProducts(true);

        const results = await searchDocumentProducts({
          query,
          catalog: productCatalog,
          signal: controller.signal,
        });

        setProductResults(results);
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error("Error searching quote products:", error);

          setProductResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingProducts(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(delay);
      controller.abort();
    };
  }, [productSearch, productCatalog]);

  // ----------------------------------------
  // CALCULOS
  // ----------------------------------------
  const validItems = Array.isArray(items)
    ? items.filter((item) => item && typeof item === "object")
    : [];

  const subtotal = validItems.reduce((total, item) => {
    return total + Number(item.total || 0);
  }, 0);

  const tax = taxEnabled ? subtotal * (taxRate / 100) : 0;
  const total = subtotal + tax;

  const saveQuoteAsDraft = useCallback(async () => {
    if (!selectedClient && items.length === 0) {
      return;
    }

    if (!quoteId) {
      throw new Error(
        "The quote has not been created yet. Add a customer and save the quote first.",
      );
    }

    if (items.length > 0) {
      await saveItems(items);
    }

    await persistQuote({
      clientId: selectedClient?.id ?? null,
      quoteDate,
      expiryDate,
      status: "Draft",
      customerNotes,
      subtotal,
      tax,
      total,
      paymentOption,
    });
  }, [
    quoteId,
    selectedClient,
    items,
    quoteDate,
    expiryDate,
    customerNotes,
    subtotal,
    tax,
    total,
    paymentOption,
    saveItems,
    persistQuote,
  ]);

  const {
    showUnsavedDialog,
    isSavingDraft,
    markUnsaved,
    markSaved,
    requestNavigation,
    closeUnsavedDialog,
    handleSaveDraftAndLeave,
    handleDiscardAndLeave,
  } = useUnsavedChanges({
    onSaveDraft: saveQuoteAsDraft,
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!quoteHydratedRef.current) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    markUnsaved();
  }, [
    quoteDate,
    expiryDate,
    status,
    customerNotes,
    taxEnabled,
    paymentOption,
    markUnsaved,
  ]);

  useEffect(() => {
    if (!quoteId) return;
    if (!selectedClient) return;
    if (!quoteHydratedRef.current) return;

    const timeoutId = setTimeout(() => {
      persistQuote({
        clientId: selectedClient.id,
        quoteDate,
        expiryDate,
        status,
        customerNotes,
        subtotal,
        tax,
        total,
        paymentOption,
      })
        .then(() => {
          markSaved();
        })
        .catch((error) => {
          console.error("❌ Error saving quote details:", error);
        });
    }, 700);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    quoteId,
    selectedClient,
    quoteDate,
    expiryDate,
    status,
    customerNotes,
    subtotal,
    tax,
    total,
    paymentOption,
    persistQuote,
    markSaved,
  ]);
  // ----------------------------------------
  // SELECT PRODUCT
  // ----------------------------------------
  const handleSelectProduct = async (productResult) => {
    try {
      const createdItem = await createDocumentItem(productResult);

      const description =
        String(
          createdItem.description ||
            createdItem.name ||
            createdItem.product?.name ||
            productResult?.name ||
            "Item",
        ).trim() || "Item";

      const newItem = {
        ...createdItem,
        name: description,
        description,
        _expanded: true,
      };

      const nextItems = [
        ...items.map((item) => ({
          ...item,
          _expanded: false,
        })),
        newItem,
      ];

      setItems(nextItems);
      markUnsaved();

      if (quoteId) {
        await saveItems(nextItems);
        markSaved();
      }

      setProductSearch("");
      setProductResults([]);
      setShowAddCard(false);
    } catch (error) {
      console.error("❌ Error selecting quote product:", error);

      alert(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el producto.",
      );
    }
  };

  // ----------------------------------------
  // ADD MANUAL ITEM
  // ----------------------------------------
  const addManualItem = async () => {
    try {
      const newItem = createManualDocumentItem({
        description: manualDesc,
        quantity: manualQty,
        unitPrice: manualUnit,
      });

      const description =
        String(newItem.description || newItem.name || manualDesc).trim() ||
        "Item";

      const normalizedItem = {
        ...newItem,
        name: description,
        description,
      };

      const nextItems = [...items, normalizedItem];

      setItems(nextItems);
      setShowAddCard(false);
      markUnsaved();

      if (quoteId) {
        await saveItems(nextItems);
        markSaved();
      }

      setManualDesc("");

      setManualQty(1);
      setManualQtyInput("1");

      setManualUnit(0);
      setManualUnitInput("0");
    } catch (error) {
      console.error("❌ Could not add quote item:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Could not add the manual item.",
      );
    }
  };

  // ----------------------------------------
  // UPDATE ITEM
  // ----------------------------------------
  const handleItemChange = useCallback(
    (index, fields) => {
      setItems((previousItems) => {
        const normalizedFields = {
          ...fields,
        };

        if (Object.prototype.hasOwnProperty.call(fields, "name")) {
          normalizedFields.description = fields.name;
        }

        if (Object.prototype.hasOwnProperty.call(fields, "description")) {
          normalizedFields.name = fields.description;
        }

        const nextItems = updateDocumentItem(
          previousItems,
          index,
          normalizedFields,
        );
        markUnsaved();
        const updatedItem = nextItems[index];

        const isManualItem =
          !updatedItem?.productId &&
          !updatedItem?.product &&
          !updatedItem?.options?.productType;

        if (fields.__commit === true && !savingRef.current) {
          savingRef.current = true;

          Promise.resolve()
            .then(async () => {
              await saveItems(nextItems);
              markSaved();
            })
            .catch((error) => {
              console.error("❌ Error saving quote item:", error);

              alert(error.message);
            })
            .finally(() => {
              savingRef.current = false;
            });
        } else if (!isManualItem) {
          scheduleAutosave(nextItems, markSaved);
        }

        return nextItems;
      });
    },
    [saveItems, scheduleAutosave, markUnsaved, markSaved],
  );

  const getItemChangeHandler = useCallback(
    (index) => {
      return (fields) => {
        handleItemChange(index, fields);
      };
    },
    [handleItemChange],
  );
  const removeItem = async (index) => {
    const previousItems = items;

    const nextItems = removeDocumentItem(previousItems, index);

    setItems(nextItems);
    markUnsaved();
    if (!quoteId) return;

    try {
      await saveItems(nextItems);
      markSaved();
    } catch (error) {
      console.error("❌ Error removing quote item:", error);

      setItems(previousItems);

      alert("Could not remove the product.");
    }
  };
  const handleToggleItemExpanded = (index) => {
    setItems((previousItems) =>
      toggleDocumentItemExpanded(previousItems, index),
    );
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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
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
                  markSaved();
                  requestNavigation(`/invoices/${invoice.id}`);
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
                  "Are you sure you want to void this quote? This action cannot be undone.",
                );

                if (!confirmDelete) return;

                try {
                  const res = await fetch(`/api/quotes/${quoteId}`, {
                    method: "DELETE",
                  });

                  if (!res.ok) throw new Error("Failed to delete quote");

                  // 👉 regresar a la lista
                  markSaved();
                  requestNavigation("/quotes");
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
    <DocumentEditorLayout>
      <DocumentHeader
        title={`QT #${quoteNumber ?? ""}`}
        actions={
          <>
            <button
              type="button"
              disabled={!quoteId}
              onClick={() => {
                window.open(`/api/quotes/${quoteId}/pdf`, "_blank");
              }}
              className="rounded-lg border bg-white px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              View PDF
            </button>

            <QuoteActionsMenu />
          </>
        }
      />

      <DocumentDetailsCard
        title="Quote Details"
        selectedClient={selectedClient}
        statusContent={
          <select
            className="inline-block w-auto appearance-none border-0 bg-blue-100 px-3 py-1 text-lg font-semibold text-blue-700 outline-none"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="Draft">Draft</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Converted to Invoice">Converted to Invoice</option>
          </select>
        }
        team={team}
        primaryDateLabel="Quote Date"
        primaryDate={quoteDate}
        onPrimaryDateChange={setQuoteDate}
        secondaryDateLabel="Due Date"
        secondaryDate={expiryDate}
        onSecondaryDateChange={setExpiryDate}
        headerActions={
          <button
            type="button"
            onClick={() => setShowCustomerModal(true)}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white shadow hover:bg-blue-700"
          >
            {selectedClient ? "Change Customer" : "+ Add Customer"}
          </button>
        }
        onOpenAssignModal={(roleKey) => {
          setActiveRole(roleKey);
          setShowAssignModal(true);
        }}
      />

      <DocumentProductsSection
        showCreateJobButton={false}
        showAddCard={showAddCard}
        setShowAddCard={setShowAddCard}
        productCatalog={productCatalog}
        setProductCatalog={setProductCatalog}
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        productResults={productResults}
        setProductResults={setProductResults}
        isSearchingProducts={isSearchingProducts}
        handleSelectProduct={handleSelectProduct}
        manualDesc={manualDesc}
        setManualDesc={setManualDesc}
        manualQtyInput={manualQtyInput}
        setManualQtyInput={setManualQtyInput}
        setManualQty={setManualQty}
        manualUnitInput={manualUnitInput}
        setManualUnitInput={setManualUnitInput}
        setManualUnit={setManualUnit}
        manualTotal={manualTotal}
        addManualItem={addManualItem}
        items={validItems}
        removeItem={removeItem}
        handleToggleItemExpanded={handleToggleItemExpanded}
        getItemChangeHandler={getItemChangeHandler}
      />

      <DocumentTotalsSection
        showTaxControl
        documentId={quoteId}
        customerNotes={customerNotes}
        setCustomerNotes={setCustomerNotes}
        payments={[]}
        hasPayments={false}
        subtotal={subtotal}
        discountLines={[]}
        appliedDiscount={null}
        removeDiscount={() => {}}
        taxEnabled={taxEnabled}
        handleTaxChange={(event) => setTaxEnabled(event.target.checked)}
        tax={tax}
        total={total}
        totalProcessingFee={0}
        totalCharged={total}
        balance={total}
      />

      {/* CUSTOMER MODAL */}
      {showCustomerModal && (
        <CustomerSearchModal
          onSelect={async (customer) => {
            setShowCustomerModal(false);

            // Si el quote todavía no existe,
            // solamente asignamos el cliente al estado.
            // El autosave lo guardará cuando el quote sea creado.

            if (!quoteId) {
              setSelectedClient(customer);
              markUnsaved();

              if (status === "Draft") {
                setStatus("Pending");
              }

              return;
            }

            try {
              const nextStatus = status === "Draft" ? "Pending" : status;

              const res = await fetch(`/api/quotes/${quoteId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  clientId: customer.id,
                  status: nextStatus,
                }),
              });

              const data = await res.json().catch(() => null);

              if (!res.ok) {
                throw new Error(
                  data?.error || data?.details || "Could not update customer.",
                );
              }

              setSelectedClient(data?.client || customer);
              setStatus(data?.status || nextStatus);
              markSaved();
            } catch (error) {
              console.error("❌ Customer update error:", error);

              alert(
                error instanceof Error
                  ? error.message
                  : "Could not update customer.",
              );
            }
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
          onSelect={(user) =>
            setTeam((prev) => ({ ...prev, [activeRole]: user }))
          }
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
              markSaved();
              requestNavigation("/production");
            } catch (err) {
              console.error("❌ Create Job error:", err);
              alert("Error creating Job");
            }
          }}
          onClose={() => setShowCreateJobModal(false)}
        />
      )}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onClose={closeUnsavedDialog}
        onSaveDraft={handleSaveDraftAndLeave}
        onDiscard={handleDiscardAndLeave}
        isSaving={isSavingDraft}
        documentType="quote"
      />
    </DocumentEditorLayout>
  );
}
