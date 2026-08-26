"use client";

import ProductImage from "./sections/ProductImage";
import ProductHeader from "./sections/ProductHeader";
import QuantityPricing from "./sections/QuantityPricing";
import OptionGroups from "./sections/OptionGroups";
import Inventory from "./sections/Inventory";
import Measurements from "./sections/Measurements";
export default function SectionRenderer({ section, product, update }) {
  switch (section) {
    case "image":
      return (
        <ProductImage
          value={product.image}
          images={product.images || []}
          onChange={(image) => update({ image })}
          onImagesChange={(images) => update({ images })}
        />
      );

    case "header":
      return <ProductHeader product={product} onChange={update} />;

    case "pricing":
      return (
        <QuantityPricing
          rows={product.quantityPricing}
          onChange={(rows) => update({ quantityPricing: rows })}
        />
      );

    case "options":
      return (
        <OptionGroups
          groups={product.optionGroups}
          onChange={(groups) => update({ optionGroups: groups })}
        />
      );
    case "measurements":
      return (
        <Measurements
          value={product.measurements}
          onChange={(measurements) => update({ measurements })}
        />
      );
    case "inventory":
      return (
        <Inventory
          value={product.inventory}
          onChange={(inventory) => update({ inventory })}
        />
      );

    case "supplier":
      return <div className="rounded-xl border p-6">Supplier Section</div>;

    default:
      return null;
  }
}
