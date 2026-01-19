"use client";

import { Trash2, Search } from "lucide-react";
import InlineProductEditor from "@/components/InlineProductEditor";
import CustomerSearchModal from "@/components/CustomerSearchModal";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { XCircle } from "lucide-react";

import AssignTeamMemberModal from "@/components/AssignTeamMemberModal";
import CreateJobModal from "@/components/CreateJobModal";
import RecordPaymentModal from "@/components/RecordPaymentModal";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import { getInvoiceStatus } from "@/lib/invoiceStatus";
import DiscountModal from "@/components/modals/DiscountModal";

export default function InvoiceEditor({ mode = "edit", invoiceId = null }) {
  const [taxEnabled, setTaxEnabled] = useState(true);
  const normalizeOptions = (opts) => {
    if (!opts || Array.isArray(opts)) return {};
    return opts;
  };
  const buildOptionsFromItem = (item) => ({
    finish: item.finish || item.options?.finish || null,
    design: item.design || item.options?.design || null,
    sides: item.sides || item.options?.sides || null,
    corners: item.corners || item.options?.corners || null,
  });
  const savingRef = useRef(false);
  const autosaveTimerRef = useRef(null);

  const router = useRouter();
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);

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
  const isMutatingItemsRef = useRef(false);

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
    new Date().toISOString().split("T")[0],
  );
  const [expiryDate, setExpiryDate] = useState("");

  const [taxRate, setTaxRate] = useState(6.625);

  const [customerNotes, setCustomerNotes] = useState("");

  const [invoiceIdState, setInvoiceIdState] = useState(null);

  const [invoiceNumber, setInvoiceNumber] = useState(null);

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
  const saveItems = async (itemsToSave) => {
    if (!invoiceIdState) return;

    // 🛡️ BLINDAJE CRÍTICO
    if (!Array.isArray(itemsToSave)) {
      console.warn("⚠️ saveItems recibió algo que NO es array:", itemsToSave);
      return;
    }

    await fetch(`/api/invoices/${invoiceIdState}/items`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: itemsToSave.map((i) => ({
          productId: i.productId ?? null,
          name: i.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
          total: i.total,
          options: {
            finish: i.finish ?? i.options?.finish ?? null,
            design: i.design ?? i.options?.design ?? null,
            sides: i.sides ?? i.options?.sides ?? null,
            corners: i.corners ?? i.options?.corners ?? null,
          },
        })),
      }),
    });
  };

  const scheduleAutosave = (itemsSnapshot) => {
    if (!invoiceIdState) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      saveItems(itemsSnapshot);
    }, 900); // ⏱️ debounce suave
  };

  const [team, setTeam] = useState({
    salesRep: null,
    productionManager: null,
    projectManager: null,
  });
  const toggleTax = async () => {
    const next = !taxEnabled;
    setTaxEnabled(next);
  };

  // SUMMARY BUILDER
  const buildOptionSummary = (item) => {
    if (!item.options) return "";

    const fields = [];

    if (item.qty) fields.push(`Qty: ${item.qty}`);

    Object.entries(item.options).forEach(([key, value]) => {
      if (value) fields.push(`${key}: ${value}`);
    });

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
  const persistTotals = async ({ subtotal, tax, total, balance }) => {
    if (!invoiceIdState) return;

    await fetch(`/api/invoices/${invoiceIdState}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtotal, tax, total, balance }),
    });
  };

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
        // ✅ TAX (aquí SÍ existe invoiceData)
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
        setTaxEnabled(
          typeof invoiceData.taxEnabled === "boolean"
            ? invoiceData.taxEnabled
            : true,
        );

        setTaxRate(
          typeof invoiceData.taxRate === "number"
            ? invoiceData.taxRate
            : settingsData.defaultTaxRate,
        );

        console.log("🧾 INVOICE FROM API:", invoiceData);
        console.log("🎯 appliedDiscounts:", invoiceData.appliedDiscounts);

        // ---------------------------
        // DISCOUNTS (IMPORTANTE)
        // ---------------------------
        setAppliedDiscounts(
          invoiceData.appliedDiscounts?.length
            ? [invoiceData.appliedDiscounts[0]]
            : [],
        );

        // ---------------------------
        // SETTINGS
        // ---------------------------

        console.log("✅ SETTINGS FROM /api/settings/billing:", settingsData);

        // ---------------------------
        // INVOICE
        // ---------------------------
        setInvoiceIdState(invoiceData.id);
        invoiceReadyRef.current = true;

        setInvoiceNumber(invoiceData.invoiceNumber);
        setSelectedClient(invoiceData.client);

        setIssuedAt(
          invoiceData.issuedAt
            ? new Date(invoiceData.issuedAt).toISOString().split("T")[0]
            : "",
        );

        setExpiryDate(
          invoiceData.dueDate
            ? new Date(invoiceData.dueDate).toISOString().split("T")[0]
            : "",
        );

        setCustomerNotes(invoiceData.notes || "");

        // ---------------------------
        // ITEMS (USANDO PRODUCT YA INCLUIDO)
        // ---------------------------
        const enrichedItems = (invoiceData.invoiceItems || []).map((i) => {
          const productData = i.product;

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
            options: normalizeOptions(
              i.options ??
                productData?.defaultOptions ??
                productData?.template?.options,
            ),
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

        // Solo si es invoice NUEVO (no edit)
        if (mode !== "edit") {
          setTaxRate(data?.defaultTaxRate ?? 0);
        }
      } catch (err) {
        console.error("❌ Error loading billing settings", err);
      }
    };

    loadSettings();
  }, [mode]);

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
    taxEnabled && taxRate > 0 ? discountedSubtotal * (taxRate / 100) : 0;

  const total = discountedSubtotal + tax;

  // ----------------------------------------
  // PAYMENTS CALCULOS
  // ----------------------------------------
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = total - totalPaid;
  // ----------------------------------------
  // 🧠 STATUS AUTOMÁTICO (DEBE IR AQUÍ)
  // ----------------------------------------

  // ----------------------------------------
  // 💾 PERSIST TOTALS (DEBE IR AQUÍ)
  // ----------------------------------------
  useEffect(() => {
    if (!invoiceIdState) return;
    if (!invoiceReadyRef.current) return;

    persistTotals({ subtotal, tax, total, balance });
  }, [subtotal, tax, total, balance, payments.length]);

  // ----------------------------------------
  // INVOICE STATUS (AUTOMÁTICO)
  // ----------------------------------------

  const status = getInvoiceStatus({
    invoiceTotal: total,
    paymentsTotal: totalPaid,
    balance,
    dueDate: expiryDate,
    status: invoice?.status,
  });

  useEffect(() => {
    if (!settings) return;
    console.log("✅ FINAL SETTINGS USED:", settings);
  }, [settings]);

  // ----------------------------------------

  // ----------------------------------------
  // SELECT PRODUCT
  // ----------------------------------------
  const handleSelectProduct = async (p) => {
    isMutatingItemsRef.current = true;

    const res = await fetch(`/api/products/${p.id}`);
    const full = await res.json();

    const newLine = {
      id: crypto.randomUUID(),
      productId: full.id,
      product: full,

      name: full.name,
      qty: 1,
      unitPrice: 0,
      total: 0,

      customFields: full.customFields || full.template?.fields || null,

      // ✅ TODO VA EN options (objeto)
      options: normalizeOptions(
        full.defaultOptions ?? full.template?.options ?? {},
      ),

      _expanded: true,
    };

    setItems((prev) =>
      prev
        .map((i) => ({ ...i, _expanded: false }))
        .concat({
          ...newLine,
          _expanded: true, // 👈 AQUÍ se abre el configurable
        }),
    );
    setTimeout(() => {
      isMutatingItemsRef.current = false;
    }, 0);

    setProductSearch("");
    setProductResults([]);
    setShowAddCard(false);
  };

  // ----------------------------------------
  // ADD MANUAL ITEM
  const addManualItem = async () => {
    const newItem = {
      id: crypto.randomUUID(),
      productId: null,
      product: null,
      customFields: null,
      name: manualDesc,
      qty: manualQty,
      unitPrice: manualUnit,
      total: manualQty * manualUnit,
      options: {},
      _expanded: false,
    };

    const next = [...items, newItem];

    setItems(next); // ✅ SIEMPRE permite agregar
    setShowAddCard(false);
    // 🔐 SOLO guardar en DB si el invoice YA existe
    if (invoiceIdState) {
      await saveItems(next);
    }

    // limpiar inputs
    setManualDesc("");
    setManualQty(1);
    setManualQtyInput("1");
    setManualUnit(0);
    setManualUnitInput("0");
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
    } catch (err) {
      console.error("❌ Error saving dates", err);
    }
  };

  // UPDATE ITEM
  const handleItemChange = useCallback(
    (index, fields) => {
      let nextItems;
      let isManualItem = false;

      setItems((prev) => {
        nextItems = [...prev];

        nextItems[index] = {
          ...nextItems[index],
          ...fields,
          options: {
            finish: fields.finish ?? nextItems[index].options?.finish ?? null,
            design: fields.design ?? nextItems[index].options?.design ?? null,
            sides: fields.sides ?? nextItems[index].options?.sides ?? null,
            corners:
              fields.corners ?? nextItems[index].options?.corners ?? null,
          },
          _expanded: fields.__commit ? false : nextItems[index]._expanded,
        };

        // ✅ AQUÍ ES EL ÚNICO LUGAR DONDE EXISTE
        isManualItem = !nextItems[index].productId;

        return nextItems;
      });

      // 🔐 Guardado controlado
      if (fields.__commit === true && !savingRef.current) {
        savingRef.current = true;

        Promise.resolve().then(async () => {
          await saveItems(nextItems);
          savingRef.current = false;
        });
      } else {
        // ❌ NO autosave para manual
        if (!isManualItem) {
          scheduleAutosave(nextItems);
        }
      }
    },
    [saveItems],
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
    const next = items.filter((_, i) => i !== index);
    setItems(next);
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
                className="w-full text-left px-4 py-2 text-m  hover:bg-gray-100"
                onClick={() => {
                  setOpen(false);
                  setShowRecordPaymentModal(true);
                }}
              >
                Record Payment
              </button>
            )}
            <div className="border-t my-1" />

            <button
              onClick={async () => {
                if (!publicInvoiceLink) {
                  alert("Public invoice link not ready yet");
                  return;
                }

                await navigator.clipboard.writeText(publicInvoiceLink);
                alert("Public invoice link copied ✅");
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Copy Payment Link
            </button>

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
      <div className="mx-auto mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-700">
          IN #{invoiceNumber ?? ""}
        </h1>

        <div className="flex items-center gap-3">
          {/* DOWNLOAD PDF */}
          <button
            disabled={!invoiceIdState}
            onClick={() =>
              window.open(`/api/invoices/${invoiceIdState}/pdf`, "_blank")
            }
            className="border px-4 py-2 rounded-lg"
          >
            View PDF
          </button>

          {/* ACTIONS MENU */}
          <QuoteActionsMenu />
        </div>
      </div>

      {/* CARD 1 — QUOTE DETAILS */}
      <div className="mx-auto  bg-white border rounded-xl  mb-10 shadow-md">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Invoice Details</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-green-600 font-medium">Saved</span>
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
                className={`inline-block px-3 py-1  text-l font-semibold ${
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
                  onBlur={updateDates} // 👈 GUARDA AL SALIR
                />
              </div>

              <div>
                <p className="text-xs text-gray-500">Due Date</p>
                <input
                  type="date"
                  className="mt-1 border rounded-lg px-4 py-2.5 w-full"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  onBlur={updateDates} // 👈 GUARDA AL SALIR
                />
              </div>
            </div>
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
            <button
              onClick={() => setShowAddCard(!showAddCard)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow text-sm font-medium"
            >
              + Add New Item
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
                    onClick={() => setTaxRate(0)}
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
                        /* COLLAPSED */
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            setItems((prev) =>
                              prev.map((it, i) => ({
                                ...it,
                                _expanded: i === index,
                              })),
                            );
                          }}
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
                              <p className="text-sm text-gray-500">
                                Unit Price
                              </p>
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
                        /* ✅ CONFIGURABLE Y MANUAL USAN EL MISMO EDITOR */
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
            {/* LABELS */}
            <div className="text-xl font-medium space-y-2 text-left text-gray-700">
              <p>Subtotal</p>

              {discountLines.map((d) => (
                <p key={d.name} className="text-emerald-700">
                  Discount ({d.name}
                  {d.type === "percent" ? ` ${d.value}%` : ""})
                </p>
              ))}
              {appliedDiscount && (
                <button
                  className="text-xs text-red-600 hover:underline"
                  onClick={async () => {
                    setAppliedDiscounts([]);

                    await fetch(`/api/invoices/${invoiceIdState}/discount`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ discount: null }),
                    });
                  }}
                >
                  Remove Discount
                </button>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={async (e) => {
                    const next = e.target.checked;
                    setTaxEnabled(next);

                    await fetch(`/api/invoices/${invoiceIdState}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        taxEnabled: next,
                        taxRate: next
                          ? (settings?.defaultTaxRate ?? 0)
                          : taxRate,
                      }),
                    });
                  }}
                />
                Apply Tax
              </label>

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
                  issuedAt,
                  dueDate: expiryDate || null,
                  subtotal: 0,
                  tax: 0,
                  total: 0,
                  balance: 0,
                  taxEnabled: true,
                  taxRate: settings?.defaultTaxRate ?? 0,
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
                },
              );

              if (!res.ok) throw new Error();

              // 🔄 recargar SOLO pagos
              const pRes = await fetch(
                `/api/invoices/${invoiceIdState}/payments`,
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
        onApply={async (discount) => {
          if (!invoiceIdState) return;

          // 1️⃣ Actualiza UI inmediatamente
          setAppliedDiscounts(discount ? [discount] : []);

          // 2️⃣ Calcula amount
          const amount = discount
            ? discount.type === "percent"
              ? Math.min(subtotal * (discount.value / 100), subtotal)
              : Math.min(discount.value, subtotal)
            : 0;

          // 3️⃣ Guarda en DB
          await fetch(`/api/invoices/${invoiceIdState}/discount`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              discount: discount
                ? {
                    id: discount.id,
                    type: discount.type,
                    value: discount.value,
                    amount,
                  }
                : null,
            }),
          });

          // 4️⃣ Cierra modal DESPUÉS de guardar
          setShowDiscountModal(false);
        }}
      />
    </div>
  );
}
