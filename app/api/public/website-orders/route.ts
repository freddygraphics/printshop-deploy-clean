import { formatOrderNumber } from "@/lib/order-number";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WebsiteOrderItem = {
  productId: number;
  productName: string;
  qty: number;
  price: number;
  image?: string;

  options?: Array<{
    optionKey: string;
    optionName: string;
    valueKey: string;
    valueLabel: string;
    price: number;
    priceType: string;
  }>;

  customization?: {
    type?: string;

    lines?: Array<{
      id?: string;
      label?: string;
      text?: string;
      targetWidth?: number;
      scale?: number;
      calculatedHeight?: number;
    }>;

    font?: string;

    color?: {
      name?: string;
      value?: string;
    };
  };
};

type WebsiteOrderPayload = {
  customer: {
    fullName: string;
    businessName?: string;
    email: string;
    phone?: string;
  };

  fulfillment: {
    method: "pickup" | "shipping";
    address?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
  };

  cart: WebsiteOrderItem[];

  pricing: {
    subtotal: number;
    shippingFee: number;
    salesTax: number;
    total: number;
  };

  squarePayment: {
    id: string;
    status: string;
    receiptUrl?: string;
    orderId?: string;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WebsiteOrderPayload;

    if (!body?.customer?.fullName) {
      return NextResponse.json(
        { error: "Customer name is required." },
        { status: 400 },
      );
    }

    if (!body?.customer?.email) {
      return NextResponse.json(
        { error: "Customer email is required." },
        { status: 400 },
      );
    }

    if (!Array.isArray(body?.cart) || body.cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    if (!body?.squarePayment?.id || body.squarePayment.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Payment is not completed." },
        { status: 400 },
      );
    }

    /*
      FIND OR CREATE CLIENT
    */

    let client = await prisma.client.findFirst({
      where: {
        email: body.customer.email,
        deletedAt: null,
      },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: body.customer.fullName,
          company: body.customer.businessName || null,
          email: body.customer.email,
          phone: body.customer.phone || null,

          ...(body.fulfillment.method === "shipping"
            ? {
                address: body.fulfillment.address || null,
                city: body.fulfillment.city || null,
                state: body.fulfillment.state || null,
                zip: body.fulfillment.zip || null,
                country: "USA",
              }
            : {}),
        },
      });
    } else {
      client = await prisma.client.update({
        where: {
          id: client.id,
        },

        data: {
          name: body.customer.fullName,
          company: body.customer.businessName || null,
          email: body.customer.email,
          phone: body.customer.phone || null,

          ...(body.fulfillment.method === "shipping"
            ? {
                address: body.fulfillment.address || null,
                city: body.fulfillment.city || null,
                state: body.fulfillment.state || null,
                zip: body.fulfillment.zip || null,
                country: "USA",
              }
            : {}),
        },
      });
    }

    /*
      CREATE WEBSITE ORDER
    */

    const order = await prisma.order.create({
      data: {
        clientId: client.id,

        status: "Design",

        priority: "Normal",

        notes: `Website order paid with Square. Payment ID: ${body.squarePayment.id}`,

        customFields: {
          source: "website",

          customer: body.customer,

          fulfillment: body.fulfillment,

          items: body.cart,

          pricing: body.pricing,

          squarePayment: body.squarePayment,

          artworkStatus: body.cart.some((item) =>
            item.options?.some((option) => {
              const optionName = option.optionName?.toLowerCase() || "";

              const valueLabel = option.valueLabel?.toLowerCase() || "";

              return (
                optionName.includes("design") &&
                (valueLabel.includes("own") ||
                  valueLabel.includes("have") ||
                  valueLabel.includes("artwork"))
              );
            }),
          )
            ? "WAITING_FOR_ARTWORK"
            : "DESIGN_REQUIRED",
        },

        workflow: {
          source: "website",
          paymentStatus: "PAID",
          fulfillmentMethod: body.fulfillment.method,
        },
      },
    });
    const orderNumber = formatOrderNumber(order.id);

    const productsHtml = body.cart
      .map((item) => {
        const optionsHtml =
          item.options && item.options.length > 0
            ? `
          <ul style="margin:8px 0 0;padding-left:18px;color:#555;">
            ${item.options
              .map(
                (option) =>
                  `<li><strong>${option.optionName}:</strong> ${option.valueLabel}</li>`,
              )
              .join("")}
          </ul>
        `
            : "";

        const customizationHtml = item.customization
          ? `
    <div
      style="
        margin-top:12px;
        padding:12px;
        background:#f8fafc;
        border:1px solid #e5e7eb;
      "
    >
      <div
        style="
          margin-bottom:8px;
          font-size:13px;
          font-weight:700;
          color:#1D2959;
        "
      >
        CUSTOMIZATION
      </div>

      ${
        item.customization.lines?.length
          ? item.customization.lines
              .map(
                (line) => `
                  <div style="margin-top:8px;color:#555;">
                    <strong>${line.label || "Text"}:</strong>
                    ${line.text || "-"}

                    ${
                      line.targetWidth
                        ? `
                          <br />
                          <span style="font-size:12px;color:#777;">
                            Width: ${line.targetWidth}"
                            ${
                              line.calculatedHeight
                                ? ` × ${line.calculatedHeight.toFixed(2)}"`
                                : ""
                            }
                          </span>
                        `
                        : ""
                    }
                  </div>
                `,
              )
              .join("")
          : ""
      }

      ${
        item.customization.font
          ? `
            <div style="margin-top:8px;color:#555;">
              <strong>Font:</strong>
              ${item.customization.font}
            </div>
          `
          : ""
      }

      ${
        item.customization.color?.name
          ? `
            <div style="margin-top:8px;color:#555;">
              <strong>Color:</strong>
              ${item.customization.color.name}
            </div>
          `
          : ""
      }
    </div>
  `
          : "";
        return `
      <div style="padding:16px 0;border-bottom:1px solid #e5e7eb;">
        <div style="font-size:16px;font-weight:700;color:#1D2959;">
          ${item.productName}
        </div>

        <div style="margin-top:6px;color:#555;">
          Quantity: ${item.qty}
        </div>

        

