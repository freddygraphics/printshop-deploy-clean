import { NextResponse } from "next/server";
export const runtime = "nodejs";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function GET(req, { params }) {
  // 🚫 BLOQUEAR LOCAL
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json(
      {
        error: "PDF generation is only available in production (Vercel).",
      },
      { status: 400 },
    );
  }

  try {
    const { id } = params;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const htmlUrl = `${baseUrl}/api/invoices/${id}/html`;

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(htmlUrl, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
    });

    await browser.close();

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${id}.pdf"`,
      },
    });
  } catch (err) {
    console.error("❌ PDF ERROR:", err);
    return NextResponse.json(
      { error: "PDF generation failed", details: err.message },
      { status: 500 },
    );
  }
}
