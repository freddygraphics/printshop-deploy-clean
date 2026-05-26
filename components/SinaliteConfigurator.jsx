"use client";

import { useEffect, useState } from "react";
import { calculateSinalitePrice } from "@/lib/sinaliteEngine";
import { calculateLegacySinalitePrice } from "@/lib/sinaliteLegacyEngine";

export default function SinaliteConfigurator({ product, onAdd }) {
  const config = product?.sinaliteOptions || {};
  const [productData, setProductData] = useState(null);
  const [options, setOptions] = useState({});
  const [quantity, setQuantity] = useState(1);

  const [price, setPrice] = useState(null);

  const [loadingPrice, setLoadingPrice] = useState(false);
  const [groups, setGroups] = useState([]);

  // =====================================================
  // 🔥 DEFAULT OPTIONS
  // =====================================================

  useEffect(() => {
    if (!product?.sinaliteId) return;

    const loadProduct = async () => {
      try {
        setLoadingPrice(true);

        const res = await fetch(`/api/sinalite/product/${product.sinaliteId}`);

        const data = await res.json();
        setProductData(data);

        console.log("🔥 PRODUCT DATA:", data);

        // =========================================
        // GROUP OPTIONS
        // =========================================

        const grouped = {};

        data[0].forEach((item) => {
          if (!grouped[item.group]) {
            grouped[item.group] = [];
          }

          grouped[item.group].push(item);
        });

        const finalGroups = Object.entries(grouped).map(([name, options]) => ({
          name,
          options,
        }));

        setGroups(finalGroups);

        // =========================================
        // DEFAULT OPTIONS
        // =========================================

        const defaults = {};

        finalGroups.forEach((group) => {
          defaults[group.name] = group.options[0].name;
        });

        setOptions(defaults);

        // =========================================
        // PRICE MATRIX
        // =========================================
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPrice(false);
      }
    };

    loadProduct();
  }, [product]);
  useEffect(() => {
    if (!productData) return;

    if (Object.keys(options).length === 0) return;

    const calculate = () => {
      const total = calculateLegacySinalitePrice({
        options,
        productData,
      });

      console.log("🔥 FINAL PRICE:", total);

      setPrice({
        total,
      });
    };
    calculate();
  }, [options, productData]);
  // =====================================================

  // =====================================================
  // 🔥 ADD TO INVOICE
  // =====================================================

  const addToInvoice = () => {
    const finalPrice =
      Number(
        price?.total || price?.price || price?.cost || price?.data?.total || 0,
      ) * Number(product.profitMargin || 1.5);

    onAdd({
      name: product.name,

      qty: Number(quantity),

      unitPrice: finalPrice,

      total: finalPrice,

      options,
    });
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="space-y-6">
      {/* ===================================================== */}
      {/* 🔥 OPTIONS */}
      {/* ===================================================== */}
      <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
      {groups.map((group) => (
        <div key={group.name}>
          <label className="text-xs font-semibold capitalize">
            {group.name}
          </label>

          <select
            value={options[group.name] || ""}
            onChange={(e) =>
              setOptions({
                ...options,
                [group.name]: e.target.value,
              })
            }
            className="border rounded-lg p-2 w-full mt-1"
          >
            {group.options.map((option) => (
              <option key={option.id} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* ===================================================== */}
      {/* 🔥 QTY */}
      {/* ===================================================== */}

      {/* ===================================================== */}
      {/* 🔥 LIVE PRICE */}
      {/* ===================================================== */}

      {loadingPrice && (
        <div className="text-sm text-gray-500">Calculating live price...</div>
      )}

      {price && !loadingPrice && (
        <div className="border-t pt-4">
          <p className="text-sm">
            Cost: $
            {Number(
              price?.total ||
                price?.price ||
                price?.cost ||
                price?.data?.total ||
                0,
            ).toFixed(2)}
          </p>

          <p className="text-lg font-semibold text-blue-600">
            Sell: $
            {(
              Number(
                price?.total ||
                  price?.price ||
                  price?.cost ||
                  price?.data?.total ||
                  0,
              ) * Number(product.profitMargin || 1.5)
            ).toFixed(2)}
          </p>

          <button
            onClick={addToInvoice}
            className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Add to Invoice
          </button>
        </div>
      )}
    </div>
  );
}
