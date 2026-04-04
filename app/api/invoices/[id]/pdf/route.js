export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const pdfCache = new Map();

export async function GET(req, context) {
  try {
    const { id } = await context.params;

    // ⚡ CACHE
    if (pdfCache.has(id)) {
      return new Response(pdfCache.get(id), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename=invoice-${id}.pdf`,
        },
      });
    }

    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();

    // 🔥 URL DINÁMICA (FIX IMPORTANTE)
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

    pdfCache.set(id, pdf);

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=invoice-${id}.pdf`,
      },
    });
  } catch (err) {
    console.error("❌ ERROR REAL:", err);
    return new Response(err.message, { status: 500 });
  }
}
