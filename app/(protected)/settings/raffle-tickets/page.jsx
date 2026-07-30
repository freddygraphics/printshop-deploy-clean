"use client";

import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  BookOpen,
  CircleDollarSign,
  FileText,
  Loader2,
  Percent,
  Printer,
  Save,
  Scissors,
} from "lucide-react";

const initialPricing = {
  paperCostPerSheet: 0,
  printingCostPerSheet: 0,
  cutCostPerSheet: 0,
  ticketsPerSheet: 1,
  wastePercent: 0,

  setupFee: 0,

  numberingSetupFee: 0,
  numberingCostPerTicket: 0,

  perforationSetupFee: 0,
  perforationCostPerTicket: 0,

  bookletCost: 0,
  defaultTicketsPerBook: 1,

  printReadyDesignFee: 0,
  basicDesignFee: 0,
  fullDesignFee: 0,

  profitMargin: 0,
};

export default function RaffleTicketPricingPage() {
  const [pricing, setPricing] = useState(initialPricing);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadPricing();
  }, []);

  async function loadPricing() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/settings/raffle-tickets", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load pricing.");
      }

      setPricing({
        ...initialPricing,
        ...data,
      });
    } catch (err) {
      setError(err.message || "Unable to load raffle ticket pricing.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setPricing((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccess("");
    setError("");
  }

  async function savePricing() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/settings/raffle-tickets", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pricing),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save pricing.");
      }

      setPricing({
        ...initialPricing,
        ...data.pricing,
      });

      setSuccess("Raffle ticket pricing saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save raffle ticket pricing.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading raffle ticket pricing...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Raffle Ticket Pricing
            </h1>

            <p className="mt-1 text-gray-500">
              Configure printing, numbering, perforation, design and profit.
            </p>
          </div>

          <button
            type="button"
            onClick={savePricing}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* MESSAGES */}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* PRINTING */}
          <Section
            title="Printing & Paper"
            description="Paper, printing and production capacity per sheet."
            icon={Printer}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceInput
                label="Paper cost per sheet"
                value={pricing.paperCostPerSheet}
                onChange={(value) => updateField("paperCostPerSheet", value)}
              />

              <PriceInput
                label="Printing cost per sheet"
                value={pricing.printingCostPerSheet}
                onChange={(value) => updateField("printingCostPerSheet", value)}
              />

              <NumberInput
                label="Tickets per sheet"
                value={pricing.ticketsPerSheet}
                min={1}
                step={1}
                onChange={(value) => updateField("ticketsPerSheet", value)}
              />

              <PriceInput
                label="Cut cost per sheet"
                value={pricing.cutCostPerSheet}
                onChange={(value) => updateField("cutCostPerSheet", value)}
              />
            </div>
          </Section>

          {/* SETUP */}
          <Section
            title="Setup & Waste"
            description="General preparation and estimated material waste."
            icon={FileText}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceInput
                label="Setup fee"
                value={pricing.setupFee}
                onChange={(value) => updateField("setupFee", value)}
              />

              <PercentInput
                label="Waste percentage"
                value={pricing.wastePercent}
                onChange={(value) => updateField("wastePercent", value)}
              />
            </div>
          </Section>

          {/* NUMBERING */}
          <Section
            title="Numbering"
            description="Charges applied when tickets require sequential numbers."
            icon={BadgeDollarSign}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceInput
                label="Numbering setup fee"
                value={pricing.numberingSetupFee}
                onChange={(value) => updateField("numberingSetupFee", value)}
              />

              <PriceInput
                label="Cost per ticket"
                value={pricing.numberingCostPerTicket}
                step={0.01}
                onChange={(value) =>
                  updateField("numberingCostPerTicket", value)
                }
              />
            </div>
          </Section>

          {/* PERFORATION */}
          <Section
            title="Perforation"
            description="Setup and unit costs for perforated ticket stubs."
            icon={Scissors}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceInput
                label="Perforation setup fee"
                value={pricing.perforationSetupFee}
                onChange={(value) => updateField("perforationSetupFee", value)}
              />

              <PriceInput
                label="Cost per ticket"
                value={pricing.perforationCostPerTicket}
                step={0.01}
                onChange={(value) =>
                  updateField("perforationCostPerTicket", value)
                }
              />
            </div>
          </Section>

          {/* BOOKLETS */}
          <Section
            title="Booklets"
            description="Configure assembly costs and tickets per booklet."
            icon={BookOpen}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceInput
                label="Cost per booklet"
                value={pricing.bookletCost}
                onChange={(value) => updateField("bookletCost", value)}
              />

              <NumberInput
                label="Default tickets per booklet"
                value={pricing.defaultTicketsPerBook}
                min={1}
                step={1}
                onChange={(value) =>
                  updateField("defaultTicketsPerBook", value)
                }
              />
            </div>
          </Section>

          {/* DESIGN */}
          <Section
            title="Design"
            description="Design charges according to the work required."
            icon={CircleDollarSign}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceInput
                label="Print-ready design"
                value={pricing.printReadyDesignFee}
                onChange={(value) => updateField("printReadyDesignFee", value)}
              />

              <PriceInput
                label="Basic design"
                value={pricing.basicDesignFee}
                onChange={(value) => updateField("basicDesignFee", value)}
              />

              <PriceInput
                label="Full design"
                value={pricing.fullDesignFee}
                onChange={(value) => updateField("fullDesignFee", value)}
              />
            </div>
          </Section>
        </div>

        {/* PROFIT */}
        <Section
          title="Profit Margin"
          description="Margin applied to the total production cost. It must be lower than 100%."
          icon={Percent}
        >
          <div className="max-w-sm">
            <PercentInput
              label="Profit margin"
              value={pricing.profitMargin}
              max={99}
              onChange={(value) => updateField("profitMargin", value)}
            />
          </div>
        </Section>

        {/* BOTTOM SAVE */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={savePricing}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, description, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function PriceInput({ label, value, onChange, step = 0.01 }) {
  return (
    <InputWrapper label={label}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          $
        </span>

        <input
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-7 pr-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black"
        />
      </div>
    </InputWrapper>
  );
}

function PercentInput({ label, value, onChange, max = 100 }) {
  return (
    <InputWrapper label={label}>
      <div className="relative">
        <input
          type="number"
          min="0"
          max={max}
          step="0.01"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-3 pr-8 outline-none transition focus:border-black focus:ring-1 focus:ring-black"
        />

        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          %
        </span>
      </div>
    </InputWrapper>
  );
}

function NumberInput({ label, value, onChange, min = 0, max, step = 1 }) {
  return (
    <InputWrapper label={label}>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-black focus:ring-1 focus:ring-black"
      />
    </InputWrapper>
  );
}

function InputWrapper({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>

      {children}
    </div>
  );
}
