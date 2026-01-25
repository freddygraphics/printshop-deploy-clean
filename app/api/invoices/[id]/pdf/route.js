import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  try {
    const ENABLE_PDF = process.env.ENABLE_PDF === "true";
    if (!ENABLE_PDF) {
      return new NextResponse("PDF disabled", { status: 400 });
    }

    const puppeteer = (await import("puppeteer-core")).default;
    const chromium = (await import("@sparticuz/chromium")).default;

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    const baseUrl = `https://${process.env.VERCEL_URL}`;

    await page.goto(`${baseUrl}/api/invoices/${params.id}/html`, {
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
        "Content-Disposition": `inline; filename=invoice-${params.id}.pdf`,
      },
    });
  } catch (err) {
    console.error("PDF ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
