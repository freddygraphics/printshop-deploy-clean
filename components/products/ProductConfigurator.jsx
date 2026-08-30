"use client";

import StandardProductConfigurator from "@/components/products/configurators/StandardProductConfigurator";
import StickerProductConfigurator from "@/components/products/configurators/StickerProductConfigurator";
import ApparelProductConfigurator from "@/components/products/configurators/ApparelProductConfigurator";
import RaffleTicketProductConfigurator from "@/components/products/configurators/RaffleTicketProductConfigurator";
import YardSignProductConfigurator from "@/components/products/configurators/YardSignProductConfigurator";

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

  const productType = String(
    product?.productType ||
      initialData?.product?.productType ||
      initialData?.options?.productType ||
      "",
  )
    .trim()
    .toLowerCase();

  console.log("PRODUCT CONFIGURATOR:", {
    id: product?.id,
    name: product?.name,
    category,
    templateType,
    productType,
  });

  const isSticker =
    category === "stickers" ||
    category === "sticker" ||
    templateType === "stickers" ||
    templateType === "sticker";

  const isApparel =
    productType === "apparel" ||
    category === "apparel" ||
    templateType === "apparel";

  const isRaffleTicket =
    category === "raffle-tickets" ||
    category === "raffle-ticket" ||
    templateType === "raffle-tickets" ||
    templateType === "raffle-ticket";

  const isYardSign =
    productType === "yard-sign" ||
    productType === "yard-signs" ||
    category === "yard-sign" ||
    category === "yard-signs" ||
    templateType === "yard-sign" ||
    templateType === "yard-signs" ||
    templateType === "large-format";

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

  if (isYardSign) {
    return (
      <YardSignProductConfigurator
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
