export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function GET(req, { params }) {
  try {
    const invoiceId = params.id;

    const htmlUrl = `https://app.freddygraphics.com/api/invoices/${invoiceId}/html`;

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto(htmlUrl, {
      waitUntil: "networkidle0",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
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
