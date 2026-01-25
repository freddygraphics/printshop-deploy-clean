import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const invoiceId = params.id;

  const isServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  let browser;

  if (isServerless) {
    const puppeteer = (await import("puppeteer-core")).default;
    const chromium = (await import("@sparticuz/chromium")).default;

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  } else {
    // ⚠️ LOCAL: NO intentes PDF
    return new NextResponse(
      "PDF generation disabled in local. Use /html preview.",
      { status: 400 },
    );
  }

  const page = await browser.newPage();

  await page.goto(
    `https://${process.env.VERCEL_URL}/api/invoices/${invoiceId}/html`,
    { waitUntil: "networkidle0" },
  );

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
