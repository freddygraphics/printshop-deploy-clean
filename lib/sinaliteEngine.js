import md5 from "md5";

export function calculateSinalitePrice({
  options,
  priceData,
  optionMap,
  metadata = {},
}) {
  let price = 0;
  let multiplier = 1;

  const sizeId = options.size || options.Size;

  const qtyId =
    options.qty || options.Qty || options.quantity || options.Quantity;

  const size = optionMap[sizeId];
  const qty = optionMap[qtyId] || qtyId;

  // =====================================
  // BASE PRICE
  // =====================================

  const baseHash = md5(
    ("#Base price" + "#size#size_" + size + "#qty#qty_" + qty).toLowerCase(),
  );

  if (priceData[baseHash]) {
    price += parseFloat(priceData[baseHash]);
  }

  // =====================================
  // OPTIONS
  // =====================================

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
      price += parseFloat(value);
    }
  });

  return Number((price * multiplier).toFixed(2));
}
