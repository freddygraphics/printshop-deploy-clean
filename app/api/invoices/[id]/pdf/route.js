import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req, context) {
  try {
    const { id } = await context.params;

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    await page.goto(`${baseUrl}/api/invoices/${id}/html`, {
      waitUntil: "domcontentloaded",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    console.error("❌ ERROR REAL:", err);
    return new Response(err.message, { status: 500 });
  }
}
