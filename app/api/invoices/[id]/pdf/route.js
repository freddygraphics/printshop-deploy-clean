export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export async function GET(req, { params }) {
  try {
    const invoiceId = params.id;

    const htmlUrl = `https://app.freddygraphics.com/api/invoices/${invoiceId}/html`;

    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto(htmlUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // 🔥 IMPORTANTE: esperar render completo
    await page.waitForTimeout(1000);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
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
      {
        error: "PDF generation failed",
        details: err.message,
      },
      { status: 500 },
    );
  }
}
