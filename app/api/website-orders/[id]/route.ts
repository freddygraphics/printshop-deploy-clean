import { formatOrderNumber } from "@/lib/order-number";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const { id } = await context.params;

    const orderId = Number(id);

    if (!Number.isInteger(orderId)) {
      return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,

        customFields: {
          path: ["source"],
          equals: "website",
        },
      },

      include: {
        client: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Website order not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      order,
    });
  } catch (error) {
    console.error("Website order detail GET error:", error);

    return NextResponse.json(
      {
        error: "Could not load website order.",
      },
      { status: 500 },
    );
  }
}
export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const { id } = await context.params;

    const orderId = Number(id);

    if (!Number.isInteger(orderId)) {
      return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
    }

    const body = await request.json();

    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,

        customFields: {
          path: ["source"],
          equals: "website",
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Website order not found." },
        { status: 404 },
      );
    }

    const updateData: any = {};
    /*
  SHIPPING TRACKING
*/

    if (body.trackingNumber !== undefined || body.trackingUrl !== undefined) {
      const currentCustomFields =
        existingOrder.customFields &&
        typeof existingOrder.customFields === "object" &&
        !Array.isArray(existingOrder.customFields)
          ? (existingOrder.customFields as any)
          : {};

      updateData.customFields = {
        ...currentCustomFields,

        shipping: {
          ...(currentCustomFields.shipping || {}),

          trackingNumber:
            body.trackingNumber ??
            currentCustomFields.shipping?.trackingNumber ??
            "",

          trackingUrl:
            body.trackingUrl ?? currentCustomFields.shipping?.trackingUrl ?? "",
        },
      };
    }
    /*
      ORDER STATUS
    */
    if (body.status) {
      const allowedStatuses = [
        "Design",
        "Production",
        "Ready",
        "Shipped",
        "Completed",
        "Cancelled",
      ];

      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid order status." },
          { status: 400 },
        );
      }

      /*
  REQUIRE TRACKING BEFORE SHIPPING
*/
      if (body.status === "Shipped") {
        const currentCustomFields =
          existingOrder.customFields &&
          typeof existingOrder.customFields === "object" &&
          !Array.isArray(existingOrder.customFields)
            ? (existingOrder.customFields as any)
            : {};

        const fulfillment = currentCustomFields.fulfillment || {};

        // Only require tracking for shipping orders
        if (fulfillment.method === "shipping") {
          const currentShipping =
            (updateData.customFields as any)?.shipping ||
            currentCustomFields.shipping ||
            {};

          const trackingNumber =
            body.trackingNumber ?? currentShipping.trackingNumber ?? "";

          if (!String(trackingNumber).trim()) {
            return NextResponse.json(
              {
                error:
                  "Tracking number is required before marking this order as Shipped.",
              },
              { status: 400 },
            );
          }
        }
      }

      updateData.status = body.status;

      updateData.completedAt = body.status === "Completed" ? new Date() : null;

      updateData.completedAt = body.status === "Completed" ? new Date() : null;
    }

    /*
      ARTWORK STATUS
    */
    if (body.artworkStatus) {
      const allowedArtworkStatuses = [
        "DESIGN_REQUIRED",
        "WAITING_FOR_ARTWORK",
        "ARTWORK_RECEIVED",
        "APPROVED",
      ];

      if (!allowedArtworkStatuses.includes(body.artworkStatus)) {
        return NextResponse.json(
          { error: "Invalid artwork status." },
          { status: 400 },
        );
      }

      const currentCustomFields =
        existingOrder.customFields &&
        typeof existingOrder.customFields === "object" &&
        !Array.isArray(existingOrder.customFields)
          ? existingOrder.customFields
          : {};

      updateData.customFields = {
        ...(updateData.customFields || currentCustomFields),
        artworkStatus: body.artworkStatus,
      };
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error: "No valid fields were provided.",
        },
        { status: 400 },
      );
    }

    const order = await prisma.order.update({
      where: {
        id: orderId,
      },

      data: updateData,
    });
    const displayOrderNumber = formatOrderNumber(order.id);

    /*
  CUSTOMER STATUS NOTIFICATIONS
*/

    try {
      const customFields =
        existingOrder.customFields &&
        typeof existingOrder.customFields === "object" &&
        !Array.isArray(existingOrder.customFields)
          ? (existingOrder.customFields as any)
          : {};

      const customer = customFields.customer || {};

      const fulfillment = customFields.fulfillment || {};

      const customerEmail = customer.email || null;

      const customerName = customer.fullName || "Customer";

      if (customerEmail && body.status) {
        /*
      READY FOR PICKUP
    */
        if (
          body.status === "Ready" &&
          fulfillment.method === "pickup" &&
          existingOrder.status !== "Ready"
        ) {
          const pickupAddress = "78 Fillmore St, 2nd Floor, Newark, NJ 07105";

          const mapsUrl =
            "https://www.google.com/maps/search/?api=1&query=" +
            encodeURIComponent(pickupAddress);

          await sendEmail({
            to: customerEmail,

            subject: `Your Freddy Graphics Order #${displayOrderNumber} is Ready for Pickup`,

            html: `
      <div
        style="
          font-family:Arial,sans-serif;
          max-width:700px;
          margin:auto;
          color:#222;
        "
      >
        <h1 style="color:#1D2959;">
          Your Order is Ready!
        </h1>

        <p>
          Hi ${customerName},
        </p>

        <p>
          Great news! Your Freddy Graphics order
          <strong>#${displayOrderNumber}</strong>
          is ready for pickup.
        </p>

        <div
          style="
            margin:24px 0;
            padding:22px;
            background:#f5f7fb;
            border:1px solid #e5e7eb;
          "
        >
          <div
            style="
              font-size:18px;
              font-weight:700;
              color:#1D2959;
              margin-bottom:12px;
            "
          >
            Pickup at Freddy Graphics
          </div>

          <p style="margin:0 0 12px;">
            Your order is completed and ready for pickup.
          </p>

          <p style="margin:0;line-height:1.6;">
            <strong>Freddy Graphics LLC</strong><br />
            78 Fillmore St, 2nd Floor<br />
            Newark, NJ 07105
          </p>
        </div>

        <p style="margin-top:24px;">
          <a
            href="${mapsUrl}"
            target="_blank"
            style="
              display:inline-block;
              padding:14px 22px;
              background:#1D2959;
              color:#ffffff;
              text-decoration:none;
              font-weight:700;
              border-radius:4px;
            "
          >
            Get Directions
          </a>
        </p>

        <p style="margin-top:28px;">
          Please bring your order number
          <strong>#${displayOrderNumber}</strong>
          when you arrive.
        </p>

        <p>
          Thank you for choosing Freddy Graphics.
        </p>

        <p>
          <strong>Freddy Graphics</strong>
        </p>
      </div>
    `,
          });
        }

        /*
      SHIPPED
    */

        if (
          body.status === "Shipped" &&
          fulfillment.method === "shipping" &&
          existingOrder.status !== "Shipped"
        ) {
          const shippingInfo = customFields.shipping || {};

          const trackingNumber = shippingInfo.trackingNumber || "";

          const trackingUrl = shippingInfo.trackingUrl || "";
          await sendEmail({
            to: customerEmail,

            subject: `Your Freddy Graphics Order #${displayOrderNumber} Has Shipped`,

            html: `
    <div
      style="
        font-family:Arial,sans-serif;
        max-width:700px;
        margin:auto;
        color:#222;
      "
    >
      <h1 style="color:#1D2959;">
        Your Order Has Shipped!
      </h1>

      <p>
        Hi ${customerName},
      </p>

      <p>
        Your Freddy Graphics order
        <strong>#${displayOrderNumber}</strong>
        has been shipped.
      </p>

      <h2 style="color:#1D2959;">
        Shipping Address
      </h2>

      <div
        style="
          margin:20px 0;
          padding:18px;
          background:#f5f7fb;
          border:1px solid #e5e7eb;
        "
      >
        ${fulfillment.address || ""}<br />

        ${fulfillment.address2 ? `${fulfillment.address2}<br />` : ""}

        ${fulfillment.city || ""},
        ${fulfillment.state || ""}
        ${fulfillment.zip || ""}
      </div>

      ${
        trackingNumber
          ? `
            <h2 style="color:#1D2959;">
              Tracking Information
            </h2>

            <div
              style="
                margin:20px 0;
                padding:18px;
                background:#f5f7fb;
                border:1px solid #e5e7eb;
              "
            >
              <strong>Tracking Number:</strong><br />
              ${trackingNumber}
            </div>
          `
          : ""
      }

      ${
        trackingUrl
          ? `
            <p style="margin-top:24px;">
              <a
                href="${trackingUrl}"
                target="_blank"
                style="
                  display:inline-block;
                  padding:14px 22px;
                  background:#1D2959;
                  color:#ffffff;
                  text-decoration:none;
                  font-weight:700;
                  border-radius:4px;
                "
              >
                Track Your Package
              </a>
            </p>
          `
          : ""
      }

      <p style="margin-top:28px;">
        Thank you for choosing Freddy Graphics.
      </p>

      <p>
        <strong>Freddy Graphics</strong>
      </p>
    </div>
  `,
          });
        }
      }
    } catch (emailError) {
      console.error(
        `Website order #${displayOrderNumber} status email error:`,
        emailError,
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Website order PATCH error:", error);

    return NextResponse.json(
      {
        error: "Could not update website order.",
      },
      { status: 500 },
    );
  }
}
