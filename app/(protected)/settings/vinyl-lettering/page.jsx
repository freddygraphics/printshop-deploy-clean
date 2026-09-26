"use client";

import { useEffect, useState } from "react";
import {
  Type,
  Save,
  Scissors,
  Hand,
  Layers,
  Wrench,
  DollarSign,
  Percent,
} from "lucide-react";

const DEFAULT_FORM = {
  minimumOrderPrice: 20,
  setupFee: 0,
  profitMargin: 50,

  cuttingBaseFee: 0,
  cuttingPerSqft: 0,

  easyWeedingPerSqft: 0,
  mediumWeedingPerSqft: 0,
  complexWeedingPerSqft: 0,

  transferTapeCostPerSqft: 0,
  transferTapeMarkup: 0,

  installationMinimum: 0,
  installationPerSqft: 0,

  defaultWastePercent: 10,
};

export default function VinylLetteringPricingPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ======================================================
     LOAD SETTINGS
  ====================================================== */

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/settings/vinyl-lettering", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load pricing settings.");
      }

      if (data.settings) {
        setForm({
          minimumOrderPrice: data.settings.minimumOrderPrice ?? 20,

          setupFee: data.settings.setupFee ?? 0,

          profitMargin: data.settings.profitMargin ?? 50,

          cuttingBaseFee: data.settings.cuttingBaseFee ?? 0,

          cuttingPerSqft: data.settings.cuttingPerSqft ?? 0,

          easyWeedingPerSqft: data.settings.easyWeedingPerSqft ?? 0,

          mediumWeedingPerSqft: data.settings.mediumWeedingPerSqft ?? 0,

          complexWeedingPerSqft: data.settings.complexWeedingPerSqft ?? 0,

          transferTapeCostPerSqft: data.settings.transferTapeCostPerSqft ?? 0,

          transferTapeMarkup: data.settings.transferTapeMarkup ?? 0,

          installationMinimum: data.settings.installationMinimum ?? 0,

          installationPerSqft: data.settings.installationPerSqft ?? 0,

          defaultWastePercent: data.settings.defaultWastePercent ?? 10,
        });
      }
    } catch (err) {
      console.error(err);

      setError(err.message || "Unable to load pricing settings.");
    } finally {
      setLoading(false);
    }
  }

  /* ======================================================
     UPDATE FIELD
  ====================================================== */

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccess("");
  }

  /* ======================================================
     SAVE
  ====================================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/settings/vinyl-lettering", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save pricing settings.");
      }

      if (data.settings) {
        setForm(data.settings);
      }

      setSuccess("Vinyl lettering pricing saved successfully.");
    } catch (err) {
      console.error(err);

      setError(err.message || "Unable to save pricing settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-8">
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
          Loading vinyl lettering pricing...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* HEADER */}

      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <Type className="h-6 w-6 text-blue-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Vinyl Lettering Pricing
          </h1>
        </div>

        <p className="text-gray-500">
          Configure production costs and pricing rules for cut vinyl lettering.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          {/* LEFT */}

          <div className="space-y-6">
            {/* GENERAL */}

            <PricingSection
              icon={DollarSign}
              title="General Pricing"
              description="Minimum pricing and setup charges."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <MoneyField
                  label="Minimum Order Price"
                  value={form.minimumOrderPrice}
                  onChange={(value) => updateField("minimumOrderPrice", value)}
                  help="The minimum amount charged for any vinyl lettering job."
                />

                <MoneyField
                  label="Setup Fee"
                  value={form.setupFee}
                  onChange={(value) => updateField("setupFee", value)}
                  help="Fixed production/setup charge added to each job."
                />
              </div>
            </PricingSection>

            {/* CUTTING */}

            <PricingSection
              icon={Scissors}
              title="Cutting"
              description="Cost associated with machine cutting."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <MoneyField
                  label="Base Cutting Fee"
                  value={form.cuttingBaseFee}
                  onChange={(value) => updateField("cuttingBaseFee", value)}
                  help="Fixed cutting charge per job."
                />

                <MoneyField
                  label="Cutting / Sq Ft"
                  value={form.cuttingPerSqft}
                  onChange={(value) => updateField("cuttingPerSqft", value)}
                  suffix="/ sq ft"
                  help="Additional cutting cost based on job area."
                />
              </div>
            </PricingSection>

            {/* WEEDING */}

            <PricingSection
              icon={Hand}
              title="Weeding"
              description="Labor charge based on design complexity."
            >
              <div className="grid gap-5 md:grid-cols-3">
                <MoneyField
                  label="Easy"
                  value={form.easyWeedingPerSqft}
                  onChange={(value) => updateField("easyWeedingPerSqft", value)}
                  suffix="/ sq ft"
                  help="Large letters and simple shapes."
                />

                <MoneyField
                  label="Medium"
                  value={form.mediumWeedingPerSqft}
                  onChange={(value) =>
                    updateField("mediumWeedingPerSqft", value)
                  }
                  suffix="/ sq ft"
                  help="Normal lettering and moderate detail."
                />

                <MoneyField
                  label="Complex"
                  value={form.complexWeedingPerSqft}
                  onChange={(value) =>
                    updateField("complexWeedingPerSqft", value)
                  }
                  suffix="/ sq ft"
                  help="Small text and detailed graphics."
                />
              </div>
            </PricingSection>

            {/* TRANSFER TAPE */}

            <PricingSection
              icon={Layers}
              title="Transfer Tape"
              description="Transfer tape material cost and markup."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <MoneyField
                  label="Transfer Tape Cost"
                  value={form.transferTapeCostPerSqft}
                  onChange={(value) =>
                    updateField("transferTapeCostPerSqft", value)
                  }
                  suffix="/ sq ft"
                  help="Your actual transfer tape cost."
                />

                <PercentField
                  label="Transfer Tape Markup"
                  value={form.transferTapeMarkup}
                  onChange={(value) => updateField("transferTapeMarkup", value)}
                  help="Markup applied to transfer tape."
                />
              </div>
            </PricingSection>

            {/* INSTALLATION */}

            <PricingSection
              icon={Wrench}
              title="Installation"
              description="Optional installation pricing."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <MoneyField
                  label="Installation Minimum"
                  value={form.installationMinimum}
                  onChange={(value) =>
                    updateField("installationMinimum", value)
                  }
                  help="Minimum charge when installation is selected."
                />

                <MoneyField
                  label="Installation / Sq Ft"
                  value={form.installationPerSqft}
                  onChange={(value) =>
                    updateField("installationPerSqft", value)
                  }
                  suffix="/ sq ft"
                  help="Installation charge based on finished area."
                />
              </div>
            </PricingSection>
          </div>

          {/* RIGHT */}

          <div>
            <div className="sticky top-6 space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-5 flex items-center gap-2">
                  <Percent className="h-5 w-5 text-blue-600" />

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Pricing Rules
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      Defaults used by the calculator.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <PercentField
                    label="Default Waste"
                    value={form.defaultWastePercent}
                    onChange={(value) =>
                      updateField("defaultWastePercent", value)
                    }
                    help="Extra material allowance for production."
                  />

                  <PercentField
                    label="Profit Margin"
                    value={form.profitMargin}
                    onChange={(value) => updateField("profitMargin", value)}
                    help="Profit percentage applied to production cost."
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
                <h3 className="font-semibold text-gray-900">Material Cost</h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Vinyl cost is not configured here. The calculator will
                  automatically use the selected material from your Materials
                  catalog.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />

                {saving ? "Saving..." : "Save Pricing"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ======================================================
   COMPONENTS
====================================================== */

function PricingSection({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
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

function MoneyField({ label, value, onChange, suffix, help }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          $
        </span>

        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-7 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
            suffix ? "pr-20" : "pr-3"
          }`}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {suffix}
          </span>
        )}
      </div>

      {help && (
        <span className="mt-1.5 block text-xs leading-5 text-gray-400">
          {help}
        </span>
      )}
    </label>
  );
}

function PercentField({ label, value, onChange, help }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <div className="relative">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-9 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          %
        </span>
      </div>

      {help && (
        <span className="mt-1.5 block text-xs leading-5 text-gray-400">
          {help}
        </span>
      )}
    </label>
  );
}
