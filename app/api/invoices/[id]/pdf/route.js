import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  try {
    const invoiceId = params.id;

    const pdfServiceUrl = process.env.PDF_SERVICE_URL;
    const secret = process.env.PDF_SECRET;

    if (!pdfServiceUrl || !secret) {
      return NextResponse.json(
        { error: "Missing PDF_SERVICE_URL or PDF_SECRET" },
        { status: 500 },
      );
    }

    const htmlUrl = `https://app.freddygraphics.com/api/invoices/${invoiceId}/html`;

    const r = await fetch(`${pdfServiceUrl}/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // timeout simple (Node 18+ / 20)
      body: JSON.stringify({ url: htmlUrl, token: secret }),
    });

    if (!r.ok) {
      const txt = await r.text();
      return NextResponse.json(
        { error: "PDF service error", status: r.status, details: txt },
        { status: 500 },
      );
    }

    const pdf = await r.arrayBuffer();

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=invoice-${invoiceId}.pdf`,
      },
    });
  } catch (err) {
    console.error("PDF PROXY ERROR:", err);
    return NextResponse.json(
      { error: "PDF proxy failed", details: err.message },
      { status: 500 },
    );
  }
}
