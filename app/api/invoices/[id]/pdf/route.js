export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextResponse } from "next/server";

import puppeteer from "puppeteer";

export async function GET(req, { params }) {
  try {
    const invoiceId = params.id;

    // 🔥 URL que ya usabas (perfecto)
    const htmlUrl = `https://app.freddygraphics.com/api/invoices/${invoiceId}/html`;

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "new",
    });

    const page = await browser.newPage();

    // 🔐 Si tu endpoint necesita cookies/session, dímelo luego
    await page.goto(htmlUrl, {
      waitUntil: "networkidle0",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    });

    await browser.close();

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=invoice-${invoiceId}.pdf`,
      },
    });
  } catch (err) {
    console.error("PDF ERROR:", err);

    return NextResponse.json(
      { error: "PDF generation failed", details: err.message },
      { status: 500 },
    );
  }
}
