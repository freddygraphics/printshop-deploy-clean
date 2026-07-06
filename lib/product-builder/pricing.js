import { OptionEngine } from "./OptionEngine";

export function calculateOptionPricing({
  optionGroups = [],
  dynamicOptions = {},
  qty = 1,
  qtyPrice = 0,
  width = 0,

  height = 0,

  unit = "in",
}) {
  let total = 0;

  const engine = new OptionEngine(optionGroups);
  const visibleGroups = engine.getVisibleGroups(dynamicOptions);

  visibleGroups.forEach((group) => {
    const fields = group.fields ? group.fields : [group];

    fields.forEach((field) => {
      const selected = dynamicOptions?.[field.key];

      const options = field.options || field.values || [];

      const option = options.find((o) => {
        const optionValue = o.value ?? o.key ?? o.label;
        return optionValue === selected;
      });

      if (!option) return;

      const price = Number(option.price || 0);
      const priceType = option.priceType || "fixed";
      function toInches(value, unit) {
        const v = Number(value) || 0;

        switch (unit) {
          case "ft":
            return v * 12;

          case "cm":
            return v / 2.54;

          case "mm":
            return v / 25.4;

          default:
            return v;
        }
      }
      switch (priceType) {
        case "fixed":
          total += price;
          break;

        case "percent":
          total += (Number(qtyPrice) * price) / 100;
          break;

        case "perQty":
        case "perPiece":
          total += Number(qty) * price;
          break;

        case "perSqft": {
          const w = toInches(width, unit);
          const h = toInches(height, unit);

          if (!w || !h) break;

          const sqft = (w * h) / 144;

          total += sqft * price;

          break;
        }

        default:
          break;
      }
    });
  });

  return Number(total.toFixed(2));
}
