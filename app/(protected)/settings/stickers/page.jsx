"use client";

import { useEffect, useState } from "react";

const DEFAULT_SETTINGS = {
  inkCostPerSqft: 0,
  machineCostPerHour: 0,
  laborPerHour: 25,

  printSpeedSqftPerHour: 20,
  laborMinutesPerOrder: 10,
  cutSpeedInPerMinute: 20,

  cuttingBaseFee: 0,
  cuttingPerMinute: 0,
  gapIn: 0.125,
  sideMarginIn: 0.25,

  mediaWidthIn: 20,
  usablePrintWidthIn: 18.9,

  setupFee: 10,
  wastePercent: 10,
  profitMargin: 50,
  minimumOrderPrice: 25,
};

export default function StickerSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/sticker-settings", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Unable to load settings");
      }

      setSettings({
        ...DEFAULT_SETTINGS,
        ...data,
      });
    } catch (err) {
      console.error(err);
      setError("Unable to load sticker settings.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  }

  async function saveSettings() {
    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const res = await fetch("/api/sticker-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Unable to save settings");
      }

      setSettings({
        ...DEFAULT_SETTINGS,
        ...data,
      });

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      setError("Unable to save sticker settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl p-6">
          <p className="text-sm text-gray-500">Loading sticker settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sticker Pricing
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Configure production costs and pricing for roll stickers.
            </p>
          </div>

          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save Settings"}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* PRODUCTION COSTS */}
        <Section
          title="Production Costs"
          description="General costs associated with printing each sticker order."
        >
          <Input
            label="Ink Cost / Sq Ft"
            prefix="$"
            value={settings.inkCostPerSqft}
            onChange={(value) => updateField("inkCostPerSqft", value)}
          />

          <Input
            label="Machine Cost / Hour"
            prefix="$"
            value={settings.machineCostPerHour}
            onChange={(value) => updateField("machineCostPerHour", value)}
          />

          <Input
            label="Labor / Hour"
            prefix="$"
            value={settings.laborPerHour}
            onChange={(value) => updateField("laborPerHour", value)}
          />

          <Input
            label="Print Speed / Sq Ft Hour"
            suffix="sq ft/h"
            value={settings.printSpeedSqftPerHour}
            step="0.1"
            onChange={(value) => updateField("printSpeedSqftPerHour", value)}
          />

          <Input
            label="Labor Minutes / Order"
            suffix="min"
            value={settings.laborMinutesPerOrder}
            step="1"
            onChange={(value) => updateField("laborMinutesPerOrder", value)}
          />

          <Input
            label="Setup Fee"
            prefix="$"
            value={settings.setupFee}
            onChange={(value) => updateField("setupFee", value)}
          />
        </Section>

        {/* CUTTING */}
        <Section
          title="Cutting"
          description="Costs associated with contour cutting and finishing."
        >
          <Input
            label="Cutting Base Fee"
            prefix="$"
            value={settings.cuttingBaseFee}
            onChange={(value) => updateField("cuttingBaseFee", value)}
          />

          <Input
            label="Cutting Cost / Minute"
            prefix="$"
            value={settings.cuttingPerMinute}
            onChange={(value) => updateField("cuttingPerMinute", value)}
          />

          <Input
            label="Cut Speed"
            suffix="in/min"
            value={settings.cutSpeedInPerMinute}
            step="1"
            onChange={(value) => updateField("cutSpeedInPerMinute", value)}
          />
        </Section>

        {/* PRODUCTION LAYOUT */}
        <Section
          title="Production Layout"
          description="Spacing, machine width and waste used when calculating roll consumption."
        >
          <Input
            label="Production Media Width"
            suffix="in"
            value={settings.mediaWidthIn}
            step="0.1"
            onChange={(value) => updateField("mediaWidthIn", value)}
          />

          <Input
            label="Usable Print Width"
            suffix="in"
            value={settings.usablePrintWidthIn}
            step="0.1"
            onChange={(value) => updateField("usablePrintWidthIn", value)}
          />

          <Input
            label="Gap Between Stickers"
            suffix="in"
            value={settings.gapIn}
            step="0.001"
            onChange={(value) => updateField("gapIn", value)}
          />

          <Input
            label="Side Margin"
            suffix="in"
            value={settings.sideMarginIn}
            step="0.001"
            onChange={(value) => updateField("sideMarginIn", value)}
          />

          <Input
            label="Waste"
            suffix="%"
            value={settings.wastePercent}
            onChange={(value) => updateField("wastePercent", value)}
          />
        </Section>

        {/* PRICING */}
        <Section
          title="Pricing"
          description="Control your target margin and minimum order price."
        >
          <Input
            label="Profit Margin"
            suffix="%"
            value={settings.profitMargin}
            onChange={(value) => updateField("profitMargin", value)}
          />

          <Input
            label="Minimum Order Price"
            prefix="$"
            value={settings.minimumOrderPrice}
            onChange={(value) => updateField("minimumOrderPrice", value)}
          />
        </Section>

        {/* MATERIAL INFO */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Sticker Materials</h2>

          <p className="mt-1 text-sm text-gray-500">
            Vinyl and laminate costs are managed from Materials. The sticker
            calculator will use the roll dimensions and costs stored there.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="font-semibold text-gray-900">{title}</h2>

        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, prefix, suffix, step = "0.01" }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="flex overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-black">
        {prefix && (
          <div className="flex items-center border-r bg-gray-50 px-3 text-sm text-gray-500">
            {prefix}
          </div>
        )}

        <input
          type="number"
          min="0"
          step={step}
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none"
        />

        {suffix && (
          <div className="flex items-center border-l bg-gray-50 px-3 text-sm text-gray-500">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}
