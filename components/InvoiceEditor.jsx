"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import AssignTeamMemberModal from "@/components/AssignTeamMemberModal";

import { useRouter } from "next/navigation";

import { useInvoiceCalculations } from "@/hooks/useInvoiceCalculations";
import { useInvoiceLoader } from "@/hooks/useInvoiceLoader";
import { mapInvoiceItems } from "@/lib/invoices/mapInvoiceItems";
import DocumentHeader from "@/components/document/DocumentHeader";
import { searchDocumentProducts } from "@/lib/document-items/searchDocumentProducts";
import { createDocumentItem } from "@/lib/document-items/createDocumentItem";
import DocumentProductsSection from "@/components/document/DocumentProductsSection";
import { createManualDocumentItem } from "@/lib/document-items/createManualDocumentItem";
import { updateDocumentItem } from "@/lib/document-items/updateDocumentItem";
import DocumentEditorLayout from "@/components/document/DocumentEditorLayout";
import {
  removeDocumentItem,
  toggleDocumentItemExpanded,
} from "@/lib/document-items/documentItemActions";
import DocumentTotalsSection from "@/components/document/DocumentTotalsSection";
import DocumentDetailsCard from "@/components/document/DocumentDetailsCard";
import InvoiceActionsMenu from "@/components/invoice/InvoiceActionsMenu";
import { useInvoicePersistence } from "@/hooks/useInvoicePersistence";
import InvoiceModals from "@/components/invoice/InvoiceModals";
import UnsavedChangesDialog from "@/components/dialogs/UnsavedChangesDialog";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
export default function InvoiceEditor({ mode = "edit", invoiceId = null }) {
  const [showCancelJobDialog, setShowCancelJobDialog] = useState(false);

  const [invoice, setInvoice] = useState(null);

  // 🔑 IDs
  const [invoiceIdState, setInvoiceIdState] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState(null); // ✅ ESTA LÍNEA FALTABA

  const [taxEnabled, setTaxEnabled] = useState(true);

  const savingRef = useRef(false);
  const itemsRef = useRef([]);
  const router = useRouter();
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);

  // ✅ SOLO UN DESCUENTO ACTIVO
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  const [jobInfo, setJobInfo] = useState(null);
  const [checkingJob, setCheckingJob] = useState(true);
  const invoiceReadyRef = useRef(false);
  const invoiceHydratedRef = useRef(false);
  const isVoid = invoice?.status === "VOID";
  const canVoid = invoice?.status !== "VOID";

  // ----------------------------------------
  // APPLIED DISCOUNTS (INVOICE LEVEL)
  // ----------------------------------------
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);

  // ✅ AHORA SÍ: SOLO UN DESCUENTO ACTIVO
  const appliedDiscount = appliedDiscounts[0] || null;

  // ----------------------------------------
  // CUSTOMER (antes client)
  // ----------------------------------------
  const [selectedClient, setSelectedClient] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);

  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  // ----------------------------------------
  // SETTINGS (GLOBAL DEFAULTS)
  // ----------------------------------------
  const [settings, setSettings] = useState(null);

  // ----------------------------------------
  // PRODUCT SEARCH
  // ----------------------------------------
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [productCatalog, setProductCatalog] = useState("products");
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  // ----------------------------------------
  // ITEMS
  // ----------------------------------------
  const [items, setItems] = useState([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const [showAddCard, setShowAddCard] = useState(false);

  // ----------------------------------------
  // PAYMENTS
  // ----------------------------------------
  const [payments, setPayments] = useState([]);
  const hasPayments = payments.length > 0;

  // ----------------------------------------
  // QUOTE FIELDS
  // ----------------------------------------
  const [issuedAt, setIssuedAt] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [expiryDate, setExpiryDate] = useState("");

  const [taxRate, setTaxRate] = useState(6.625);

  const [customerNotes, setCustomerNotes] = useState("");

  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  // ----------------------------------------

  // ----------------------------------------
  const publicSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const publicInvoiceLink = invoice?.publicToken
    ? `${publicSiteUrl}/i/${invoice.publicToken}`
    : null;

  // ----------------------------------------
  // MANUAL ITEM FIELDS
  // ----------------------------------------
  // Qty
  const [manualDesc, setManualDesc] = useState("");

  const [manualQtyInput, setManualQtyInput] = useState("1");
  const [manualQty, setManualQty] = useState(1);

  // Unit Price
  const [manualUnitInput, setManualUnitInput] = useState("0");

  const [manualUnit, setManualUnit] = useState(0);

  // Total (calculado)
  const manualTotal = manualQty * manualUnit;

  // -----------------------------
  // TEAM ASSIGNMENTS
  // -----------------------------
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeRole, setActiveRole] = useState(null);
  // 📍 InvoiceEditor.jsx (arriba de los handlers)

  const [team, setTeam] = useState({
    salesRep: null,
    productionManager: null,
    projectManager: null,
  });

  const {
    loading: loadingInvoice,
    error: invoiceLoadError,
    invoiceData: loadedInvoice,
    settingsData: loadedSettings,
  } = useInvoiceLoader({
    mode,
    invoiceId,
  });
  const {
    subtotal,
    discountLines,
    tax,
    total,
    totalPaid,
    balance,
    totalProcessingFee,
    totalCharged,
    status,
  } = useInvoiceCalculations({
    items,
    appliedDiscount,
    taxEnabled,
    taxRate,
    payments,
    mode,
    dueDate: expiryDate,
    invoiceStatus: invoice?.status,
  });
  useEffect(() => {
    async function checkJob() {
      try {
        const res = await fetch(`/api/invoices/${invoiceIdState}/job-exists`);
        const data = await res.json();
        setJobInfo(data);
      } catch (e) {
        console.error(e);
      } finally {
        setCheckingJob(false);
      }
    }

    if (invoiceIdState) checkJob();
  }, [invoiceIdState]);

  const { saveItems, scheduleAutosave, triggerPdfGeneration, persistTotals } =
    useInvoicePersistence({
      invoiceId: invoiceIdState,
      taxEnabled,
      taxRate,
    });

  const saveInvoiceAsDraft = useCallback(async () => {
    if (!invoiceIdState) {
      throw new Error("Invoice must exist before leaving.");
    }

    if (items.length > 0) {
      await saveItems(items);
    }

    await fetch(`/api/invoices/${invoiceIdState}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        issuedAt,
        dueDate: expiryDate || null,
        notes: customerNotes,
        taxEnabled,
        taxRate,
      }),
    });

    await persistTotals({
      subtotal,
      tax,
      total,
      balance,
    });
  }, [
    invoiceIdState,
    items,
    issuedAt,
    expiryDate,
    customerNotes,
    taxEnabled,
    taxRate,
    subtotal,
    tax,
    total,
    balance,
    saveItems,
    persistTotals,
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
    onSaveDraft: saveInvoiceAsDraft,
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!invoiceHydratedRef.current) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    markUnsaved();
  }, [issuedAt, expiryDate, customerNotes, taxEnabled, markUnsaved]);
  useEffect(() => {
    if (!loadedSettings) return;

    setSettings(loadedSettings);

    if (mode !== "edit") {
      setTaxRate(Number(loadedSettings.defaultTaxRate ?? 0));
    }
  }, [loadedSettings, mode]);

  useEffect(() => {
    if (!loadedInvoice || !loadedSettings) return;
    if (invoiceHydratedRef.current) return;

    invoiceHydratedRef.current = true;

    setInvoice(loadedInvoice);

    setInvoiceIdState(loadedInvoice.id);
    setInvoiceNumber(loadedInvoice.invoiceNumber);

    setSelectedClient(loadedInvoice.client || null);

    setTaxEnabled(
      typeof loadedInvoice.taxEnabled === "boolean"
        ? loadedInvoice.taxEnabled
        : true,
    );

    setTaxRate(
      typeof loadedInvoice.taxRate === "number"
        ? loadedInvoice.taxRate
        : Number(loadedSettings.defaultTaxRate ?? 0),
    );

    setAppliedDiscounts(
      loadedInvoice.appliedDiscounts?.length
        ? [loadedInvoice.appliedDiscounts[0]]
        : [],
    );

    setIssuedAt(
      loadedInvoice.issuedAt
        ? new Date(loadedInvoice.issuedAt).toISOString().split("T")[0]
        : "",
    );

    setExpiryDate(
      loadedInvoice.dueDate
        ? new Date(loadedInvoice.dueDate).toISOString().split("T")[0]
        : "",
    );

    setCustomerNotes(loadedInvoice.notes || "");

    const mappedItems = mapInvoiceItems(loadedInvoice.invoiceItems || []);

    itemsRef.current = mappedItems;
    setItems(mappedItems);

    setPayments(
      Array.isArray(loadedInvoice.payments) ? loadedInvoice.payments : [],
    );

    invoiceReadyRef.current = true;
    markSaved();
  }, [loadedInvoice, loadedSettings]);
  // 🔄 AUTO-REFRESH INVOICE (Square payments)
  useEffect(() => {
    if (!invoiceIdState) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceIdState}`);
        const freshInvoice = await res.json();

        if (Array.isArray(freshInvoice.payments)) {
          setPayments(freshInvoice.payments);
          setInvoice(freshInvoice);
        }
      } catch (err) {
        console.error("❌ Error refreshing invoice", err);
      }
    }, 5000); // ⏱️ cada 5 segundos

    return () => clearInterval(interval);
  }, [invoiceIdState]);

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
          console.error("Error searching products:", error);
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
  // 🧠 STATUS AUTOMÁTICO (DEBE IR AQUÍ)
  // ----------------------------------------

  // ----------------------------------------
  // 💾 PERSIST TOTALS (DEBE IR AQUÍ)
  // ----------------------------------------
  useEffect(() => {
    if (!invoiceIdState) return;
    if (!invoiceReadyRef.current) return;

    persistTotals({
      subtotal,
      tax,
      total,
      balance,
    })
      .then(() => {
        markSaved();
      })
      .catch(console.error);
  }, [invoiceIdState, subtotal, tax, total, balance, totalPaid, markSaved]);

  // ----------------------------------------
  // INVOICE STATUS (AUTOMÁTICO)
  // ----------------------------------------

  useEffect(() => {
    if (!settings) return;
    console.log("✅ FINAL SETTINGS USED:", settings);
  }, [settings]);

  // ----------------------------------------

  const handleSelectProduct = async (productResult) => {
    try {
      const newItem = await createDocumentItem(productResult);

      setItems((previousItems) => [
        ...previousItems.map((item) => ({
          ...item,
          _expanded: false,
        })),
        newItem,
      ]);
      markUnsaved();
      setProductSearch("");
      setProductResults([]);
      setShowAddCard(false);
    } catch (error) {
      console.error("Error selecting product:", error);

      if (productResult?.productType === "apparel") {
        alert("No se pudo cargar el producto SanMar.");
        return;
      }

      alert("No se pudo cargar el producto.");
    }
  };
  // ----------------------------------------
  // ADD MANUAL ITEM
  const addManualItem = async () => {
    try {
      const newItem = createManualDocumentItem({
        description: manualDesc,
        quantity: manualQty,
        unitPrice: manualUnit,
      });

      const nextItems = [...items, newItem];

      setItems(nextItems);
      markUnsaved();
      setShowAddCard(false);

      // Guardar solo cuando el invoice ya existe
      if (invoiceIdState) {
        await saveItems(nextItems);
        markSaved();
      }

      setManualDesc("");
      setManualQty(1);
      setManualQtyInput("1");
      setManualUnit(0);
      setManualUnitInput("0");
    } catch (error) {
      alert(error?.message || "Could not add the manual item.");
    }
  };
  // ----------------------------------------
  // UPDATE DATES (NO AUTOSAVE)
  // ----------------------------------------
  const updateDates = async () => {
    if (!invoiceIdState) return;

    try {
      await fetch(`/api/invoices/${invoiceIdState}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issuedAt,
          dueDate: expiryDate || null,
        }),
      });
      markSaved();
    } catch (err) {
      console.error("❌ Error saving dates", err);
    }
  };

  // UPDATE ITEM
  const handleItemChange = useCallback(
    (index, fields) => {
      const previousItems = itemsRef.current;

      if (
        !Array.isArray(previousItems) ||
        !Number.isInteger(index) ||
        index < 0 ||
        index >= previousItems.length
      ) {
        console.warn("Invalid invoice item index:", index);
        return;
      }

      const currentItem = previousItems[index];

      // --------------------------------------------------
      // CONSERVAR SIEMPRE EL ID DEL ITEM QUE SE ESTÁ EDITANDO
      // --------------------------------------------------
      const safeFields = {
        ...fields,
        id: currentItem.id,
      };

      // --------------------------------------------------
      // ACTUALIZAR SOLAMENTE ESTE ITEM
      // --------------------------------------------------
      const nextItems = updateDocumentItem(previousItems, index, safeFields);

      // Actualizar ref inmediatamente.
      // Así otro evento no trabaja con un array viejo.
      itemsRef.current = nextItems;

      setItems(nextItems);
      markUnsaved();

      const updatedItem = nextItems[index];

      const isManualItem =
        !updatedItem?.productId &&
        !updatedItem?.product &&
        !updatedItem?.options?.productType;

      // --------------------------------------------------
      // DONE / COMMIT
      // --------------------------------------------------
      if (fields.__commit === true) {
        if (savingRef.current) {
          return;
        }

        savingRef.current = true;

        saveItems(nextItems)
          .then(() => {
            markSaved();
          })
          .catch((error) => {
            console.error("Error saving invoice items:", error);
          })
          .finally(() => {
            savingRef.current = false;
          });

        return;
      }

      // --------------------------------------------------
      // AUTOSAVE
      // --------------------------------------------------
      if (!isManualItem) {
        scheduleAutosave(nextItems, markSaved);
      }
    },
    [saveItems, scheduleAutosave, markUnsaved, markSaved],
  );

  // 🔥 PASO 4 — handler estable por item (ANTI-LAG)
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
    if (!invoiceIdState) {
      return;
    }

    try {
      await saveItems(nextItems);
      markSaved();
    } catch (error) {
      console.error("Error removing item:", error);

      // Restaurar la lista anterior si falla el guardado
      setItems(previousItems);

      alert("No se pudo eliminar el producto.");
    }
  };
  const handleToggleItemExpanded = useCallback((index) => {
    setItems((previousItems) =>
      toggleDocumentItemExpanded(previousItems, index),
    );
  }, []);

  const handleRemoveDiscount = async () => {
    if (!invoiceIdState) return;

    setAppliedDiscounts([]);

    await fetch(`/api/invoices/${invoiceIdState}/discount`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        discount: null,
      }),
    });

    triggerPdfGeneration();
  };

  const handleTaxChange = async (event) => {
    const next = event.target.checked;

    setTaxEnabled(next);

    await fetch(`/api/invoices/${invoiceIdState}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taxEnabled: next,
        taxRate: next ? (settings?.defaultTaxRate ?? 0) : taxRate,
      }),
    });
    markSaved();
    triggerPdfGeneration();
  };
  // ======================================================
  // ACTIONS MENU (igual a tu código)
  // ======================================================
  async function executeVoid(cancelJob) {
    try {
      setIsVoiding(true);

      const res = await fetch(`/api/invoices/${invoiceIdState}/void`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cancelJob,
        }),
      });

      if (!res.ok) throw new Error();

      markSaved();
      requestNavigation("/invoices");
      router.refresh();
    } catch (err) {
      alert("Error voiding invoice");
    } finally {
      setIsVoiding(false);
      setShowVoidModal(false);
      setShowCancelJobDialog(false);
    }
  }

  // ======================================================
  // RENDER UI (TU UI COMPLETA)
  // ======================================================

  return (
    <DocumentEditorLayout>
      <DocumentHeader
        title={`Invoice #${invoiceNumber ?? ""}`}
        actions={
          <>
            <button
              type="button"
              disabled={!invoiceIdState}
              onClick={() => {
                window.open(`/api/invoices/${invoiceIdState}/pdf`, "_blank");
              }}
              className="rounded-lg border bg-white px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              View PDF
            </button>

            <InvoiceActionsMenu
              isVoid={isVoid}
              canVoid={canVoid}
              publicInvoiceLink={publicInvoiceLink}
              onRecordPayment={() => setShowRecordPaymentModal(true)}
              onVoid={() => setShowVoidModal(true)}
            />
          </>
        }
      />

      {/* CARD 1 — QUOTE DETAILS */}
      <DocumentDetailsCard
        title="Invoice Details"
        selectedClient={selectedClient}
        statusContent={
          <span
            className={`inline-block px-3 py-1 text-lg font-semibold ${
              status === "Paid"
                ? "bg-green-100 text-green-700"
                : status === "Partially Paid"
                  ? "bg-yellow-100 text-yellow-700"
                  : status === "Overdue"
                    ? "bg-red-100 text-red-700"
                    : status === "Void"
                      ? "bg-gray-200 text-gray-600"
                      : "bg-blue-100 text-blue-700"
            }`}
          >
            {status}
          </span>
        }
        team={team}
        primaryDateLabel="Invoice Date"
        primaryDate={issuedAt}
        onPrimaryDateChange={setIssuedAt}
        secondaryDateLabel="Due Date"
        secondaryDate={expiryDate}
        onSecondaryDateChange={setExpiryDate}
        onDatesBlur={updateDates}
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
        invoiceId={invoiceIdState}
        checkingJob={checkingJob}
        jobInfo={jobInfo}
        showAddCard={showAddCard}
        setShowAddCard={setShowAddCard}
        setShowCreateJobModal={setShowCreateJobModal}
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
        items={items}
        removeItem={removeItem}
        handleToggleItemExpanded={handleToggleItemExpanded}
        getItemChangeHandler={getItemChangeHandler}
      />

      <DocumentTotalsSection
        documentId={invoiceIdState}
        customerNotes={customerNotes}
        setCustomerNotes={setCustomerNotes}
        payments={payments}
        hasPayments={hasPayments}
        subtotal={subtotal}
        discountLines={discountLines}
        appliedDiscount={appliedDiscount}
        removeDiscount={handleRemoveDiscount}
        taxEnabled={taxEnabled}
        handleTaxChange={handleTaxChange}
        tax={tax}
        total={total}
        totalProcessingFee={totalProcessingFee}
        totalCharged={totalCharged}
        balance={balance}
      />
      <InvoiceModals
        mode={mode}
        invoice={invoice}
        invoiceId={invoiceIdState}
        invoiceNumber={invoiceNumber}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        settings={settings}
        issuedAt={issuedAt}
        expiryDate={expiryDate}
        customerNotes={customerNotes}
        items={items}
        total={total}
        balance={balance}
        subtotal={subtotal}
        payments={payments}
        setPayments={setPayments}
        appliedDiscounts={appliedDiscounts}
        setAppliedDiscounts={setAppliedDiscounts}
        jobInfo={jobInfo}
        setJobInfo={setJobInfo}
        invoiceReadyRef={invoiceReadyRef}
        showCustomerModal={showCustomerModal}
        setShowCustomerModal={setShowCustomerModal}
        showCreateCustomerModal={showCreateCustomerModal}
        setShowCreateCustomerModal={setShowCreateCustomerModal}
        showRecordPaymentModal={showRecordPaymentModal}
        setShowRecordPaymentModal={setShowRecordPaymentModal}
        showVoidModal={showVoidModal}
        setShowVoidModal={setShowVoidModal}
        showCancelJobDialog={showCancelJobDialog}
        setShowCancelJobDialog={setShowCancelJobDialog}
        showDiscountModal={showDiscountModal}
        setShowDiscountModal={setShowDiscountModal}
        showCreateJobModal={showCreateJobModal}
        setShowCreateJobModal={setShowCreateJobModal}
        setInvoice={setInvoice}
        setInvoiceId={setInvoiceIdState}
        setInvoiceNumber={setInvoiceNumber}
        executeVoid={executeVoid}
        router={router}
        markUnsaved={markUnsaved}
        markSaved={markSaved}
        requestNavigation={requestNavigation}
      />

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onClose={closeUnsavedDialog}
        onSaveDraft={handleSaveDraftAndLeave}
        onDiscard={handleDiscardAndLeave}
        isSaving={isSavingDraft}
        documentType="invoice"
      />
    </DocumentEditorLayout>
  );
}
