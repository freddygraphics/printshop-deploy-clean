"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calculator,
  DollarSign,
  Loader2,
  Plus,
  Save,
  Shirt,
  Trash2,
  Truck,
} from "lucide-react";
const DEFAULT_PRINT_LOCATIONS = [
  { key: "front", name: "Front", width: 3.5, height: 3.5, enabled: true },
  { key: "back", name: "Back", width: 10.5, height: 11, enabled: true },
  {
    key: "leftSleeve",
    name: "Left Sleeve",
    width: 3,
    height: 3,
    enabled: false,
  },
  {
    key: "rightSleeve",
    name: "Right Sleeve",
    width: 3,
    height: 3,
    enabled: false,
  },
  {
    key: "longLeftSleeve",
    name: "Long Left Sleeve",
    width: 2.5,
    height: 17,
    enabled: false,
  },
  {
    key: "longRightSleeve",
    name: "Long Right Sleeve",
    width: 2.5,
    height: 17,
    enabled: false,
  },
];
const EMPTY_SETTINGS = {
  active: true,
  dtfPricingMethod: "GANG_SHEET",
  dtfCostPerSqft: 4,
  dtfRollWidth: 22,
  dtfGap: 0.25,
  gangSheets: [],
  defaultPrintLocations: DEFAULT_PRINT_LOCATIONS,
  laborPerLocation: 2,
  setupFeePerLocation: 0,
  minimumSetupFee: 0,
  supplierShippingFlat: 0,
  dtfShippingFlat: 0,
  shippingPercent: 0,
  wastePercent: 5,
  pricingMode: "MARKUP",
  defaultProfitMargin: 50,
  quantityMargins: [],
  minimumUnitPrice: 0,
  minimumOrderPrice: 0,
};

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = "0.01",
  min = "0",
  description,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            {prefix}
          </span>
        ) : null}

        <input
          type="number"
          min={min}
          step={step}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-lg border border-gray-300 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
            prefix ? "pl-8" : "pl-3"
          } ${suffix ? "pr-12" : "pr-3"}`}
        />

        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500">
            {suffix}
          </span>
        ) : null}
      </div>

      {description ? (
        <span className="mt-1.5 block text-xs text-gray-500">
          {description}
        </span>
      ) : null}
    </label>
  );
}

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-gray-200 px-6 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <div className="p-6">{children}</div>
    </section>
  );
}

export default function ApparelPricingPage() {
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/settings/apparel-pricing", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load settings.");
      }

      setSettings({
        ...EMPTY_SETTINGS,
        ...data,
        gangSheets: Array.isArray(data.gangSheets) ? data.gangSheets : [],
        defaultPrintLocations:
          Array.isArray(data.defaultPrintLocations) &&
          data.defaultPrintLocations.length > 0
            ? data.defaultPrintLocations
            : DEFAULT_PRINT_LOCATIONS,
        quantityMargins: Array.isArray(data.quantityMargins)
          ? data.quantityMargins
          : [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }
  function updatePrintLocation(index, field, value) {
    setSettings((current) => ({
      ...current,
      defaultPrintLocations: current.defaultPrintLocations.map(
        (location, locationIndex) =>
          locationIndex === index
            ? {
                ...location,
                [field]: field === "enabled" ? value : value,
              }
            : location,
      ),
    }));
  }
  function updateGangSheet(index, field, value) {
    setSettings((current) => ({
      ...current,
      gangSheets: current.gangSheets.map((sheet, sheetIndex) =>
        sheetIndex === index
          ? {
              ...sheet,
              [field]: field === "active" ? value : value,
            }
          : sheet,
      ),
    }));
  }

  function addGangSheet() {
    setSettings((current) => ({
      ...current,
      gangSheets: [
        ...current.gangSheets,
        {
          feet: "",
          price: "",
          active: true,
        },
      ],
    }));
  }

  function removeGangSheet(index) {
    setSettings((current) => ({
      ...current,
      gangSheets: current.gangSheets.filter(
        (_, sheetIndex) => sheetIndex !== index,
      ),
    }));
  }

  function updateQuantityMargin(index, field, value) {
    setSettings((current) => ({
      ...current,
      quantityMargins: current.quantityMargins.map((margin, marginIndex) =>
        marginIndex === index
          ? {
              ...margin,
              [field]: value,
            }
          : margin,
      ),
    }));
  }

  function addQuantityMargin() {
    setSettings((current) => ({
      ...current,
      quantityMargins: [
        ...current.quantityMargins,
        {
          minQuantity: "",
          maxQuantity: "",
          percent: "",
        },
      ],
    }));
  }

  function removeQuantityMargin(index) {
    setSettings((current) => ({
      ...current,
      quantityMargins: current.quantityMargins.filter(
        (_, marginIndex) => marginIndex !== index,
      ),
    }));
  }

  async function saveSettings(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/settings/apparel-pricing", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save settings.");
      }

      setSettings({
        ...EMPTY_SETTINGS,
        ...data.settings,

        gangSheets: Array.isArray(data.settings?.gangSheets)
          ? data.settings.gangSheets
          : [],

        defaultPrintLocations:
          Array.isArray(data.settings?.defaultPrintLocations) &&
          data.settings.defaultPrintLocations.length > 0
            ? data.settings.defaultPrintLocations
            : DEFAULT_PRINT_LOCATIONS,

        quantityMargins: Array.isArray(data.settings?.quantityMargins)
          ? data.settings.quantityMargins
          : [],
      });

      setMessage("Apparel pricing settings saved successfully.");

      window.setTimeout(() => {
        setMessage("");
      }, 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-gray-500">
            Loading apparel pricing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={saveSettings} className="mx-auto max-w-7xl p-6 lg:p-8">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/settings"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <Shirt className="h-6 w-6 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Apparel & DTF Pricing
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Configure DTF, labor, shipping and profit calculations.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {message ? (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        <Section
          icon={Calculator}
          title="DTF Calculation"
          description="Select how your DTF transfer cost will be calculated."
        >
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => updateField("dtfPricingMethod", "GANG_SHEET")}
              className={`rounded-xl border p-4 text-left transition ${
                settings.dtfPricingMethod === "GANG_SHEET"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="block font-semibold text-gray-900">
                Gang Sheet
              </span>
              <span className="mt-1 block text-sm text-gray-500">
                Calculate DTF cost using sheet lengths and supplier prices.
              </span>
            </button>

            <button
              type="button"
              onClick={() => updateField("dtfPricingMethod", "SQUARE_FEET")}
              className={`rounded-xl border p-4 text-left transition ${
                settings.dtfPricingMethod === "SQUARE_FEET"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="block font-semibold text-gray-900">
                Square Feet
              </span>
              <span className="mt-1 block text-sm text-gray-500">
                Calculate cost from the total printed square footage.
              </span>
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <NumberInput
              label="DTF cost per square foot"
              value={settings.dtfCostPerSqft}
              onChange={(value) => updateField("dtfCostPerSqft", value)}
              prefix="$"
            />

            <NumberInput
              label="Roll width"
              value={settings.dtfRollWidth}
              onChange={(value) => updateField("dtfRollWidth", value)}
              suffix="in"
              step="0.25"
            />

            <NumberInput
              label="Gap between designs"
              value={settings.dtfGap}
              onChange={(value) => updateField("dtfGap", value)}
              suffix="in"
              step="0.01"
            />
          </div>
        </Section>
        <Section
          icon={Shirt}
          title="Default Print Locations"
          description="Configure the default size and active decoration locations used in the apparel configurator."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="pb-3">Print location</th>
                  <th className="pb-3">Width</th>
                  <th className="pb-3">Height</th>
                  <th className="pb-3 text-center">Enabled by default</th>
                </tr>
              </thead>

              <tbody>
                {settings.defaultPrintLocations.map((location, index) => (
                  <tr key={location.key} className="border-b border-gray-100">
                    <td className="py-4 pr-4">
                      <div className="font-medium text-gray-900">
                        {location.name}
                      </div>
                    </td>

                    <td className="py-4 pr-4">
                      <div className="relative">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={location.width ?? ""}
                          onChange={(event) =>
                            updatePrintLocation(
                              index,
                              "width",
                              event.target.value,
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500">
                          in
                        </span>
                      </div>
                    </td>

                    <td className="py-4 pr-4">
                      <div className="relative">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={location.height ?? ""}
                          onChange={(event) =>
                            updatePrintLocation(
                              index,
                              "height",
                              event.target.value,
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500">
                          in
                        </span>
                      </div>
                    </td>

                    <td className="py-4 text-center">
                      <input
                        type="checkbox"
                        checked={location.enabled === true}
                        onChange={(event) =>
                          updatePrintLocation(
                            index,
                            "enabled",
                            event.target.checked,
                          )
                        }
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Enabled locations will be selected automatically when opening the
            apparel configurator.
          </p>
        </Section>
        <Section
          icon={Shirt}
          title="Gang Sheet Prices"
          description="Enter the available sheet lengths and the price charged by your DTF supplier."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="pb-3">Length</th>
                  <th className="pb-3">Supplier price</th>
                  <th className="pb-3 text-center">Active</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {settings.gangSheets.map((sheet, index) => (
                  <tr
                    key={`${index}-${sheet.feet}`}
                    className="border-b border-gray-100"
                  >
                    <td className="py-3 pr-4">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={sheet.feet ?? ""}
                          onChange={(event) =>
                            updateGangSheet(index, "feet", event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500">
                          ft
                        </span>
                      </div>
                    </td>

                    <td className="py-3 pr-4">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={sheet.price ?? ""}
                          onChange={(event) =>
                            updateGangSheet(index, "price", event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </td>

                    <td className="py-3 text-center">
                      <input
                        type="checkbox"
                        checked={sheet.active !== false}
                        onChange={(event) =>
                          updateGangSheet(index, "active", event.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeGangSheet(index)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700"
                        title="Delete Gang Sheet"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addGangSheet}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Add Gang Sheet
          </button>
        </Section>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section
            icon={DollarSign}
            title="Labor & Setup"
            description="Configure production labor and preparation fees."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <NumberInput
                label="Labor per location"
                value={settings.laborPerLocation}
                onChange={(value) => updateField("laborPerLocation", value)}
                prefix="$"
                description="Charged for every garment decoration location."
              />

              <NumberInput
                label="Setup fee per location"
                value={settings.setupFeePerLocation}
                onChange={(value) => updateField("setupFeePerLocation", value)}
                prefix="$"
              />

              <NumberInput
                label="Minimum setup fee"
                value={settings.minimumSetupFee}
                onChange={(value) => updateField("minimumSetupFee", value)}
                prefix="$"
              />

              <NumberInput
                label="Waste allowance"
                value={settings.wastePercent}
                onChange={(value) => updateField("wastePercent", value)}
                suffix="%"
              />
            </div>
          </Section>

          <Section
            icon={Truck}
            title="Shipping"
            description="Add supplier and transfer delivery costs."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <NumberInput
                label="SanMar shipping"
                value={settings.supplierShippingFlat}
                onChange={(value) => updateField("supplierShippingFlat", value)}
                prefix="$"
                description="Flat shipping charge per order."
              />

              <NumberInput
                label="DTF supplier shipping"
                value={settings.dtfShippingFlat}
                onChange={(value) => updateField("dtfShippingFlat", value)}
                prefix="$"
                description="Flat shipping charge from the DTF supplier."
              />

              <NumberInput
                label="Additional shipping"
                value={settings.shippingPercent}
                onChange={(value) => updateField("shippingPercent", value)}
                suffix="%"
              />
            </div>
          </Section>
        </div>

        <Section
          icon={DollarSign}
          title="Profit & Minimum Prices"
          description="Configure your default pricing method and minimum charges."
        >
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => updateField("pricingMode", "MARKUP")}
              className={`rounded-xl border p-4 text-left transition ${
                settings.pricingMode === "MARKUP"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="block font-semibold text-gray-900">Markup</span>
              <span className="mt-1 block text-sm text-gray-500">
                Selling price = cost + percentage of cost.
              </span>
            </button>

            <button
              type="button"
              onClick={() => updateField("pricingMode", "MARGIN")}
              className={`rounded-xl border p-4 text-left transition ${
                settings.pricingMode === "MARGIN"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="block font-semibold text-gray-900">
                Profit Margin
              </span>
              <span className="mt-1 block text-sm text-gray-500">
                Percentage of the final selling price retained as profit.
              </span>
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <NumberInput
              label={
                settings.pricingMode === "MARGIN"
                  ? "Default profit margin"
                  : "Default markup"
              }
              value={settings.defaultProfitMargin}
              onChange={(value) => updateField("defaultProfitMargin", value)}
              suffix="%"
            />

            <NumberInput
              label="Minimum unit price"
              value={settings.minimumUnitPrice}
              onChange={(value) => updateField("minimumUnitPrice", value)}
              prefix="$"
            />

            <NumberInput
              label="Minimum order price"
              value={settings.minimumOrderPrice}
              onChange={(value) => updateField("minimumOrderPrice", value)}
              prefix="$"
            />
          </div>
        </Section>

        <Section
          icon={Calculator}
          title="Quantity Pricing"
          description="Use different markup or margin percentages according to order quantity."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="pb-3">Minimum quantity</th>
                  <th className="pb-3">Maximum quantity</th>
                  <th className="pb-3">
                    {settings.pricingMode === "MARGIN" ? "Margin" : "Markup"}
                  </th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {settings.quantityMargins.map((margin, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={margin.minQuantity ?? ""}
                        onChange={(event) =>
                          updateQuantityMargin(
                            index,
                            "minQuantity",
                            event.target.value,
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </td>

                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={margin.maxQuantity ?? ""}
                        placeholder="No limit"
                        onChange={(event) =>
                          updateQuantityMargin(
                            index,
                            "maxQuantity",
                            event.target.value,
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </td>

                    <td className="py-3 pr-4">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={margin.percent ?? ""}
                          onChange={(event) =>
                            updateQuantityMargin(
                              index,
                              "percent",
                              event.target.value,
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500">
                          %
                        </span>
                      </div>
                    </td>

                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeQuantityMargin(index)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700"
                        title="Delete quantity range"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addQuantityMargin}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Add Quantity Range
          </button>
        </Section>

        <div className="flex flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={settings.active !== false}
              onChange={(event) => updateField("active", event.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />

            <div>
              <span className="block text-sm font-semibold text-gray-900">
                Apparel pricing active
              </span>
              <span className="block text-xs text-gray-500">
                Enable these settings in the apparel calculator.
              </span>
            </div>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </form>
  );
}
