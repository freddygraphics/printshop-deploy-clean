"use client";

import { Trash2, Search } from "lucide-react";
import InlineProductEditor from "@/components/InlineProductEditor";
import CustomerSearchModal from "@/components/CustomerSearchModal";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

import AssignTeamMemberModal from "@/components/AssignTeamMemberModal";
import CreateJobModal from "@/components/CreateJobModal";
import RecordPaymentModal from "@/components/RecordPaymentModal";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import { getInvoiceStatus } from "@/lib/invoiceStatus";
import DiscountModal from "@/components/modals/DiscountModal";
import { QRCodeCanvas } from "qrcode.react";

export default function InvoiceEditor({ mode = "edit", invoiceId = null }) {
  const router = useRouter();
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);
  const lastSavedFingerprint = useRef(null);
  const autosaveTimer = useRef(null);
  const isInitialLoad = useRef(true);
  // ✅ SOLO UN DESCUENTO ACTIVO
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [jobInfo, setJobInfo] = useState(null);
  const [checkingJob, setCheckingJob] = useState(true);
  const invoiceReadyRef = useRef(false);
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
  const [isSaving, setIsSaving] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // ----------------------------------------
  // ITEMS
  // ----------------------------------------
  const [items, setItems] = useState([]);
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
    new Date().toISOString().split("T")[0]
  );
  const [expiryDate, setExpiryDate] = useState("");

  const [taxRate, setTaxRate] = useState(6.625);
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");

  const [customerNotes, setCustomerNotes] = useState("");

  const [invoiceIdState, setInvoiceIdState] = useState(null);

  const [invoiceNumber, setInvoiceNumber] = useState(null);

  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  // ----------------------------------------

  // ----------------------------------------

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

  function viewJob() {
    if (!jobInfo?.job?.id) return;

    // 👉 opción simple (recomendada ahora)
    router.push("/production");

    // 🔜 en el futuro:
    // router.push(`/jobs/${jobInfo.job.id}`);
  }

  useEffect(() => {
    if (mode !== "edit" || !invoiceId) return;

    const loadAll = async () => {
      try {
        const [invoiceRes, settingsRes] = await Promise.all([
          fetch(`/api/invoices/${invoiceId}`),
          fetch(`/api/settings/billing`),
        ]);

        const invoiceData = await invoiceRes.json();
        setInvoice(invoiceData); // 👈 AÑADE ESTA LÍNEA

        console.log("🧾 INVOICE FROM API:", invoiceData);
        console.log("🎯 appliedDiscounts:", invoiceData.appliedDiscounts);

        const settingsData = await settingsRes.json();
        // ---------------------------
        // DISCOUNTS (IMPORTANTE)
        // ---------------------------
        setAppliedDiscounts(
          invoiceData.appliedDiscounts?.length
            ? [invoiceData.appliedDiscounts[0]]
            : []
        );

        // ---------------------------
        // SETTINGS
        // ---------------------------
        setSettings(settingsData);
        console.log("✅ SETTINGS FROM /api/settings/billing:", settingsData);

        if (settingsData?.taxEnabled) {
          setTaxRate(settingsData.defaultTaxRate ?? 0);
        }

        // ---------------------------
        // INVOICE
        // ---------------------------
        setInvoiceIdState(invoiceData.id);
        invoiceReadyRef.current = true;

        setInvoiceNumber(invoiceData.invoiceNumber);
        setSelectedClient(invoiceData.client);
        setPaymentStatus(invoiceData.paymentStatus || "Unpaid");

        setIssuedAt(
          invoiceData.issuedAt
            ? new Date(invoiceData.issuedAt).toISOString().split("T")[0]
            : ""
        );

        setExpiryDate(
          invoiceData.dueDate
            ? new Date(invoiceData.dueDate).toISOString().split("T")[0]
            : ""
        );

        setCustomerNotes(invoiceData.notes || "");

        // ---------------------------
        // ITEMS (USANDO PRODUCT YA INCLUIDO)
        // ---------------------------
        const enrichedItems = (invoiceData.invoiceItems || []).map((i) => {
          const productData = i.product;
          const defaults = productData?.defaultOptions || {};

          return {
            id: crypto.randomUUID(),
            productId: i.productId,
            product: productData,

            name: i.name,
            qty: i.qty || 1,
            unitPrice: i.unitPrice || 0,
            total: i.total || 0,

            customFields:
              productData?.customFields ||
              productData?.template?.fields ||
              null,

            options:
              i.options ||
              productData?.defaultOptions ||
              productData?.template?.options ||
              [],

            finish: defaults.finish || "",
            design: defaults.design || "",
            sides: defaults.sides || "",
            corners: defaults.corners || "",

            _expanded: false,
          };
        });

        setItems(enrichedItems);

        // ---------------------------
        // PAYMENTS (VIENEN EN EL MISMO REQUEST)
        // ---------------------------
        setPayments(invoiceData.payments || []);
      } catch (err) {
        console.error("❌ Error loading invoice (optimized)", err);
      }
    };

    loadAll();
  }, [mode, invoiceId]);
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings/billing");
        const data = await res.json();

        setSettings(data);

        if (data?.taxEnabled) {
          setTaxRate(data.defaultTaxRate ?? 0);
        }
      } catch (err) {
        console.error("❌ Error loading billing settings", err);
      }
    };

    loadSettings();
  }, []);

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
  const subtotal = useMemo(() => {
    return items.reduce((t, i) => t + (i.total || 0), 0);
  }, [items]);

  {
    /* DISCOUNTS */
  }
  // ----------------------------------------
  // DISCOUNT LINES (PER DISCOUNT)
  // ----------------------------------------
  const discountLines = useMemo(() => {
    if (!appliedDiscount) return [];

    let amount = 0;

    if (appliedDiscount.type === "percent") {
      amount = subtotal * (appliedDiscount.value / 100);
    }

    if (appliedDiscount.type === "fixed") {
      amount = appliedDiscount.value;
    }

    return [
      {
        name: appliedDiscount.name,
        type: appliedDiscount.type,
        value: appliedDiscount.value,
        amount: Math.min(amount, subtotal),
      },
    ];
  }, [appliedDiscount, subtotal]);

  // 🔹 DISCOUNT
  const discountAmount = useMemo(() => {
    return discountLines.reduce((sum, d) => sum + d.amount, 0);
  }, [discountLines]);

  const discountedSubtotal = subtotal - discountAmount;

  const tax =
    settings?.taxEnabled !== false ? discountedSubtotal * (taxRate / 100) : 0;

  const total = discountedSubtotal + tax;

  // ----------------------------------------
  // PAYMENTS CALCULOS
  // ----------------------------------------
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = total - totalPaid;
  // ----------------------------------------
  // INVOICE STATUS (AUTOMÁTICO)
  // ----------------------------------------
  const invoiceForStatus = {
    balance,
    dueDate: expiryDate,
    payments,
    isVoided: paymentStatus === "Voided",
  };

  const status = getInvoiceStatus(invoiceForStatus);

  // ----------------------------------------
  // SAVE QUOTE (AUTOSAVE)
  // ----------------------------------------
  const itemsForSave = useMemo(() => {
    return items.map((i) => ({
      productId: i.productId,
      name: i.name,
      qty: i.qty,
      unitPrice: i.unitPrice,
      total: i.total,

      finish: i.finish,
      design: i.design,
      sides: i.sides,
      corners: i.corners,
    }));
  }, [items]);

  const invoiceFingerprint = useMemo(() => {
    return JSON.stringify({
      items: itemsForSave,
      discount: appliedDiscount
        ? {
            id: appliedDiscount.id,
            type: appliedDiscount.type,
            value: appliedDiscount.value,
          }
        : null,
      issuedAt,
      expiryDate,
      taxRate,
    });
  }, [itemsForSave, appliedDiscount, issuedAt, expiryDate, taxRate]);

  const autoSaveInvoice = async () => {
    if (!invoiceIdState || !selectedClient || isSaving) return;

    setIsSaving(true);

    try {
      await fetch(`/api/invoices/${invoiceIdState}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          items: itemsForSave,
          subtotal,

          appliedDiscounts: appliedDiscount ? [appliedDiscount] : [],

          discountAmount,
          tax,
          total,
          paymentStatus,
          issuedAt,
          dueDate: expiryDate,
          notes: customerNotes,
        }),
      });
    } catch (err) {
      console.error("❌ Auto-save invoice error:", err);
    } finally {
      setIsSaving(false);
    }
  };
  useEffect(() => {
    if (!settings) return;
    console.log("✅ FINAL SETTINGS USED:", settings);
  }, [settings]);

  useEffect(() => {
    if (
      !invoiceIdState ||
      !selectedClient ||
      isSaving ||
      isRecordingPayment ||
      isVoiding ||
      isVoid
    )
      return;

    // 🛑 PASO CLAVE: primera carga
    if (isInitialLoad.current) {
      isInitialLoad.current = false;

      // 👉 Marcamos como "ya guardado"
      lastSavedFingerprint.current = invoiceFingerprint;
      return;
    }

    // ❌ No guardar si no cambió nada
    if (invoiceFingerprint === lastSavedFingerprint.current) return;

    // 🧹 limpiar debounce previo
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

    autosaveTimer.current = setTimeout(async () => {
      lastSavedFingerprint.current = invoiceFingerprint;
      await autoSaveInvoice();
    }, 1200);

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [invoiceFingerprint]);
  // ----------------------------------------

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

    setItems((prev) =>
      prev
        .map((i) => ({ ...i, _expanded: false }))
        .concat({
          ...newLine,
          _expanded: true, // 👈 AQUÍ se abre el configurable
        })
    );

    setProductSearch("");
    setProductResults([]);
    setShowAddCard(false);
  };

  // ----------------------------------------
  // ADD MANUAL ITEM
  // ----------------------------------------
  const addManualItem = () => {
    if (!manualDesc.trim()) {
      alert("Enter description");
      return;
    }

    const newLine = {
      id: crypto.randomUUID(),
      productId: settings.defaultManualItemProductId,
      product: null,
      name: manualDesc,
      qty: manualQty,
      unitPrice: manualUnit,
      total: manualTotal,
      customFields: null,
      options: [],
      _expanded: false, // 👈 manual SIEMPRE entra cerrado
    };

    setItems((prev) => [...prev, newLine]); // 👈 SIN map()

    setShowAddCard(false); // 👈 CIERRA el formulario superior

    // reset
    setManualDesc("");
    setManualQtyInput("1");
    setManualQty(1);
    setManualUnitInput("0");
    setManualUnit(0);
  };

  // ----------------------------------------
  // UPDATE ITEM
  // ----------------------------------------
  // ----------------------------------------
  // UPDATE ITEM
  // ----------------------------------------
  const handleItemChange = useCallback((index, fields) => {
    setItems((prevItems) => {
      const updated = [...prevItems];
      const merged = { ...updated[index], ...fields };

      merged.total =
        fields.total !== undefined
          ? fields.total
          : (merged.qty || 1) * (merged.unitPrice || 0);

      updated[index] = merged;
      return updated;
    });
  }, []);

  // 🔥 PASO 4 — handler estable por item (ANTI-LAG)
  const getItemChangeHandler = useCallback(
    (index) => {
      return (fields) => {
        handleItemChange(index, fields);
      };
    },
    [handleItemChange]
  );

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
            {!isVoid && (
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  setOpen(false);
                  setShowRecordPaymentModal(true);
                }}
              >
                Record Payment
              </button>
            )}
            <div className="border-t my-1" />
            {canVoid && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => {
                  setOpen(false); // cierra menú
                  setShowVoidModal(true); // abre modal
                }}
              >
                Void
              </button>
            )}

            <div className="border-t my-1" />
          </div>
        )}
      </div>
    );
  }

  // ======================================================
  // RENDER UI (TU UI COMPLETA)
  // ======================================================
  return (
    <div className="w-full max-w-7xl mx-auto px-4 space-y-8">
      <div className="mx-auto  mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-700">
          IN #{invoiceNumber ?? ""}
        </h1>

        <QuoteActionsMenu />
      </div>
      {/* CARD 1 — QUOTE DETAILS */}
      <div className="mx-auto  bg-white border rounded-xl  mb-10 shadow-md">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Invoice Details</h2>
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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* CUSTOMER */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-black-700">Customer</h4>

              {selectedClient ? (
                <>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-base font-medium text-black-500">
                        {selectedClient.name}
                      </p>
                      <p className="text-sm text-#9DA6AF-500">Customer</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-base font-medium text-black-500">
                        {selectedClient.company || "Primary Contact"}
                      </p>
                      <p className="text-sm text-#9DA6AF-400">
                        Primary Contact
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-black-400">No customer selected</p>
              )}
            </div>

            {/* STATUS */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-black-700">Status</h4>

              <span
                className={`inline-block px-3 py-1  text-xs font-semibold ${
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
            </div>

            {/* TEAM ASSIGNMENTS */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-black-700">
                Team Assignments
              </h4>

              {[
                { label: "Sales Rep", key: "salesRep" },
                { label: "Production Manager", key: "productionManager" },
                { label: "Project Manager", key: "projectManager" },
              ].map((role) => (
                <div
                  key={role.key}
                  className="flex items-center justify-between"
                >
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
              <h4 className="text-lg font-semibold text-gray-900">Dates</h4>

              <div>
                <p className="text-xs text-gray-500">Invoice Date</p>
                <input
                  type="date"
                  className="mt-1 border rounded-lg px-4 py-2.5 w-full"
                  value={issuedAt}
                  onChange={(e) => setIssuedAt(e.target.value)}
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
            {/* QR CODE */}
            {invoice?.qrToken && (
              <div className="flex flex-col items-center  p-3 bg-white">
                <QRCodeCanvas
                  value={`${process.env.NEXT_PUBLIC_APP_URL}/api/scan?token=${invoice.qrToken}`}
                  size={120}
                />
                <a
                  href={`/api/invoices/${invoiceIdState}/qr-pdf`}
                  target="_blank"
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Download QR PDF
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* PRODUCTS SECTION */}
      <div>
        {/* PRODUCTS HEADER — fuera de la card */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Products</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={!invoiceIdState || checkingJob}
              onClick={() => setShowAddCard(!showAddCard)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow text-sm font-medium"
            >
              + Add New Item
            </button>

            <button
              disabled={!invoiceIdState || checkingJob || jobInfo?.exists}
              onClick={() => {
                if (!jobInfo?.exists) {
                  setShowCreateJobModal(true);
                }
              }}
              className={`px-5 py-2 rounded-lg text-sm font-medium ${
                !invoiceIdState || checkingJob
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : jobInfo?.exists
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-white border border-blue-600 text-blue-600 hover:bg-blue-50"
              }`}
            >
              {jobInfo?.exists ? "Job already created" : "+ Create Job"}
            </button>
          </div>
        </div>
        {/* PRODUCTS CARD — subida */}
        <div className="mx-auto px-5 py-2 max-w-[1240px] bg-white shadow-md rounded-xl mt-2">
          <div className="py-6 space-y-10">
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

                <div className="space-y-4">
                  {/* ADD ITEM ROW */}
                  <div className="grid grid-cols-12 gap-4 items-end">
                    {/* SEARCH */}
                    <div className="col-span-3">
                      <label className="text-xs font-semibold text-gray-500">
                        Search
                      </label>
                      <div className="relative mt-1">
                        <Search
                          className="absolute left-3 top-3 text-gray-400"
                          size={16}
                        />
                        <input
                          className="border rounded-lg pl-9 px-3 py-2.5 w-full"
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

                    {/* DESCRIPTION */}
                    <div className="col-span-3">
                      <label className="text-xs font-semibold text-gray-500">
                        Description
                      </label>
                      <input
                        className="mt-1 border rounded-lg px-3 py-2.5 w-full"
                        placeholder="Description"
                        value={manualDesc}
                        onChange={(e) => setManualDesc(e.target.value)}
                      />
                    </div>

                    {/* QTY */}
                    <div className="col-span-1">
                      <label className="text-xs font-semibold text-gray-500">
                        Qty
                      </label>
                      <input
                        inputMode="numeric"
                        className="mt-1 border rounded-lg px-3 py-2.5 w-full text-right"
                        value={manualQtyInput}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!/^\d*$/.test(v)) return;
                          setManualQtyInput(v);
                          setManualQty(Number(v || 0));
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
                        onChange={(e) => {
                          const v = e.target.value;

                          // permite vacío, números y decimales
                          if (!/^\d*\.?\d*$/.test(v)) return;

                          setManualUnitInput(v);
                          setManualUnit(Number(v || 0));
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

                    {/* ADD */}
                    <div className="col-span-1 flex justify-center">
                      <button
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
                  const isConfigurable = !isManual;
                  const displayQty = isManual ? item.qty : 1;
                  {
                    /* caja */
                  }
                  return (
                    <div
                      key={item.id}
                      className={` p-5 mb-1  shadow-sm  ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
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
                          onClick={() =>
                            handleItemChange(index, { _expanded: true })
                          }
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
                            {/* 🟨 Columna 2 — ESPACIO VACÍO */}
                            <div />
                            <div>
                              <p className="text-sm text-gray-500">Qty</p>
                              <p className="font-bold">{displayQty}</p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-500">
                                Unit Price
                              </p>
                              <p className="font-semibold">
                                ${Number(item.unitPrice).toLocaleString()}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-500">Total</p>
                              <p className="font-bold text-black-500">
                                ${Number(item.total).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : isConfigurable ? (
                        <InlineProductEditor
                          product={item.product}
                          data={item}
                          onChange={getItemChangeHandler(index)}
                        />
                      ) : (
                        // 🧾 MANUAL ITEM EDITOR
                        <div className="grid grid-cols-4  gap-4 p-4 bg-white-50 shadow-lx rounded-lg ">
                          <div>
                            <label className="text-xs text-gray-500">
                              Description
                            </label>
                            <input
                              className="border rounded px-2 py-1 w-full"
                              value={item.name}
                              onChange={(e) =>
                                handleItemChange(index, {
                                  name: e.target.value,
                                })
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
                                handleItemChange(index, {
                                  qty: Number(e.target.value),
                                })
                              }
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-500">
                              Unit
                            </label>
                            <input
                              type="number"
                              className="border rounded px-2 py-1 w-full"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(index, {
                                  unitPrice: Number(e.target.value),
                                })
                              }
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-500">
                              Total
                            </label>
                            <input
                              type="number"
                              className="border rounded px-2 py-1 w-full"
                              value={item.total}
                              onChange={(e) =>
                                handleItemChange(index, {
                                  total: Number(e.target.value),
                                })
                              }
                            />
                          </div>

                          <div className="col-span-4 text-right">
                            <button
                              className="text-blue-600 text-sm"
                              onClick={() =>
                                handleItemChange(index, { _expanded: false })
                              }
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
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT — PAYMENT HISTORY (solo si hay pagos) */}
        {hasPayments ? (
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Payment History</h3>

            {payments.map((p) => (
              <div
                key={p.id}
                className="flex justify-between py-3 border-b last:border-0 text-sm"
              >
                <div>
                  <p className="font-medium">{p.method}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(p.paidAt).toLocaleDateString()}
                  </p>
                  {p.note && <p className="italic text-xs">{p.note}</p>}
                </div>

                <span className="font-semibold text-emerald-600">
                  ${p.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          // 👇 placeholder invisible para mantener Totals a la derecha
          <div className="hidden lg:block" />
        )}

        {/* RIGHT — TOTALS */}
        <div className="flex justify-end">
          <div className="grid grid-cols-2 gap-x-6 text-base min-w-[270px]">
            {/* APPLY DISCOUNT */}
            <div className="col-span-2 text-left mb-2">
              <button
                type="button"
                onClick={() => setShowDiscountModal(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Apply Discount
              </button>
            </div>

            {/* LABELS */}
            <div className="text-xl font-medium space-y-2 text-left text-gray-700">
              <p>Subtotal</p>

              {discountLines.map((d) => (
                <p key={d.name} className="text-emerald-700">
                  Discount ({d.name}
                  {d.type === "percent" ? ` ${d.value}%` : ""})
                </p>
              ))}

              <p>Tax</p>
              <p className=" text-2xl font-bold text-gray-900">Total</p>

              {hasPayments && <p className="text-base font-bold">Payments</p>}
              {hasPayments && (
                <p className="text-base text-red-500 font-bold ">Balance</p>
              )}
            </div>

            {/* VALUES */}
            <div className="space-y-3 text-right">
              <p>${subtotal.toFixed(2)}</p>

              {discountLines.map((d) => (
                <p key={d.name} className="text-emerald-700">
                  −${d.amount.toFixed(2)}
                </p>
              ))}

              <p>${tax.toFixed(2)}</p>
              <p className="text-2xl font-bold">${total.toFixed(2)}</p>

              {hasPayments && <p>${totalPaid.toFixed(2)}</p>}
              {hasPayments && (
                <p className=" text-base font-bold text-red-500">
                  ${balance.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOMER MODAL */}
      {showCustomerModal && (
        <CustomerSearchModal
          onSelect={async (customer) => {
            setSelectedClient(customer);
            setShowCustomerModal(false);

            // 🔥 SOLO CREAR SI ES NUEVO
            if (mode === "edit" || invoiceIdState) return;

            try {
              const res = await fetch("/api/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  clientId: customer.id,

                  // ✅ FECHAS
                  issuedAt,
                  dueDate: expiryDate || null,

                  // ✅ FINANZAS
                  subtotal: 0,
                  tax: 0,
                  total: 0,
                  balance: 0,

                  // ✅ CAMPOS OBLIGATORIOS
                  paymentStatus: "Unpaid", // 🔥 CLAVE
                  notes: customerNotes || "",

                  items: [],
                }),
              });

              const data = await res.json();

              if (!res.ok || data?.error) {
                console.error("❌ Create invoice error:", data);
                alert("Error creating invoice");
                return;
              }

              // ✅ GUARDAR ESTADO DEL INVOICE
              setInvoiceIdState(data.id);
              setInvoiceNumber(data.invoiceNumber);

              // 🔐 CLAVE ABSOLUTA
              invoiceReadyRef.current = true;

              window.history.replaceState(null, "", `/invoices/${data.id}`);
            } catch (err) {
              console.error("❌ Error creating invoice:", err);
              alert("Error creating invoice");
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
          invoice={{ invoiceNumber, invoiceId: invoiceIdState }}
          items={items}
          team={team}
          onCreate={async () => {
            if (!invoiceIdState) {
              alert("Invoice must be saved before creating a Job");
              return;
            }

            try {
              const res = await fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  invoiceId: invoiceIdState,
                }),
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
      {showRecordPaymentModal && (
        <RecordPaymentModal
          invoice={{
            invoiceNumber,
            total,
            balance,

            client: selectedClient,
          }}
          defaultDepositPercent={settings?.defaultDepositPercent || 0}
          onClose={() => setShowRecordPaymentModal(false)}
          onSave={async (payment) => {
            try {
              setIsRecordingPayment(true); // 🔒

              const res = await fetch(
                `/api/invoices/${invoiceIdState}/payments`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    amount: payment.amountPaid,
                    method: payment.paymentMethod,
                    note: payment.note,
                  }),
                }
              );

              if (!res.ok) throw new Error();

              // 🔄 recargar SOLO pagos
              const pRes = await fetch(
                `/api/invoices/${invoiceIdState}/payments`
              );
              const updatedPayments = await pRes.json();
              setPayments(updatedPayments);

              setShowRecordPaymentModal(false);
            } catch (err) {
              alert("Error saving payment");
            } finally {
              setIsRecordingPayment(false); // 🔓
            }
          }}
        />
      )}
      <ConfirmModal
        open={showVoidModal}
        title="Void Invoice"
        message="Are you sure you want to void this invoice? This action cannot be undone."
        confirmText="Void Invoice"
        cancelText="Cancel"
        danger
        onCancel={() => setShowVoidModal(false)}
        onConfirm={async () => {
          try {
            setIsVoiding(true);

            const res = await fetch(`/api/invoices/${invoiceIdState}/void`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error();

            // 🔁 REDIRECCIÓN OBLIGATORIA
            router.push("/invoices");
            router.refresh();
          } catch (err) {
            alert("Error voiding invoice");
          } finally {
            setIsVoiding(false);
            setShowVoidModal(false);
          }
        }}
      />

      <DiscountModal
        open={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        discounts={settings?.discountRules || []}
        selectedDiscounts={appliedDiscounts}
        setSelectedDiscounts={setAppliedDiscounts}
        onApply={() => setShowDiscountModal(false)}
      />
    </div>
  );
}
