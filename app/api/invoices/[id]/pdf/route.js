import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  const invoiceId = params.id;

  // 🔐 Flag controlado por Vercel
  const ENABLE_PDF = process.env.ENABLE_PDF === "true";

  if (!ENABLE_PDF) {
    return new NextResponse("PDF generation disabled. Use /html preview.", {
      status: 400,
    });
  }

  const puppeteer = (await import("puppeteer-core")).default;
  const chromium = (await import("@sparticuz/chromium")).default;

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  await page.goto(`${baseUrl}/api/invoices/${invoiceId}/html`, {
    waitUntil: "networkidle0",
  });

  const pdf = await page.pdf({
    format: "Letter",
    printBackground: true,
  });

  await browser.close();

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=invoice-${invoiceId}.pdf`,
    },
  });
}
