"use client";

import { useEffect, useState } from "react";
import { Save, Truck, CheckCircle2, AlertCircle } from "lucide-react";

export default function SupplierPricingSettingsPage() {
  const [markup, setMarkup] = useState(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  /* =====================================================
     LOAD
  ===================================================== */

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setMessage(null);

        const response = await fetch(
          "/api/settings/supplier-pricing?supplier=Hub",
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "Unable to load supplier settings");
        }

        setMarkup(Number(data.settings.markup ?? 50));
      } catch (error) {
        console.error(error);

        setMessage({
          type: "error",
          text: "Unable to load Hub pricing settings.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  /* =====================================================
     SAVE
  ===================================================== */

  async function saveSettings() {
    try {
      setSaving(true);
      setMessage(null);

      const numericMarkup = Number(markup);

      if (!Number.isFinite(numericMarkup) || numericMarkup < 0) {
        setMessage({
          type: "error",
          text: "Markup must be 0 or greater.",
        });

        return;
      }

      const response = await fetch("/api/settings/supplier-pricing", {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          supplier: "Hub",
          markup: numericMarkup,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Unable to save supplier settings");
      }

      setMarkup(Number(data.settings.markup));

      setMessage({
        type: "success",
        text: "Hub pricing settings saved successfully.",
      });
    } catch (error) {
      console.error(error);

      setMessage({
        type: "error",
        text: "Unable to save Hub pricing settings.",
      });
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <div className="text-sm text-gray-500">Loading supplier pricing...</div>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="mx-auto max-w-5xl p-8">
      {/* HEADER */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Supplier Pricing</h1>

        <p className="mt-2 text-gray-500">
          Configure the default markup used for supplier products.
        </p>
      </div>

      {/* MESSAGE */}

      {message && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}

          {message.text}
        </div>
      )}

      {/* HUB */}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Supplier header */}

        <div className="flex items-center gap-4 border-b border-gray-200 px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <Truck className="h-5 w-5 text-blue-600" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Hub</h2>

            <p className="text-sm text-gray-500">
              HPG / Hub promotional products
            </p>
          </div>
        </div>

        {/* Settings */}

        <div className="p-6">
          <div className="max-w-lg">
            <label
              htmlFor="hub-markup"
              className="block text-sm font-semibold text-gray-900"
            >
              Default Markup
            </label>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              Percentage added to the supplier NET cost when calculating the
              customer price.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <div className="relative w-40">
                <input
                  id="hub-markup"
                  type="number"
                  min="0"
                  step="1"
                  value={markup}
                  onChange={(e) => setMarkup(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  %
                </span>
              </div>
            </div>

            {/* Example */}

            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Example
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Supplier Cost</span>

                  <span className="font-medium text-gray-900">$100.00</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Markup ({Number(markup) || 0}%)
                  </span>

                  <span className="font-medium text-gray-900">
                    ${(100 * ((Number(markup) || 0) / 100)).toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">
                      Customer Price
                    </span>

                    <span className="font-semibold text-gray-900">
                      ${(100 * (1 + (Number(markup) || 0) / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}

        <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>
    </div>
  );
}
