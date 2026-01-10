import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    }

    // Leer Excel
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let imported = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        // Si no trae nombre → saltar fila
        if (!row.name || row.name.trim() === "") {
          errors++;
          continue;
        }

        await prisma.client.create({
          data: {
            name: row.name || null,
            company: row.company || null,
            email: row.email || null,
            phone: row.phone || null,
            address: row.address || null,
            city: null,
            state: null,
            country: null,
            zip: null,
          },
        });

        imported++;
      } catch (err) {
        errors++;
      }
    }

    return NextResponse.json({
      imported,
      errors,
      total: rows.length,
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Error procesando archivo" },
      { status: 500 }
    );
  }
}
