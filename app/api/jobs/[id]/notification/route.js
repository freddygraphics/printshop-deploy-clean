export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { sendEmail } from "@/lib/mailer";

export async function POST(req, context) {
  try {
    const { id } = await context.params;
    const jobId = Number(id);

    const body = await req.json();

    const method = body?.method;
    const trackingNumber = body?.trackingNumber?.trim();

    // --------------------------------------------------
    // VALIDAR METHOD
    // --------------------------------------------------

    if (!["pickup", "shipping"].includes(method)) {
      return NextResponse.json(
        {
          error: "Invalid fulfillment method",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------
    // BUSCAR JOB
    // --------------------------------------------------

    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
      },

      include: {
        client: true,

        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          error: "Job not found",
        },
        {
          status: 404,
        },
      );
    }

    // --------------------------------------------------
    // SOLO PERMITIR SI EL JOB ESTÁ READY
    // --------------------------------------------------

    if (job.status !== "Ready") {
      return NextResponse.json(
        {
          error: "Job must be Ready before sending notification.",
        },
        {
          status: 400,
        },
      );
    }

    const customerEmail = job.client?.email?.trim();

    if (!customerEmail) {
      return NextResponse.json(
        {
          error: "Customer does not have an email address.",
        },
        {
          status: 400,
        },
      );
    }

    const customerName = job.client?.name || "Customer";
    const jobNumber = job.jobNumber;

    // ==================================================
    // READY FOR PICKUP
    // ==================================================

    if (method === "pickup") {
      // Evitar email duplicado
      if (job.readyNotifiedAt) {
        return NextResponse.json({
          success: true,
          alreadySent: true,
          method: "pickup",
          message: "Pickup notification was already sent.",
        });
      }

      const pickupAddress = "78 Fillmore St, 2nd Floor, Newark, NJ 07105";

      const mapsUrl =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(pickupAddress);

      // ------------------------------------------------
      // ENVIAR EMAIL PICKUP
      // ------------------------------------------------

      await sendEmail({
        to: customerEmail,

        subject: `Your Freddy Graphics Order #${jobNumber} is Ready for Pickup`,

        html: `
    <div
      style="
        font-family: Arial, Helvetica, sans-serif;
  width: 100%;
max-width: 900px;
margin: 0;
        color: #222222;
        background: #ffffff;
      "
    >
      <!-- HEADER -->
     

      <!-- CONTENT -->
<div style="padding: 8px;">
        <h1
          style="
            margin: 0 0 22px;
            color: #1D2959;
            font-size: 26px;
          "
        >
          Your Order is Ready!
        </h1>

 

        <p
          style="
            font-size: 16px;
            line-height: 1.7;
            margin: 0 0 24px;
          "
        >
          Great news! Your Freddy Graphics order
          <strong>#${jobNumber}</strong> is ready for pickup.
        </p>


        <!-- PICKUP LOCATION -->
        <div
          style="
            margin: 24px 0;
            padding: 16px;
            background: #f5f7fb;
            border: 1px solid #e5e7eb;
          "
        >
          <div
            style="
              color: #1D2959;
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 12px;
            "
          >
            Pickup Location
          </div>

          <p
            style="
              margin: 0;
              font-size: 15px;
              line-height: 1.7;
            "
          >
            <strong>Freddy Graphics LLC</strong><br />
            78 Fillmore St, 2nd Floor<br />
            Newark, NJ 07105
          </p>
        </div>

        <!-- BUSINESS HOURS -->
        <div
          style="
            margin: 24px 0;
            padding: 16px;
            border: 1px solid #e5e7eb;
          "
        >
          <div
            style="
              color: #1D2959;
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 16px;
            "
          >
            Pickup Hours
          </div>

          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
              font-size: 15px;
              line-height: 1.6;
              border-collapse: collapse;
            "
          >
            <tr>
              <td
                style="
                  padding: 8px 0;
                  font-weight: 700;
                "
              >
                Monday – Friday
              </td>

              <td
                style="
                  padding: 8px 0;
                  text-align: right;
                "
              >
                9:30 AM – 6:00 PM
              </td>
            </tr>

            <tr>
              <td style="padding: 4px 0;">
                Lunch Break
              </td>

              <td
                style="
                  padding: 4px 0;
                  text-align: right;
                "
              >
                12:00 PM – 1:00 PM
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 12px 0 8px;
                  font-weight: 700;
                "
              >
                Saturday
              </td>

              <td
                style="
                  padding: 12px 0 8px;
                  text-align: right;
                "
              >
                10:00 AM – 5:00 PM
              </td>
            </tr>

            <tr>
              <td style="padding: 4px 0;">
                Lunch Break
              </td>

              <td
                style="
                  padding: 4px 0;
                  text-align: right;
                "
              >
                12:00 PM – 1:00 PM
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 12px 0 0;
                  font-weight: 700;
                "
              >
                Sunday
              </td>

              <td
                style="
                  padding: 12px 0 0;
                  text-align: right;
                "
              >
                Closed
              </td>
            </tr>
          </table>
        </div>

        <!-- DIRECTIONS -->
        <div style="margin: 28px 0;">
          <a
            href="${mapsUrl}"
            target="_blank"
            style="
              display: inline-block;
              padding: 14px 24px;
              background: #1D2959;
              color: #ffffff;
              text-decoration: none;
              font-size: 15px;
              font-weight: 700;
              border-radius: 5px;
            "
          >
            Get Directions
          </a>
        </div>

        <p
          style="
            margin-top: 28px;
            font-size: 15px;
            line-height: 1.7;
          "
        >
          Please have your order number
          <strong>#${jobNumber}</strong>
          available when you arrive.
        </p>

        <p
          style="
            margin-top: 22px;
            font-size: 15px;
            line-height: 1.7;
          "
        >
          Thank you for choosing Freddy Graphics!
        </p>

        <p
          style="
            margin-top: 22px;
            font-size: 15px;
          "
        >
          <strong>Freddy Graphics LLC</strong>
        </p>
      </div>

      <!-- FOOTER -->
      <div
        style="
          padding: 20px 32px;
          background: #f5f7fb;
          color: #777777;
          text-align: center;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
        "
      >
        Freddy Graphics LLC · Newark, New Jersey
      </div>
    </div>
  `,
      });
      // ------------------------------------------------
      // GUARDAR QUE ES PICKUP + EMAIL ENVIADO
      // ------------------------------------------------

      const updatedJob = await prisma.job.update({
        where: {
          id: jobId,
        },

        data: {
          fulfillmentMethod: "pickup",
          readyNotifiedAt: new Date(),
          trackingNumber: null,
        },
      });

      console.log(`✅ PICKUP notification sent for Job #${jobNumber}`);

      return NextResponse.json({
        success: true,
        method: "pickup",
        message: "Pickup notification sent.",
        job: updatedJob,
      });
    }

    // ==================================================
    // SHIPPING
    // ==================================================

    if (method === "shipping") {
      // ------------------------------------------------
      // VALIDAR TRACKING
      // ------------------------------------------------

      if (!trackingNumber) {
        return NextResponse.json(
          {
            error: "Tracking number is required.",
          },
          {
            status: 400,
          },
        );
      }

      // ------------------------------------------------
      // EVITAR EMAIL DUPLICADO
      // ------------------------------------------------

      if (job.shippingNotifiedAt) {
        return NextResponse.json({
          success: true,
          alreadySent: true,
          method: "shipping",
          trackingNumber: job.trackingNumber,
          message: "Shipping notification was already sent.",
        });
      }

      // ------------------------------------------------
      // ENVIAR EMAIL SHIPPING
      // ------------------------------------------------

      await sendEmail({
        to: customerEmail,

        subject: `Your Freddy Graphics Order #${jobNumber} Has Shipped`,

        html: `
          <div
            style="
              font-family: Arial, Helvetica, sans-serif;
              width: 100%;
              max-width: 900px;
              margin: 0;
              color: #222222;
              background: #ffffff;
            "
          >

            <div style="padding: 8px;">

              <h1
                style="
                  margin: 0 0 22px;
                  color: #1D2959;
                  font-size: 26px;
                "
              >
                Your Order Has Shipped!
              </h1>

              <p
                style="
                  font-size: 16px;
                  line-height: 1.7;
                  margin: 0 0 18px;
                "
              >
                Hi ${customerName},
              </p>

              <p
                style="
                  font-size: 16px;
                  line-height: 1.7;
                  margin: 0 0 24px;
                "
              >
                Great news! Your Freddy Graphics order
                <strong>#${jobNumber}</strong>
                has been shipped.
              </p>

              <!-- TRACKING -->

              <div
                style="
                  margin: 24px 0;
                  padding: 20px;
                  background: #f5f7fb;
                  border: 1px solid #e5e7eb;
                  border-left: 4px solid #1D2959;
                "
              >
                <div
                  style="
                    color: #666666;
                    font-size: 13px;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                  "
                >
                  Tracking Number
                </div>

                <div
                  style="
                    color: #1D2959;
                    font-size: 20px;
                    font-weight: 700;
                    word-break: break-all;
                  "
                >
                  ${trackingNumber}
                </div>
              </div>

              <p
                style="
                  margin-top: 24px;
                  font-size: 15px;
                  line-height: 1.7;
                "
              >
                You can use the tracking number above to follow
                your shipment with the shipping carrier.
              </p>

              <p
                style="
                  margin-top: 22px;
                  font-size: 15px;
                  line-height: 1.7;
                "
              >
                Thank you for choosing Freddy Graphics!
              </p>

              <p
                style="
                  margin-top: 22px;
                  font-size: 15px;
                "
              >
                <strong>Freddy Graphics LLC</strong>
              </p>

            </div>

            <div
              style="
                padding: 20px 32px;
                background: #f5f7fb;
                color: #777777;
                text-align: center;
                font-size: 12px;
                border-top: 1px solid #e5e7eb;
              "
            >
              Freddy Graphics LLC · Newark, New Jersey
            </div>

          </div>
        `,
      });

      // ------------------------------------------------
      // GUARDAR SHIPPING
      // ------------------------------------------------

      const updatedJob = await prisma.job.update({
        where: {
          id: jobId,
        },

        data: {
          fulfillmentMethod: "shipping",
          trackingNumber,
          shippingNotifiedAt: new Date(),
        },
      });

      console.log(
        `✅ SHIPPING notification sent for Job #${jobNumber} - ${trackingNumber}`,
      );

      return NextResponse.json({
        success: true,
        method: "shipping",
        trackingNumber,
        message: "Shipping notification sent.",
        job: updatedJob,
      });
    }
  } catch (error) {
    console.error("❌ JOB NOTIFICATION ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to send notification.",
      },
      {
        status: 500,
      },
    );
  }
}
