export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";

import prisma from "@/lib/db";

export async function PUT(req, context) {
  try {
    const { id } = await context.params;

    const jobId = Number(id);
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    // --------------------------------------------
    // BUSCAR JOB ACTUAL
    // --------------------------------------------

    const currentJob = await prisma.job.findUnique({
      where: {
        id: jobId,
      },
    });

    if (!currentJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // --------------------------------------------
    // DETECTAR CUANDO ENTRA A READY
    // --------------------------------------------

    const becomingReady = currentJob.status !== "Ready" && status === "Ready";

    const data = {
      status,
    };

    // --------------------------------------------
    // GENERAR PICKUP TOKEN
    // Lo dejamos preparado para el QR futuro.
    // NO envía ninguna notificación.
    // --------------------------------------------

    if (becomingReady && !currentJob.pickupToken) {
      data.pickupToken = crypto.randomBytes(32).toString("hex");
    }

    // --------------------------------------------
    // DELIVERED
    // --------------------------------------------

    if (status === "Delivered") {
      data.deliveredAt = new Date();
    }

    if (status !== "Delivered") {
      data.deliveredAt = null;
      data.archived = false;
      data.archivedAt = null;
    }

    // --------------------------------------------
    // ACTUALIZAR JOB
    // --------------------------------------------

    const job = await prisma.job.update({
      where: {
        id: jobId,
      },
      data,
    });

    // IMPORTANTE:
    // Mover un Job a Ready ya NO envía email.
    // La notificación se enviará desde JobModal
    // cuando se seleccione Pickup o Shipping.

    return NextResponse.json({
      ...job,
      becomingReady,
    });
  } catch (error) {
    console.error("❌ UPDATE JOB STATUS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to update job status",
      },
      {
        status: 500,
      },
    );
  }
}
