import { put } from "@vercel/blob";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function POST(req, { params }) {
  const id = params.id;

  try {
    const htmlUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/invoices/${id}/html`;

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(htmlUrl, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    await put(`invoices/${id}.pdf`, pdf, {
      access: "public",
      contentType: "application/pdf",
    });

    return new Response("OK");
  } catch (err) {
    console.error(err);
    return new Response("Error", { status: 500 });
  }
}