${optionsHtml}

${customizationHtml}

<div style="margin-top:8px;font-weight:700;">
          $${Number(item.price || 0).toFixed(2)}
        </div>
      </div>
    `;
      })
      .join("");

    const fulfillmentHtml =
      body.fulfillment.method === "shipping"
        ? `
      <p><strong>Shipping</strong></p>
      <p>
        ${body.fulfillment.address || ""}<br />
        ${body.fulfillment.address2 ? `${body.fulfillment.address2}<br />` : ""}
        ${body.fulfillment.city || ""}, ${body.fulfillment.state || ""} ${
          body.fulfillment.zip || ""
        }
      </p>
    `
        : `
      <p><strong>Pickup</strong></p>
      <p>Customer will pick up the completed order at Freddy Graphics.</p>
    `;

    const internalOrderUrl = process.env.PRINTSHOP_PUBLIC_URL
      ? `${process.env.PRINTSHOP_PUBLIC_URL}/website-orders/${order.id}`
      : "";

    const internalEmailHtml = `
  <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;color:#222;">
    <h1 style="color:#1D2959;">
      New Website Order #${orderNumber}
    </h1>

    <p>A new paid website order has been received.</p>

    <h2 style="color:#1D2959;">Customer</h2>

    <p>
      <strong>Name:</strong> ${body.customer.fullName}<br />
      ${
        body.customer.businessName
          ? `<strong>Business:</strong> ${body.customer.businessName}<br />`
          : ""
      }
      <strong>Email:</strong> ${body.customer.email}<br />
      <strong>Phone:</strong> ${body.customer.phone || "-"}
    </p>

    <h2 style="color:#1D2959;">Products</h2>

    ${productsHtml}

    <h2 style="color:#1D2959;">Fulfillment</h2>

    ${fulfillmentHtml}

    <h2 style="color:#1D2959;">Payment</h2>

    <p>
      Subtotal: $${Number(body.pricing.subtotal || 0).toFixed(2)}<br />
      Shipping: ${
        Number(body.pricing.shippingFee || 0) === 0
          ? "FREE"
          : `$${Number(body.pricing.shippingFee || 0).toFixed(2)}`
      }<br />
      NJ Sales Tax: $${Number(body.pricing.salesTax || 0).toFixed(2)}<br />
      <strong>Total Paid: $${Number(body.pricing.total || 0).toFixed(2)}</strong>
    </p>

    <p>
      <strong>Square Payment ID:</strong><br />
      ${body.squarePayment.id}
    </p>

    ${
      internalOrderUrl
        ? `
          <p style="margin-top:25px;">
            <a
              href="${internalOrderUrl}"
              style="
                display:inline-block;
                padding:12px 20px;
                background:#1D2959;
                color:#fff;
                text-decoration:none;
                font-weight:700;
              "
            >
              View Order in Print Shop
            </a>
          </p>
        `
        : ""
    }
  </div>
