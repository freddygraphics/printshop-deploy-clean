import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

export async function GET(req, { params }) {
  try {
    const id = Number(params.id);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!invoice || !invoice.qrToken) {
      return NextResponse.json({ error: "Invalid invoice" }, { status: 404 });
    }

    // 📏 Tamaño exacto 3w x 1.5h pulgadas
    const width = 216; // 3"
    const height = 108; // 1.5"

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([width, height]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // 🔳 Generar QR
    const qrDataUrl = await QRCode.toDataURL(
      `${process.env.NEXT_PUBLIC_APP_URL}/scan?token=${invoice.qrToken}`,
      { margin: 0, width: 90 }
    );

    const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    // 📐 Posiciones
    const qrSize = 72; // 1"
    const qrX = 10;
    const qrY = height - qrSize - 10;

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });

    // 🧾 Texto
    page.drawText(`Invoice #${invoice.invoiceNumber}`, {
      x: qrX + qrSize + 8,
      y: height - 22,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(invoice.client?.name || "", {
      x: qrX + qrSize + 8,
      y: height - 36,
      size: 8,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(invoice.client?.company || "", {
      x: qrX + qrSize + 8,
      y: height - 50,
      size: 7,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNumber}-qr.pdf"`,
      },
    });
  } catch (error) {
    console.error("QR PDF error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
