"use client";

import { useEffect, useState } from "react";

export default function PrintSettings() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings/print-pricing")
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  async function save() {
    await fetch("/api/settings/print-pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    alert("Settings saved");
  }

  if (!settings) return <p>Loading...</p>;

  return (
    <div className="card max-w-2xl">
      <h2 className="text-xl font-semibold mb-6">Print Pricing Settings</h2>

      {/* VINYL */}

      <h3 className="font-semibold mb-2">Sticker Vinyl Roll</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label>Roll Price ($)</label>
          <input
            type="number"
            value={settings.vinylRollPrice}
            onChange={(e) =>
              setSettings({
                ...settings,
                vinylRollPrice: Number(e.target.value),
              })
            }
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label>Roll Width (inches)</label>
          <input
            type="number"
            value={settings.vinylRollWidth}
            onChange={(e) =>
              setSettings({
                ...settings,
                vinylRollWidth: Number(e.target.value),
              })
            }
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label>Roll Length (inches)</label>
          <input
            type="number"
            value={settings.vinylRollLength}
            onChange={(e) =>
              setSettings({
                ...settings,
                vinylRollLength: Number(e.target.value),
              })
            }
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      {/* LAMINATION */}

      <h3 className="font-semibold mb-2">Lamination Roll</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label>Roll Price ($)</label>
          <input
            type="number"
            value={settings.laminateRollPrice}
            onChange={(e) =>
              setSettings({
                ...settings,
                laminateRollPrice: Number(e.target.value),
              })
            }
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label>Roll Width (inches)</label>
          <input
            type="number"
            value={settings.laminateRollWidth}
            onChange={(e) =>
              setSettings({
                ...settings,
                laminateRollWidth: Number(e.target.value),
              })
            }
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label>Roll Length (inches)</label>
          <input
            type="number"
            value={settings.laminateRollLength}
            onChange={(e) =>
              setSettings({
                ...settings,
                laminateRollLength: Number(e.target.value),
              })
            }
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      {/* PRODUCTION */}

      <h3 className="font-semibold mb-2">Production</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label>Labor Per Hour ($)</label>
          <input
            type="number"
            value={settings.laborPerHour}
            onChange={(e) =>
              setSettings({ ...settings, laborPerHour: Number(e.target.value) })
            }
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label>Machine Cost Per Hour ($)</label>
          <input
            type="number"
            value={settings.machineCostPerHour}
            onChange={(e) =>
              setSettings({
                ...settings,
                machineCostPerHour: Number(e.target.value),
              })
            }
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label>Cutting Cost Per Sheet ($)</label>
          <input
            type="number"
            value={settings.cuttingCostPerSheet}
            onChange={(e) =>
              setSettings({
                ...settings,
                cuttingCostPerSheet: Number(e.target.value),
              })
            }
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      {/* INK */}

      <h3 className="font-semibold mb-2">Ink</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label>Ink Cost per SqFt ($)</label>
          <input
            type="number"
            value={settings.inkCostPerSqft}
            onChange={(e) =>
              setSettings({
                ...settings,
                inkCostPerSqft: Number(e.target.value),
              })
            }
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      {/* OTHER */}

      <h3 className="font-semibold mb-2">Other Costs</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label>Waste (%)</label>
          <input
            type="number"
            value={settings.wastePercent}
            onChange={(e) =>
              setSettings({ ...settings, wastePercent: Number(e.target.value) })
            }
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label>Setup Fee ($)</label>
          <input
            type="number"
            value={settings.setupFee}
            onChange={(e) =>
              setSettings({ ...settings, setupFee: Number(e.target.value) })
            }
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label>Minimum Sticker Price ($)</label>
          <input
            type="number"
            value={settings.minimumStickerPrice}
            onChange={(e) =>
              setSettings({
                ...settings,
                minimumStickerPrice: Number(e.target.value),
              })
            }
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      {/* PROFIT */}

      <h3 className="font-semibold mb-2">Profit</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label>Profit Margin (%)</label>
          <input
            type="number"
            value={settings.profitMargin}
            onChange={(e) =>
              setSettings({ ...settings, profitMargin: Number(e.target.value) })
            }
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      <button onClick={save} className="btn-primary">
        Save Settings
      </button>
    </div>
  );
}
