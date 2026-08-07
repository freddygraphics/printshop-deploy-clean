"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Ticket } from "lucide-react";

const DESIGN_OPTIONS = [
  {
    value: "print-ready",
    label: "Print-ready artwork",
    field: "printReadyDesignFee",
  },
  {
    value: "basic",
    label: "Basic design",
    field: "basicDesignFee",
  },
  {
    value: "full",
    label: "Full custom design",
    field: "fullDesignFee",
  },
];

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));

export default function RaffleTicketCalculator({
  product,
  initialData,
  onAdd,
  onChange,
}) {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const savedOptions = initialData?.options || {};

  const [quantity, setQuantity] = useState(
    Number(
      savedOptions.totalTickets ??
        initialData?.qty ??
        initialData?.quantity ??
        500,
    ),
  );

  const [ticketsPerBook, setTicketsPerBook] = useState(
    Number(savedOptions.ticketsPerBook ?? 50),
  );

  const [startingNumber, setStartingNumber] = useState(
    Number(savedOptions.startingNumber ?? 1),
  );

  const [numbering, setNumbering] = useState(savedOptions.numbering ?? true);

  const [perforation, setPerforation] = useState(
    savedOptions.perforation ?? true,
  );

  const [booklets, setBooklets] = useState(savedOptions.booklets ?? true);

  const [designType, setDesignType] = useState(
    savedOptions.designType ?? "print-ready",
  );

  // ==========================================================
  // Cargar precios guardados en Settings
  // ==========================================================
  useEffect(() => {
    async function loadPricing() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/settings/raffle-tickets", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load raffle ticket pricing.",
          );
        }

        setPricing(data);

        if (initialData?.options?.ticketsPerBook == null) {
          setTicketsPerBook(Number(data.defaultTicketsPerBook || 50));
        }
      } catch (err) {
        console.error("Error loading raffle ticket pricing:", err);
        setError(err.message || "Unable to load pricing.");
      } finally {
        setLoading(false);
      }
    }

    loadPricing();
  }, [initialData?.options?.ticketsPerBook]);

  // ==========================================================
  // Calcular precio
  // ==========================================================
  const result = useMemo(() => {
    if (!pricing) return null;

    const safeQuantity = Math.max(1, Number(quantity) || 1);
    const safeTicketsPerBook = Math.max(1, Number(ticketsPerBook) || 1);
    const ticketsPerSheet = Math.max(1, Number(pricing.ticketsPerSheet) || 1);

    const sheetsNeeded = Math.ceil(safeQuantity / ticketsPerSheet);

    const baseSheetCost =
      Number(pricing.paperCostPerSheet || 0) +
      Number(pricing.printingCostPerSheet || 0) +
      Number(pricing.cutCostPerSheet || 0);

    const sheetProductionCost = sheetsNeeded * baseSheetCost;

    const wasteCost =
      sheetProductionCost * (Number(pricing.wastePercent || 0) / 100);

    const setupCost = Number(pricing.setupFee || 0);

    const numberingCost = numbering
      ? Number(pricing.numberingSetupFee || 0) +
        safeQuantity * Number(pricing.numberingCostPerTicket || 0)
      : 0;

    const perforationCost = perforation
      ? Number(pricing.perforationSetupFee || 0) +
        safeQuantity * Number(pricing.perforationCostPerTicket || 0)
      : 0;

    const bookCount = booklets
      ? Math.ceil(safeQuantity / safeTicketsPerBook)
      : 0;

    const bookletCost = booklets
      ? bookCount * Number(pricing.bookletCost || 0)
      : 0;

    const selectedDesign = DESIGN_OPTIONS.find(
      (option) => option.value === designType,
    );

    const designFee = Number(
      pricing[selectedDesign?.field || "printReadyDesignFee"] || 0,
    );

    const productionCost =
      sheetProductionCost +
      wasteCost +
      setupCost +
      numberingCost +
      perforationCost +
      bookletCost +
      designFee;

    const profitMargin = Number(pricing.profitMargin || 0);
    const marginDecimal = profitMargin / 100;

    const calculatedPrice =
      marginDecimal >= 1
        ? productionCost
        : productionCost / (1 - marginDecimal);

    // Redondear el precio final para evitar centavos
    const finalPrice = Math.ceil(calculatedPrice);
    const unitPrice = finalPrice / safeQuantity;
    const profit = finalPrice - productionCost;

    return {
      quantity: safeQuantity,
      ticketsPerBook: safeTicketsPerBook,
      sheetsNeeded,
      bookCount,
      sheetProductionCost,
      wasteCost,
      setupCost,
      numberingCost,
      perforationCost,
      bookletCost,
      designFee,
      productionCost,
      profitMargin,
      finalPrice,
      unitPrice,
      profit,
      endingNumber: startingNumber + safeQuantity - 1,
      designLabel: selectedDesign?.label || "Print-ready artwork",
    };
  }, [
    pricing,
    quantity,
    ticketsPerBook,
    startingNumber,
    numbering,
    perforation,
    booklets,
    designType,
  ]);

  // ==========================================================
  // Enviar valores a la factura
  // ==========================================================
  const configuredItem = useMemo(() => {
    if (!result || !pricing) return null;

    const details = [
      `${result.quantity} raffle tickets`,
      booklets
        ? `${result.bookCount} booklets of ${result.ticketsPerBook}`
        : "Loose tickets",
      numbering
        ? `Numbered ${startingNumber}–${result.endingNumber}`
        : "Without numbering",
      perforation ? "Perforated" : "Without perforation",
      result.designLabel,
    ];

    return {
      productId: product?.id,
      name: product?.name || "Raffle Tickets",
      description: details.join(" | "),

      qty: result.quantity,
      quantity: result.quantity,

      unitPrice: Number(result.unitPrice.toFixed(4)),
      price: Number(result.unitPrice.toFixed(4)),
      total: result.finalPrice,

      options: {
        productType: "raffle-tickets",

        totalTickets: result.quantity,
        ticketsPerSheet: Number(pricing.ticketsPerSheet),
        sheetsNeeded: result.sheetsNeeded,

        booklets,
        ticketsPerBook: result.ticketsPerBook,
        bookCount: result.bookCount,

        numbering,
        startingNumber: numbering ? startingNumber : null,
        endingNumber: numbering ? result.endingNumber : null,

        perforation,
        designType,
        designLabel: result.designLabel,

        productionCost: Number(result.productionCost.toFixed(2)),
        profit: Number(result.profit.toFixed(2)),
        profitMargin: result.profitMargin,
        calculatedTotal: result.finalPrice,
      },
    };
  }, [
    result,
    pricing,
    product,
    booklets,
    numbering,
    startingNumber,
    perforation,
    designType,
  ]);
  useEffect(() => {
    if (!configuredItem) return;

    onChange?.(configuredItem);
  }, [configuredItem, onChange]);
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-10 text-gray-500">
        <Loader2 size={20} className="animate-spin" />
        Loading raffle ticket pricing...
      </div>
    );
  }

  if (error || !pricing) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || "Raffle ticket pricing is unavailable."}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* HEADER */}
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-sky-100 p-2.5 text-sky-600">
            <Ticket size={24} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Raffle Ticket Calculator
            </h2>

            <p className="text-sm text-gray-500">
              Calculate production cost, selling price and profit.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* FORMULARIO */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField
            label="Total tickets"
            value={quantity}
            min={1}
            onChange={setQuantity}
          />

          <InputField
            label="Starting number"
            value={startingNumber}
            min={0}
            onChange={setStartingNumber}
            disabled={!numbering}
          />

          <InputField
            label="Tickets per booklet"
            value={ticketsPerBook}
            min={1}
            onChange={setTicketsPerBook}
            disabled={!booklets}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Design service
            </label>

            <select
              value={designType}
              onChange={(event) => setDesignType(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              {DESIGN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} — {money(pricing[option.field])}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* OPCIONES */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <CheckboxCard
            label="Consecutive numbering"
            checked={numbering}
            onChange={setNumbering}
          />

          <CheckboxCard
            label="Perforation"
            checked={perforation}
            onChange={setPerforation}
          />

          <CheckboxCard
            label="Create booklets"
            checked={booklets}
            onChange={setBooklets}
          />
        </div>

        {/* RESULTADOS */}
        {result && (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <ResultCard label="Sheets needed" value={result.sheetsNeeded} />

              <ResultCard
                label="Booklets"
                value={booklets ? result.bookCount : "No"}
              />

              <ResultCard
                label="Production cost"
                value={money(result.productionCost)}
              />

              <ResultCard label="Profit" value={money(result.profit)} green />
            </div>

            <div className="rounded-xl bg-gray-50 p-5">
              <h3 className="mb-4 font-semibold text-gray-900">
                Calculation details
              </h3>

              <div className="grid grid-cols-1 gap-x-10 gap-y-2 text-sm md:grid-cols-2">
                <DetailRow
                  label="Paper, printing and cutting"
                  value={money(result.sheetProductionCost)}
                />

                <DetailRow
                  label={`Waste (${pricing.wastePercent}%)`}
                  value={money(result.wasteCost)}
                />

                <DetailRow
                  label="General setup"
                  value={money(result.setupCost)}
                />

                <DetailRow
                  label="Numbering"
                  value={money(result.numberingCost)}
                />

                <DetailRow
                  label="Perforation"
                  value={money(result.perforationCost)}
                />

                <DetailRow
                  label="Booklet assembly"
                  value={money(result.bookletCost)}
                />

                <DetailRow label="Design" value={money(result.designFee)} />

                <DetailRow
                  label={`Profit margin (${result.profitMargin}%)`}
                  value={money(result.profit)}
                />
              </div>
            </div>

            {/* TOTAL */}
            <div className="rounded-xl bg-slate-900 p-6 text-white">
              <div>
                <p className="text-sm text-slate-300">Final selling price</p>

                <p className="mt-1 text-4xl font-bold">
                  {money(result.finalPrice)}
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  {money(result.unitPrice)} per ticket
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, min = 0, disabled = false }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type="number"
        min={min}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
      />
    </div>
  );
}

function CheckboxCard({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-sky-300 hover:bg-sky-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
      />

      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}

function ResultCard({ label, value, green = false }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-bold ${
          green ? "text-green-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-gray-200 py-2">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
