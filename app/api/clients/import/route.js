export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import * as XLSX from "xlsx";

/* 🔥 Función para limpiar teléfonos */
function normalizePhone(value) {
  if (!value) return null;

  let phone = String(value).trim();

  // Si viene en notación científica (1.85E+10)
  if (phone.includes("E+")) {
    phone = Number(phone).toLocaleString("fullwide", {
      useGrouping: false,
    });
  }

  // Asegurar que tenga +
  if (!phone.startsWith("+")) {
    phone = "+" + phone;
  }

  return phone;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No se envió archivo" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let imported = 0;
    let errors = [];

    for (const row of rows) {
      try {
        const name = row.name || row.Name || null;
        if (!name) {
          errors.push({ row, reason: "No name" });
          continue;
        }

        const email = row.email || row.Email || null;

        const phone = normalizePhone(row.phone || row.Phone || null);

        await prisma.client.create({
          data: {
            name,
            company: row.company || row.Company || null,
            email,
            phone,
            address: row.address || null,
            city: row.city || null,
            state: row.state || null,
            country: row.country || null,
            zip: row.zip || null,
          },
        });

        imported++;
      } catch (err) {
        errors.push({
          row,
          reason: err.message,
        });
      }
    }

    return NextResponse.json({
      imported,
      errors: errors.length,
      total: rows.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error procesando archivo" },
      { status: 500 },
    );
  }
}
