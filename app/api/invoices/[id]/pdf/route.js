export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(req, { params }) {
  try {
    const invoiceId = params.id;

    // 🔥 Traer datos de invoice (usa tu endpoint real)
    const dataRes = await fetch(
      `https://app.freddygraphics.com/api/invoices/${invoiceId}`,
    );

    const invoice = await dataRes.json();

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 800;

    // 🔥 HEADER
    page.drawText("INVOICE", {
      x: 50,
      y,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    });

    y -= 40;

    page.drawText(`Invoice #: ${invoice.id}`, { x: 50, y, size: 12, font });
    y -= 20;

    page.drawText(`Customer: ${invoice.customerName}`, {
      x: 50,
      y,
      size: 12,
      font,
    });

    y -= 40;

    // 🔥 ITEMS
    invoice.items.forEach((item) => {
      page.drawText(`${item.name} - $${item.price}`, {
        x: 50,
        y,
        size: 11,
        font,
      });
      y -= 20;
    });

    y -= 20;

    page.drawText(`Total: $${invoice.total}`, {
      x: 50,
      y,
      size: 14,
      font,
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=invoice-${invoiceId}.pdf`,
      },
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "PDF generation failed", details: err.message },
      { status: 500 },
    );
  }
}
