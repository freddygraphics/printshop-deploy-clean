import md5 from "md5";

export function calculateLegacySinalitePrice({ options, productData }) {
  if (!productData) return 0;

  const priceData = {};

  // =========================================
  // PRICE MATRIX
  // =========================================

  productData[1].forEach((item) => {
    priceData[item.hash] = item.value;
  });

  let price = 0;
  let multiplier = 1;

  const size = options.size || options.Size;

  const qty = options.qty || options.Qty;

  // =========================================
  // BASE PRICE
  // =========================================

  const baseHash = md5(
    ("#Base price" + "#size#size_" + size + "#qty#qty_" + qty).toLowerCase(),
  );

  if (priceData[baseHash]) {
    price += parseFloat(priceData[baseHash]);
  }

  // =========================================
  // OPTIONS
  // =========================================

  Object.keys(options).forEach((key) => {
    if (key.toLowerCase() === "qty" || key.toLowerCase() === "size") {
      return;
    }

    const normalized = key.toLowerCase();

    const hash = md5(
      (
        "#" +
        normalized +
        "#" +
        normalized +
        "_" +
        options[key] +
        "#size#size_" +
        size +
        "#qty#qty_" +
        qty
      ).toLowerCase(),
    );

    const value = priceData[hash];

    if (value === undefined || value === "-1") {
      return;
    }

    // % multiplier
    if (String(value).startsWith("%")) {
      multiplier += parseFloat(String(value).replace("%", "")) / 100;
    } else {
      price += parseFloat(value) * qty;
    }
  });

  return Number((price * multiplier).toFixed(2));
}