`;

    const customerEmailHtml = `
  <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;color:#222;">
    <h1 style="color:#1D2959;">
      Thank You for Your Order!
    </h1>

    <p>
      Hi ${body.customer.fullName},
    </p>

    <p>
      Your payment was successfully processed and Freddy Graphics has received your order.
    </p>

    <p>
      <strong>Order #${orderNumber}</strong>
    </p>

    <h2 style="color:#1D2959;">Order Details</h2>

    ${productsHtml}

    <h2 style="color:#1D2959;">Fulfillment</h2>

    ${fulfillmentHtml}

    <h2 style="color:#1D2959;">Payment Summary</h2>

    <p>
      Subtotal: $${Number(body.pricing.subtotal || 0).toFixed(2)}<br />
      Shipping: ${
        Number(body.pricing.shippingFee || 0) === 0
          ? "FREE"
          : `$${Number(body.pricing.shippingFee || 0).toFixed(2)}`
      }<br />
      NJ Sales Tax: $${Number(body.pricing.salesTax || 0).toFixed(2)}<br />
      <strong>Total Paid: $${Number(body.pricing.total || 0).toFixed(2)}</strong>
    </p>

    ${
      body.squarePayment.receiptUrl
        ? `
          <p style="margin-top:25px;">
            <a
              href="${body.squarePayment.receiptUrl}"
              style="
                display:inline-block;
                padding:12px 20px;
                background:#1D2959;
                color:#fff;
                text-decoration:none;
                font-weight:700;
              "
            >
              View Payment Receipt
            </a>
          </p>
        `
        : ""
    }

    <p style="margin-top:30px;color:#555;">
      If your order requires artwork, our team will contact you with the next steps.
    </p>

    <p>
      Thank you,<br />
      <strong>Freddy Graphics</strong>
    </p>
  </div>
`;

    /*
  SEND ORDER EMAILS
*/

    try {
      await Promise.all([
        // Notification for Freddy Graphics
        sendEmail({
          to:
            process.env.ORDER_NOTIFICATION_EMAIL || "orders@freddygraphics.com",

          subject: `New Website Order #${orderNumber}`,

          html: internalEmailHtml,
        }),

        // Confirmation for customer
        sendEmail({
          to: body.customer.email,

          subject: `Freddy Graphics Order Confirmation #${orderNumber}`,

          html: customerEmailHtml,
        }),
      ]);

      console.log(`Website order #${orderNumber} emails sent successfully.`);
    } catch (emailError) {
      /*
    IMPORTANT:
    Do not fail the order if email delivery fails.
    Square has already charged the customer and
    the order has already been created.
  */
      console.error(`Website order #${orderNumber} email error:`, emailError);
    }
    return NextResponse.json({
      success: true,

      order: {
        id: order.id,
        status: order.status,
        createdAt: order.createdAt,
      },

      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
    });
  } catch (error) {
    console.error("Website order creation error:", error);

    return NextResponse.json(
      {
        error: "Could not create website order.",
      },
      { status: 500 },
    );
  }
}
