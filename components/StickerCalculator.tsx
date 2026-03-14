"use client";

import { useEffect, useState } from "react";
import { stickerCalculator } from "@/lib/stickerCalculator";

export default function StickerCalculator() {
  const DEFAULT_WIDTH = 15;
  const DEFAULT_HEIGHT = 11;

  const [settings, setSettings] = useState<any>(null);

  const [useCustom, setUseCustom] = useState(false);

  const [sheetWidth, setSheetWidth] = useState(DEFAULT_WIDTH);
  const [sheetHeight, setSheetHeight] = useState(DEFAULT_HEIGHT);

  const [stickerWidth, setStickerWidth] = useState(2);
  const [stickerHeight, setStickerHeight] = useState(2);

  const [quantity, setQuantity] = useState(100);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const r = await fetch("/api/settings/print-pricing", {
      cache: "no-store",
    });

    const data = await r.json();
    setSettings(data);
  }

  if (!settings) return <p>Loading pricing...</p>;

  const width = useCustom ? settings.vinylRollWidth : sheetWidth;
  const height = useCustom ? 11 : sheetHeight;

  /* CALCULATOR */

  const result = stickerCalculator({
    sheetWidth: width,
    sheetHeight: height,
    stickerWidth,
    stickerHeight,
    quantity,
    settings,
  });

  return (
    <div className="card max-w-xl">
      <h2 className="text-xl font-semibold mb-6">Sticker Calculator PRO</h2>

      {/* SHEET SIZE */}

      <h3 className="font-semibold mb-2">Sheet Size</h3>

      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={!useCustom}
            onChange={() => setUseCustom(false)}
          />
          Default 15 x 11
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={useCustom}
            onChange={() => setUseCustom(true)}
          />
          Custom
        </label>
      </div>

      {!useCustom && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm">Sheet Width</label>

            <input
              type="number"
              value={sheetWidth}
              onChange={(e) => setSheetWidth(Number(e.target.value))}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="text-sm">Sheet Height</label>

            <input
              type="number"
              value={sheetHeight}
              onChange={(e) => setSheetHeight(Number(e.target.value))}
              className="border p-2 rounded w-full"
            />
          </div>
        </div>
      )}

      {/* STICKER SIZE */}

      <h3 className="font-semibold mb-2">Sticker Size</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label>Width</label>

          <input
            type="number"
            value={stickerWidth}
            onChange={(e) => setStickerWidth(Number(e.target.value))}
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label>Height</label>

          <input
            type="number"
            value={stickerHeight}
            onChange={(e) => setStickerHeight(Number(e.target.value))}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      {/* ORDER */}

      <h3 className="font-semibold mb-2">Order</h3>

      <div className="mb-6">
        <label>Quantity</label>

        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="border p-2 rounded w-full"
        />
      </div>

      {/* RESULTS */}

      <h3 className="font-semibold mb-2">Results</h3>
      <div className="space-y-2 text-sm">
        <p>
          Stickers per Sheet: <b>{result.stickersPerSheet}</b>
        </p>

        <p>
          Sheets Needed: <b>{result.sheetsNeeded}</b>
        </p>

        <p>
          Sheet Cost: <b>${result.sheetCost.toFixed(2)}</b>
        </p>

        <p>
          Price per Sticker: <b>${result.pricePerSticker.toFixed(2)}</b>
        </p>
        <p className="text-lg font-bold">
          Total Cost: <b>${result.totalCost.toFixed(2)}</b>
        </p>
      </div>
    </div>
  );
}
