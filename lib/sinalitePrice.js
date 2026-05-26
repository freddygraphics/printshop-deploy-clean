import md5 from "md5";

export function calculateSinalitePrice(options, priceData) {
  let price = 0;

  const qty = options.qty;
  const size = options.size;

  Object.keys(options).forEach((key) => {
    if (["qty", "size"].includes(key)) return;

    const hashString =
      `#${key}` +
      `#${key}_${options[key]}` +
      `#size#size_${size}` +
      `#qty#qty_${qty}`;

    const hash = md5(hashString.toLowerCase());

    if (priceData[hash]) {
      price += parseFloat(priceData[hash]);
    }
  });

  return price;
}
