"use client";

import { useEffect, useState } from "react";

export default function BillingSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/settings/billing");
      const data = await res.json();

      setSettings({
        ...data,
        discountRules: data.discountRules ?? [],
        paymentFees: data.paymentFees ?? [],
      });
    }

    load();
  }, []);

  if (!settings) {
    return <p className="p-6">Loading settings…</p>;
  }

  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/settings/billing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Billing Settings</h1>

      {/* TAX */}
      <section className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Tax</h2>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.taxEnabled}
            onChange={(e) => update("taxEnabled", e.target.checked)}
          />
          Enable Tax
        </label>

        <input
          type="number"
          step="0.001"
          className="border rounded px-3 py-2 w-40"
          value={settings.defaultTaxRate}
          onChange={(e) => update("defaultTaxRate", Number(e.target.value))}
        />
      </section>

      {/* DISCOUNT */}
      <section className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Discount Rules</h2>

        {settings.discountRules?.map((d, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 border rounded-lg p-3"
          >
            <input
              type="checkbox"
              checked={d.active}
              onChange={(e) => {
                const copy = [...settings.discountRules];
                copy[idx].active = e.target.checked;
                setSettings({ ...settings, discountRules: copy });
              }}
            />

            <input
              className="border rounded px-2 py-1 w-40"
              value={d.name}
              placeholder="Discount name"
              onChange={(e) => {
                const copy = [...settings.discountRules];
                copy[idx].name = e.target.value;
                setSettings({ ...settings, discountRules: copy });
              }}
            />

            <select
              value={d.type}
              onChange={(e) => {
                const copy = [...settings.discountRules];
                copy[idx].type = e.target.value;
                setSettings({ ...settings, discountRules: copy });
              }}
              className="border rounded px-2 py-1"
            >
              <option value="percent">%</option>
              <option value="fixed">$</option>
            </select>

            <input
              type="number"
              className="border rounded px-2 py-1 w-24"
              value={d.value}
              onChange={(e) => {
                const copy = [...settings.discountRules];
                copy[idx].value = Number(e.target.value);
                setSettings({ ...settings, discountRules: copy });
              }}
            />
          </div>
        ))}

        <button
          onClick={() =>
            setSettings({
              ...settings,
              discountRules: [
                ...(settings.discountRules || []),
                { name: "", type: "percent", value: 0, active: true },
              ],
            })
          }
          className="text-blue-600 text-sm"
        >
          + Add Discount Rule
        </button>
      </section>

      {/* DEPOSIT */}
      <section className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Deposits</h2>

        <label className="text-sm">Default Deposit (%)</label>
        <input
          type="number"
          className="border rounded px-3 py-2 w-40"
          value={settings.defaultDepositPercent}
          onChange={(e) =>
            update("defaultDepositPercent", Number(e.target.value))
          }
        />
      </section>

      <section className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Payment Fees</h2>

        {settings.paymentFees?.map((f, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 border rounded-lg p-3"
          >
            <input
              type="checkbox"
              checked={f.active}
              onChange={(e) => {
                const copy = [...settings.paymentFees];
                copy[idx].active = e.target.checked;
                setSettings({ ...settings, paymentFees: copy });
              }}
            />

            <input
              className="border rounded px-2 py-1 w-40"
              value={f.name}
              placeholder="Fee name"
              onChange={(e) => {
                const copy = [...settings.paymentFees];
                copy[idx].name = e.target.value;
                setSettings({ ...settings, paymentFees: copy });
              }}
            />

            <select
              value={f.type}
              onChange={(e) => {
                const copy = [...settings.paymentFees];
                copy[idx].type = e.target.value;
                setSettings({ ...settings, paymentFees: copy });
              }}
              className="border rounded px-2 py-1"
            >
              <option value="percent">%</option>
              <option value="fixed">$</option>
            </select>

            <input
              type="number"
              className="border rounded px-2 py-1 w-24"
              value={f.value}
              onChange={(e) => {
                const copy = [...settings.paymentFees];
                copy[idx].value = Number(e.target.value);
                setSettings({ ...settings, paymentFees: copy });
              }}
            />
          </div>
        ))}

        <button
          onClick={() =>
            setSettings({
              ...settings,
              paymentFees: [
                ...(settings.paymentFees || []),
                { name: "", type: "percent", value: 0, active: true },
              ],
            })
          }
          className="text-blue-600 text-sm"
        >
          + Add Payment Fee
        </button>
      </section>
      <button
        onClick={save}
        disabled={saving}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}
