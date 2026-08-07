"use client";

import StandardProductConfigurator from "@/components/products/configurators/StandardProductConfigurator";
import StickerProductConfigurator from "@/components/products/configurators/StickerProductConfigurator";
import ApparelProductConfigurator from "@/components/products/configurators/ApparelProductConfigurator";
import RaffleTicketProductConfigurator from "@/components/products/configurators/RaffleTicketProductConfigurator";

export default function ProductConfigurator({
  product,
  onChange,
  initialData = null,
}) {
  const category = String(product?.category || "")
    .trim()
    .toLowerCase();

  const templateType = String(product?.templateType || "")
    .trim()
    .toLowerCase();

  const templateSlug = String(product?.template?.slug || "")
    .trim()
    .toLowerCase();

  console.log("PRODUCT CONFIGURATOR:", {
    id: product?.id,
    name: product?.name,
    category,
    templateType,
    templateSlug,
  });

  const productType = String(
    product?.productType ||
      initialData?.product?.productType ||
      initialData?.options?.productType ||
      "",
  )
    .trim()
    .toLowerCase();

  const isSticker =
    category === "stickers" ||
    category === "sticker" ||
    templateType === "stickers" ||
    templateType === "sticker" ||
    templateSlug === "stickers" ||
    templateSlug === "sticker";

  const isApparel =
    productType === "apparel" ||
    category === "apparel" ||
    templateType === "apparel" ||
    templateSlug === "apparel";

  const isRaffleTicket =
    category === "raffle-tickets" ||
    category === "raffle-ticket" ||
    templateType === "raffle-tickets" ||
    templateType === "raffle-ticket" ||
    templateSlug === "raffle-tickets" ||
    templateSlug === "raffle-ticket";

  if (isSticker) {
    return (
      <StickerProductConfigurator
        product={product}
        initialData={initialData}
        onChange={onChange}
      />
    );
  }

  if (isApparel) {
    return (
      <ApparelProductConfigurator
        product={product}
        initialData={initialData}
        onChange={onChange}
      />
    );
  }

  if (isRaffleTicket) {
    return (
      <RaffleTicketProductConfigurator
        product={product}
        initialData={initialData}
        onChange={onChange}
      />
    );
  }

  return (
    <StandardProductConfigurator
      product={product}
      initialData={initialData}
      onChange={onChange}
    />
  );
}
