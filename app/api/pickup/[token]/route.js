import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ============================================
// GET — VALIDATE PICKUP QR
// ============================================

export async function GET(req, { params }) {
  try {
    const { token } = await params;

    const session = await auth();

    // ----------------------------------------
    // PUBLIC / CUSTOMER
    // ----------------------------------------

    if (!session?.user?.id) {
      const job = await prisma.job.findUnique({
        where: {
          pickupToken: token,
        },
        select: {
          pickedUpAt: true,
        },
      });

      if (!job) {
        return NextResponse.json(
          {
            valid: false,
            error: "INVALID_PICKUP_CODE",
          },
          { status: 404 },
        );
      }

      if (job.pickedUpAt) {
        return NextResponse.json({
          valid: true,
          staff: false,
          pickedUp: true,
          message: "This pickup code has already been used.",
        });
      }

      return NextResponse.json({
        valid: true,
        staff: false,
        pickedUp: false,
        message:
          "Your order is ready for pickup. Please show this QR code to Freddy Graphics staff.",
      });
    }

    // ----------------------------------------
    // AUTHENTICATED STAFF
    // ----------------------------------------

    const job = await prisma.job.findUnique({
      where: {
        pickupToken: token,
      },

      select: {
        id: true,
        jobNumber: true,
        status: true,
        pickedUpAt: true,
        pickedUpBy: true,
        deliveredAt: true,

        client: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },

        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            balance: true,
            paymentStatus: true,
            total: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          valid: false,
          error: "INVALID_PICKUP_CODE",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      valid: true,
      staff: true,
      pickedUp: Boolean(job.pickedUpAt),
      job: {
        ...job,
        invoice: job.invoice
          ? {
              ...job.invoice,
              balance: Number(job.invoice.balance || 0),
              total: Number(job.invoice.total || 0),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("❌ PICKUP GET ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to validate pickup code",
      },
      { status: 500 },
    );
  }
}

// ============================================
// POST — CONFIRM PICKUP
// ============================================

export async function POST(req, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Staff login required.",
        },
        { status: 401 },
      );
    }

    const { token } = await params;

    const job = await prisma.job.findUnique({
      where: {
        pickupToken: token,
      },

      select: {
        id: true,
        jobNumber: true,
        pickedUpAt: true,

        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            balance: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          error: "INVALID_PICKUP_CODE",
          message: "Invalid pickup code.",
        },
        { status: 404 },
      );
    }

    if (job.pickedUpAt) {
      return NextResponse.json(
        {
          error: "ALREADY_PICKED_UP",
          message: "This order has already been picked up.",
        },
        { status: 400 },
      );
    }

    if (!job.invoice) {
      return NextResponse.json(
        {
          error: "INVOICE_NOT_FOUND",
          message: "Invoice not found.",
        },
        { status: 400 },
      );
    }

    const balance = Number(job.invoice.balance || 0);

    // ----------------------------------------
    // PAYMENT REQUIRED
    // ----------------------------------------

    if (balance > 0.01) {
      return NextResponse.json(
        {
          error: "PAYMENT_REQUIRED",
          message: "Invoice has an outstanding balance.",
          invoiceId: job.invoice.id,
          invoiceNumber: job.invoice.invoiceNumber,
          balance,
        },
        { status: 400 },
      );
    }

    const now = new Date();

    const updatedJob = await prisma.job.update({
      where: {
        id: job.id,
      },

      data: {
        status: "Delivered",
        pickedUpAt: now,
        deliveredAt: now,

        pickedUpBy:
          session.user.name || session.user.email || `User ${session.user.id}`,
      },
    });

    console.log(
      `✅ PICKUP completed for Job #${job.jobNumber} by ${updatedJob.pickedUpBy}`,
    );

    return NextResponse.json({
      success: true,
      job: updatedJob,
    });
  } catch (error) {
    console.error("❌ PICKUP POST ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to complete pickup",
      },
      { status: 500 },
    );
  }
}
