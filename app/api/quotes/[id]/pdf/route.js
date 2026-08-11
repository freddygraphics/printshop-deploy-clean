import prisma from "@/lib/db";
import { buildDocumentPdf } from "@/lib/pdf/buildDocumentPdf";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const quoteId = Number(id);

    if (!Number.isInteger(quoteId) || quoteId <= 0) {
      return new Response("Invalid quote id", {
        status: 400,
      });
    }

    // ======================================================
    // LOAD QUOTE
    // ======================================================
    const quote = await prisma.quote.findUnique({
      where: {
        id: quoteId,
      },

      include: {
        client: true,
        items: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!quote) {
      return new Response("Quote not found", {
        status: 404,
      });
    }

    // ======================================================
    // LOAD LOGO
    // ======================================================
    let logoBytes = null;

    try {
      const logoPath = path.join(process.cwd(), "public", "logo.png");

      const logoBuffer = await fs.readFile(logoPath);

      logoBytes = logoBuffer;
    } catch (error) {
      console.warn("⚠️ Could not load logo:", error);
    }

    // ======================================================
    // GENERATE PDF DIRECTLY WITH PDF-LIB
    // ======================================================
    const pdfBytes = await buildDocumentPdf({
      documentType: "quote",

      documentNumber: quote.quoteNumber ?? quote.id,

      issuedAt: quote.quoteDate,
      dueDate: quote.validUntil,

      status: quote.status,

      client: quote.client,

      items: quote.items || [],

      subtotal: Number(quote.subtotal || 0),
      tax: Number(quote.tax || 0),
      total: Number(quote.total || 0),

      discountAmount: Number(quote.discountAmount || 0),

      discountLabel: quote.discountLabel || null,

      payments: [],

      balance: Number(quote.total || 0),

      logoBytes,
    });

    // ======================================================
    // FILE NAME
    // ======================================================
    const companyName =
      quote.client?.company || quote.client?.name || "Customer";

    const safeCompanyName = String(companyName)
      .replace(/[<>:"/\\|?*]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    const documentNumber = quote.quoteNumber ?? quote.id;

    const fileName = `${safeCompanyName}-Quote-${documentNumber}.pdf`;

    // ======================================================
    // RETURN REAL PDF
    // ======================================================
    return new Response(pdfBytes, {
      status: 200,

      headers: {
        "Content-Type": "application/pdf",

        "Content-Disposition": `inline; filename="${fileName}"`,

        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",

        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("❌ Quote PDF error:", error);

    return new Response("Could not generate quote PDF", {
      status: 500,
    });
  }
}
