import { NextResponse } from "next/server";

import { getHubProduct, getHubInventory, getHubPricing } from "@/lib/onesource";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function GET(
  req: Request,
  ctx: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const { id } = await ctx.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID is required",
        },
        {
          status: 400,
        },
      );
    }

    /* =====================================================
       FETCH PRODUCT + INVENTORY + PPC
    ===================================================== */

    const [raw, inventoryRaw, pricingRaw] = await Promise.all([
      getHubProduct(id),
      getHubInventory(id),
      getHubPricing(id),
    ]);

    /* =====================================================
       PRODUCT
    ===================================================== */

    const product = raw?.Product ?? raw;

    if (!product?.productId) {
      console.error("Unexpected Hub product:", JSON.stringify(raw, null, 2));

      throw new Error("Invalid Hub product response");
    }

    /* =====================================================
       RAW PRODUCT PARTS
    ===================================================== */

    const rawParts = asArray(product?.ProductPartArray?.ProductPart);

    /* =====================================================
       INVENTORY
    ===================================================== */

    const inventoryReply = inventoryRaw?.Reply ?? inventoryRaw;

    const inventoryItems = asArray(
      inventoryReply?.ProductVariationInventoryArray?.ProductVariationInventory,
    );

    const inventoryMap = new Map<
      string,
      {
        quantityAvailable: number;
        message: string | null;
        validTimestamp: string | null;
      }
    >(
      inventoryItems.map((item: any) => [
        String(item?.partID ?? ""),
        {
          quantityAvailable: Number(item?.quantityAvailable ?? 0),

          message: item?.customProductMessage ?? null,

          validTimestamp: item?.validTimestamp ?? null,
        },
      ]),
    );

    /* =====================================================
       PPC CONFIGURATION
    ===================================================== */

    const pricingConfiguration = pricingRaw?.Configuration ?? pricingRaw;

    const pricingParts = asArray(pricingConfiguration?.PartArray?.Part);

    /* =====================================================
       NET PRICING BY PART
    ===================================================== */

    const netPricingByPart = new Map<
      string,
      Array<{
        quantity: number;
        price: number;
        discountCode: string | null;
        uom: string | null;
      }>
    >(
      pricingParts.map((pricingPart: any) => {
        const prices = asArray(pricingPart?.PartPriceArray?.PartPrice).map(
          (price: any) => ({
            quantity: Number(price?.minQuantity ?? 0),

            price: Number(price?.price ?? 0),

            discountCode: price?.discountCode ?? null,

            uom: price?.priceUom ?? null,
          }),
        );

        return [String(pricingPart?.partId ?? ""), prices];
      }),
    );

    /* =====================================================
       GENERAL NET PRICING
       Se usa el primer part como precio general.
       En producto 328 todos tienen los mismos breaks.
    ===================================================== */

    const firstPricingPart = pricingParts[0];

    const netPricing = asArray(firstPricingPart?.PartPriceArray?.PartPrice).map(
      (price: any) => ({
        quantity: Number(price?.minQuantity ?? 0),

        price: Number(price?.price ?? 0),

        discountCode: price?.discountCode ?? null,

        uom: price?.priceUom ?? null,
      }),
    );

    /* =====================================================
       PPC DECORATION LOCATIONS
    ===================================================== */

    const rawLocations = asArray(pricingConfiguration?.LocationArray?.Location);

    const decorationLocations = rawLocations.map((location: any) => {
      const rawDecorations = asArray(location?.DecorationArray?.Decoration);

      const decorations = rawDecorations.map((decoration: any) => {
        const rawCharges = asArray(decoration?.ChargeArray?.Charge);

        const charges = rawCharges.map((charge: any) => {
          const prices = asArray(charge?.ChargePriceArray?.ChargePrice).map(
            (price: any) => ({
              quantity: Number(price?.xMinQty ?? 0),

              price: Number(price?.price ?? 0),

              repeatPrice:
                price?.repeatPrice != null ? Number(price.repeatPrice) : null,

              discountCode: price?.discountCode ?? null,

              uom: price?.xUom ?? null,

              effectiveDate:
                typeof price?.priceEffectiveDate === "string"
                  ? price.priceEffectiveDate
                  : null,

              expiryDate:
                typeof price?.priceExpiryDate === "string"
                  ? price.priceExpiryDate
                  : null,
            }),
          );

          return {
            id: Number(charge?.chargeId ?? 0),

            name: charge?.chargeName ?? null,

            description: charge?.chargeDescription ?? null,

            type: charge?.chargeType ?? null,

            prices,
          };
        });

        return {
          id: Number(decoration?.decorationId ?? 0),

          name: decoration?.decorationName ?? null,

          geometry: decoration?.decorationGeometry ?? null,

          width:
            decoration?.decorationWidth != null
              ? Number(decoration.decorationWidth)
              : null,

          height:
            decoration?.decorationHeight != null
              ? Number(decoration.decorationHeight)
              : null,

          diameter:
            typeof decoration?.decorationDiameter === "number"
              ? Number(decoration.decorationDiameter)
              : null,

          uom: decoration?.decorationUom ?? null,

          charges,
        };
      });

      return {
        locationId: Number(location?.locationId ?? 0),

        name: location?.locationName ?? null,

        defaultLocation: location?.defaultLocation ?? false,

        decorations,
      };
    });

    /* =====================================================
       VARIANTS
    ===================================================== */

    const variants = rawParts.map((part: any) => {
      const color = part?.primaryColor?.Color ?? part?.ColorArray?.Color ?? {};

      const colorName = color?.colorName ?? part?.description ?? null;

      let inkColor: string | null = null;

      if (
        typeof colorName === "string" &&
        colorName.toLowerCase().includes("black ink")
      ) {
        inkColor = "Black";
      }

      if (
        typeof colorName === "string" &&
        colorName.toLowerCase().includes("blue ink")
      ) {
        inkColor = "Blue";
      }

      const partId = String(part?.partId ?? "");

      const inventory = inventoryMap.get(partId);

      const variantNetPricing = netPricingByPart.get(partId) ?? [];

      const shippingPackage = part?.ShippingPackageArray?.ShippingPackage;

      return {
        partId,

        description: part?.description ?? null,

        colorName,

        standardColor: color?.standardColorName ?? null,

        hex: color?.hex ? `#${String(color.hex).replace("#", "")}` : null,

        inkColor,

        stock: inventory?.quantityAvailable ?? 0,

        stockMessage: inventory?.message ?? null,

        stockUpdatedAt: inventory?.validTimestamp ?? null,

        netPricing: variantNetPricing,

        leadTime: part?.leadTime ?? null,

        material: part?.primaryMaterial ?? null,

        countryOfOrigin: part?.countryOfOrigin ?? null,

        package: shippingPackage
          ? {
              type: shippingPackage?.packageType ?? null,

              description: shippingPackage?.description ?? null,

              quantity: Number(shippingPackage?.quantity ?? 0),

              weight: Number(shippingPackage?.weight ?? 0),

              weightUom: shippingPackage?.weightUom ?? null,

              length: Number(shippingPackage?.depth ?? 0),

              width: Number(shippingPackage?.width ?? 0),

              height: Number(shippingPackage?.height ?? 0),

              dimensionUom: shippingPackage?.dimensionUom ?? null,
            }
          : null,
      };
    });

    /* =====================================================
       PUBLISHED PRICE BREAKS
       Estos son precios publicados/list.
       NO son nuestros costos NET.
    ===================================================== */

    const priceGroups = asArray(
      product?.ProductPriceGroupArray?.ProductPriceGroup,
    );

    const blankPriceGroup = priceGroups.find(
      (group: any) =>
        typeof group?.groupName === "string" &&
        group.groupName.toLowerCase().includes("blank"),
    );

    const rawPrices = asArray(blankPriceGroup?.ProductPriceArray?.ProductPrice);

    const publishedPricing = rawPrices.map((price: any) => ({
      quantity: Number(price?.quantityMin ?? 0),

      price: Number(price?.price ?? 0),

      discountCode: price?.discountCode ?? null,
    }));

    /* =====================================================
       CATEGORY
    ===================================================== */

    const category = product?.ProductCategoryArray?.ProductCategory;

    /* =====================================================
       FOB
    ===================================================== */

    const fobRaw = product?.FobPointArray?.FobPoint;

    const fob = fobRaw
      ? {
          id: fobRaw?.fobId ?? null,

          city: fobRaw?.fobCity ?? null,

          state: fobRaw?.fobState ?? null,

          postalCode: fobRaw?.fobPostalCode ?? null,

          country: fobRaw?.fobCountry ?? null,
        }
      : null;

    /* =====================================================
       NORMALIZED RESPONSE
    ===================================================== */

    const normalized = {
      supplier: "Hub",

      productId: String(product.productId),

      name: product.productName ?? null,

      description: product.description ?? null,

      image: product.primaryImageUrl ?? null,

      category: category?.category ?? null,

      subCategory: category?.subCategory ?? null,

      leadTime: variants[0]?.leadTime ?? null,

      material: variants[0]?.material ?? null,

      publishedPricing,

      netPricing,

      decorationLocations,

      variants,

      fob,
    };

    return NextResponse.json({
      success: true,
      product: normalized,
    });
  } catch (error) {
    console.error("Hub product error:", error);

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error ? error.message : "Unable to load Hub product",
      },
      {
        status: 500,
      },
    );
  }
}
